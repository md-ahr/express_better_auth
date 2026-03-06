import express, { type Request, type Router } from "express";
import { successResponse } from "../utils/response";

const router: Router = express.Router()

router.post("/register", async (_req: Request, res) => {
    successResponse(res, { message: "User registered successfully" });
})

router.post("/login", async (_req: Request, res) => {
    successResponse(res, { message: "User logged in successfully" });
})

export default router;
