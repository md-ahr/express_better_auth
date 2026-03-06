import { type Request, type Response, type NextFunction } from 'express';
import { ENV } from '../config/env';
import { errorResponse } from '../utils/response';

export const globalErrorHandler = (
    err: any,
    _req: Request,
    res: Response,
    _next: NextFunction
) => {
    err.statusCode = err.statusCode || 500;

    // Always return end-user readable message (never stack traces or file paths)
    const userMessage = err.isOperational
        ? err.message
        : 'Something went wrong. Please try again later.';

    if (ENV.NODE_ENV === 'development') {
        // Log full details for debugging, but response stays user-readable
        console.error('ERROR 💥', err.stack || err);
    }

    errorResponse(res, userMessage, err.statusCode);
};
