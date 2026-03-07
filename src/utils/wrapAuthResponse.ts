import type { ServerResponse } from "node:http";

/** Endpoint-specific messages for minimal { status: true } responses */
const AUTH_SUCCESS_MESSAGES: Record<string, string> = {
  "/reset-password": "Your password has been reset successfully. You can now sign in with your new password.",
  "/request-password-reset": "If this email exists in our system, check your inbox for the password reset link.",
  "/verify-password": "Password verified successfully.",
  "/sign-out": "You have been signed out successfully.",
  "/logout": "You have been signed out successfully.",
  "/get-session": "Session refreshed successfully.",
};

/** Get message for path, supporting prefix match (e.g. /reset-password/TOKEN -> /reset-password) */
function getMessageForPath(path: string, obj?: Record<string, unknown>): string {
  const pathSuffix = path.split("/auth").pop()?.split("?")[0] || "";
  const exact = AUTH_SUCCESS_MESSAGES[pathSuffix];
  if (exact) return exact;
  // Prefix match for dynamic routes like /reset-password/abc123
  for (const [key, msg] of Object.entries(AUTH_SUCCESS_MESSAGES)) {
    if (pathSuffix.startsWith(key)) return msg;
  }
  return (obj?.message as string) || "Operation completed successfully.";
}

/** Normalize better-auth minimal success responses to our format with a meaningful message */
function normalizeSuccessData(parsed: unknown, path: string): unknown {
  const obj = parsed as Record<string, unknown> | null;
  if (!obj || typeof obj !== "object") return parsed;
  const getMessage = () => getMessageForPath(path, obj!);
  // { status: true } or { status: true, message?: string } -> normalize to our format
  if (obj.status === true && Object.keys(obj).length <= 2) {
    return { message: getMessage() };
  }
  // better-auth sign-out returns { success: true }
  if (obj.success === true && Object.keys(obj).length <= 2) {
    return { message: getMessage() };
  }
  return parsed;
}

/**
 * Transforms parsed JSON into our API format: { status, data, error }
 */
export function transformToApiFormat(parsed: unknown, statusCode: number, path: string) {
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

/** Apply structured format transformation to a response body */
function applyTransform(
  res: ServerResponse,
  body: unknown,
  path: string,
  originalEnd: (chunk?: any, encoding?: any, cb?: any) => ServerResponse
): ServerResponse {
  const statusCode = res.statusCode ?? 500;
  const transformed = transformToApiFormat(body, statusCode, path);
  res.removeHeader("Content-Length");
  res.setHeader("Content-Type", "application/json");
  return originalEnd(JSON.stringify(transformed), "utf8", undefined);
}

export function wrapAuthResponse(res: ServerResponse, path = ""): ServerResponse {
  const chunks: Buffer[] = [];
  const originalWrite = res.write.bind(res);
  const originalEnd = res.end.bind(res);

  // Override res.json and res.send (Express) - better-auth adapter may use these
  const expressRes = res as ServerResponse & { json?: (body: any) => void; send?: (body: any) => void };
  if (typeof expressRes.json === "function") {
    const originalJson = expressRes.json.bind(expressRes);
    expressRes.json = function (body: any) {
      return applyTransform(res, body, path, originalEnd);
    };
  }
  if (typeof expressRes.send === "function") {
    const originalSend = expressRes.send.bind(expressRes);
    expressRes.send = function (body: any) {
      if (typeof body === "object" && body !== null && !Buffer.isBuffer(body)) {
        return applyTransform(res, body, path, originalEnd);
      }
      return originalSend(body);
    };
  }

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

      if (looksLikeJson || trimmed === "null") {
        try {
          const parsed = trimmed === "null" ? null : JSON.parse(fullBody);
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

    // Fallback: 2xx with no body - send default structured response
    const statusCode = res.statusCode ?? 500;
    if (statusCode >= 200 && statusCode < 300 && !fullBody?.trim()) {
      const transformed = transformToApiFormat(null, statusCode, path);
      res.removeHeader("Content-Length");
      res.setHeader("Content-Type", "application/json");
      return originalEnd(JSON.stringify(transformed), enc, cb);
    }

    const toSend = fullBody ?? (body !== undefined && body !== null ? body : undefined);
    return originalEnd(toSend ?? "", enc, cb);
  };

  return res;
}
