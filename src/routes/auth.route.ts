import express, { type Router } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth";
import { successResponse, errorResponse } from "../utils/response";

const router: Router = express.Router();

router.get("/me", async (req, res) => {
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
        return errorResponse(res, "Unauthorized", 401);
    }

    successResponse(res, session);
});

export default router;
