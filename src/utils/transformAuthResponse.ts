import type { Request, Response } from "express";
import { wrapAuthResponse } from "./wrapAuthResponse";

/**
 * Runs an auth handler with a wrapped response that transforms output to
 * { status, data, error } format. Use for endpoints that bypass the main auth route.
 */
export async function transformAuthResponse(
  req: Request,
  res: Response,
  targetPath: string,
  handler: (req: Request, res: Response) => Promise<void>
): Promise<void> {
  const originalUrl = req.url;
  (req as any).url = targetPath;
  const wrappedRes = wrapAuthResponse(res, targetPath);
  try {
    await handler(req, wrappedRes as any);
  } finally {
    (req as any).url = originalUrl;
  }
}
