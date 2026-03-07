import type { ServerResponse } from "node:http";

/** Endpoint-specific messages for minimal { status: true } responses */
const AUTH_SUCCESS_MESSAGES: Record<string, string> = {
  "/reset-password": "Your password has been reset successfully. You can now sign in with your new password.",
  "/request-password-reset": "If this email exists in our system, check your inbox for the password reset link.",
  "/verify-password": "Password verified successfully.",
  "/sign-out": "You have been signed out successfully.",
};

/** Normalize better-auth minimal success responses to our format with a meaningful message */
function normalizeSuccessData(parsed: unknown, path: string): unknown {
  const obj = parsed as Record<string, unknown> | null;
  if (!obj || typeof obj !== "object") return parsed;
  // { status: true } or { status: true, message?: string } -> normalize to our format
  if (obj.status === true && Object.keys(obj).length <= 2) {
    const pathSuffix = path.split("/auth").pop()?.split("?")[0] || "";
    const message =
      (obj.message as string) || AUTH_SUCCESS_MESSAGES[pathSuffix] || "Operation completed successfully.";
    return { message };
  }
  return parsed;
}

/**
 * Transforms parsed JSON into our API format: { status, data, error }
 */
function transformToApiFormat(parsed: unknown, statusCode: number, path: string) {
  const isSuccess = statusCode >= 200 && statusCode < 300;
  if (isSuccess) {
    const data = normalizeSuccessData(parsed, path);
    return { status: true, data, error: null };
  }
  const obj = parsed as Record<string, unknown> | null;
  const message =
    (obj?.message as string) ??
    (obj?.error as string) ??
    (typeof parsed === "string" ? parsed : "An error occurred");
  return { status: false, data: null, error: message };
}

/**
 * Wraps the response to transform better-auth output (login, register, sign-out, etc.)
 * into our API format: { status: boolean, data: T | null, error: string | null }
 * @param path - Request path (e.g. /api/v1/auth/reset-password) for endpoint-specific messages
 */
export function wrapAuthResponse(res: ServerResponse, path = ""): ServerResponse {
  const chunks: Buffer[] = [];
  const originalWrite = res.write.bind(res);
  const originalEnd = res.end.bind(res);

  res.write = function (
    chunk: any,
    encoding?: BufferEncoding | ((err?: Error) => void),
    callback?: (err?: Error) => void
  ): boolean {
    if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    const cb = typeof encoding === "function" ? encoding : callback;
    if (cb) process.nextTick(() => cb());
    return true; // Don't send original body - we'll send transformed in end()
  };

  res.end = function (
    chunk?: any,
    encoding?: BufferEncoding | (() => void),
    callback?: () => void
  ): ServerResponse {
    let body: string | undefined;
    let cb: (() => void) | undefined;

    if (typeof chunk === "function") {
      cb = chunk;
    } else if (typeof encoding === "function") {
      body = chunk;
      cb = encoding;
    } else {
      body = chunk;
      cb = callback;
    }

    const enc = typeof encoding === "string" ? encoding : undefined;
    const fullBody =
      body !== undefined && body !== null
        ? body.toString()
        : chunks.length > 0
          ? Buffer.concat(chunks).toString()
          : undefined;

    if (fullBody && fullBody.trim().length > 0) {
      const trimmed = fullBody.trim();
      const looksLikeJson =
        (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
        (trimmed.startsWith("[") && trimmed.endsWith("]"));

      if (looksLikeJson) {
        try {
          const parsed = JSON.parse(fullBody);
          const statusCode = res.statusCode ?? 500;
          const transformed = transformToApiFormat(parsed, statusCode, path);
          res.removeHeader("Content-Length");
          res.setHeader("Content-Type", "application/json");
          return originalEnd(JSON.stringify(transformed), enc, cb);
        } catch {
          // Not valid JSON, pass through
        }
      }
    }

    const toSend = fullBody ?? (body !== undefined && body !== null ? body : undefined);
    return originalEnd(toSend, enc, cb);
  };

  return res;
}
