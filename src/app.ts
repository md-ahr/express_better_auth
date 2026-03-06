import express, {type Express, type Request, type Response, type NextFunction} from 'express';
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import healthRoute from "./routes/health.route"
import authRoute from "./routes/auth.route"
import { globalErrorHandler } from "./middleware/error.middleware";
import { AppError } from "./utils/appError";
import { errorResponse } from "./utils/response";

const app: Express = express();

const API_PREFIX = "/api/v1";

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
app.use(cors(corsOptions))

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(`${API_PREFIX}/health`, healthRoute);
app.use(`${API_PREFIX}/auth`, authRoute);

app.all('/{*splat}', (req: Request, _res: Response, next: NextFunction) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

export default app;
