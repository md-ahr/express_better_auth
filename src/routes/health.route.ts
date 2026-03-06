import express, { type Request, type Router } from "express";
import { sql } from 'drizzle-orm';
import { db } from "../db";
import { successResponse, errorResponse } from "../utils/response";

const router: Router = express.Router()
router.get("/", async (_req: Request, res) => {
    const healthData = {
        status: 'UP' as const,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
            database: 'UNKNOWN' as const,
            server: 'OK' as const
        }
    };

    try {
        await db.execute(sql`SELECT 1`);
        healthData.services.database = 'OK';
        successResponse(res, healthData);
    } catch (error) {
        healthData.status = 'DOWN';
        healthData.services.database = 'ERROR';

        // Log the actual error for internal debugging
        console.error('Health check failed:', error);

        // Return 503 (Service Unavailable) so load balancers can pull the node
        errorResponse(res, 'Health check failed', 503);
    }
});

export default router;
