import express, {type Express, type Request, type Response, type NextFunction} from 'express';
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth";
import { wrapAuthResponse } from "./utils/wrapAuthResponse";
import { resolveAuthPath } from "./config/auth-paths";
import healthRoute from "./routes/health.route";
import authRoute from "./routes/auth.route";
import { globalErrorHandler } from "./middleware/error.middleware";
import { AppError } from "./utils/appError";
import { errorResponse } from "./utils/response";

const app: Express = express();

const API_PREFIX = "/api/v1";
const AUTH_BASE = `${API_PREFIX}/auth`;

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
};

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: 'draft-7', // combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (_req, res) => {
        errorResponse(res, 'Too many requests from this IP, please try again after 15 minutes', 429);
    },
});

app.use(limiter);
app.use(helmet());
app.use(morgan("dev"));
app.use(cors(corsOptions));

// Custom /me route first
app.use(AUTH_BASE, authRoute);

// Set fallback Origin for auth routes when missing (Postman, curl, mobile apps often omit it)
app.use(AUTH_BASE, (req, _res, next) => {
    if (!req.headers.origin && process.env.BETTER_AUTH_URL) {
        req.headers.origin = process.env.BETTER_AUTH_URL;
    }
    next();
});

// Better Auth handler MUST be before body parsers (needs raw body for POST)
// Path mapping + response wrapper for { status, data, error } format
app.all(`${AUTH_BASE}/*splat`, (req, res, next) => {
    const fullPath = req.originalUrl?.split("?")[0] || req.url?.split("?")[0] || "";
    const mappedPath = AUTH_BASE + resolveAuthPath(fullPath);
    if (mappedPath !== fullPath) {
        const query = req.url?.includes("?") ? "?" + req.url.split("?")[1] : "";
        (req as any).url = mappedPath + query;
    }
    const wrappedRes = wrapAuthResponse(res, mappedPath);
    toNodeHandler(auth)(req, wrappedRes).catch(next);
});

app.use(`${API_PREFIX}/health`, healthRoute);

app.all('/{*splat}', (req: Request, _res: Response, next: NextFunction) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

export default app;
