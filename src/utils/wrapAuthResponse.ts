import type { ServerResponse } from "node:http";

/**
 * Transforms parsed JSON into our API format: { status, data, error }
 */
function transformToApiFormat(parsed: unknown, statusCode: number) {
  const isSuccess = statusCode >= 200 && statusCode < 300;
  if (isSuccess) {
    return { status: true, data: parsed, error: null };
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
 */
export function wrapAuthResponse(res: ServerResponse): ServerResponse {
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

    if (fullBody) {
      const contentType = res.getHeader("content-type");
      const isJson =
        typeof contentType === "string" &&
        contentType.includes("application/json");

      if (isJson) {
        try {
          const parsed = JSON.parse(fullBody);
          const statusCode = res.statusCode ?? 500;
          const transformed = transformToApiFormat(parsed, statusCode);
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
