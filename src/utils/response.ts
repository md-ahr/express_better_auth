import type { Response } from "express";

export interface ApiResponse<T = unknown> {
  status: boolean;
  data: T | null;
  error: string | null;
}

export function successResponse<T>(
  res: Response,
  data: T,
  statusCode = 200
): Response<ApiResponse<T>> {
  return res.status(statusCode).json({
    status: true,
    data,
    error: null,
  });
}

export function errorResponse(
  res: Response,
  error: string,
  statusCode = 500
): Response<ApiResponse<never>> {
  return res.status(statusCode).json({
    status: false,
    data: null,
    error,
  });
}
