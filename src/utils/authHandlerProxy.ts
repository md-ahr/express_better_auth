import type { IncomingMessage, ServerResponse } from "node:http";
import { toNodeHandler } from "better-auth/node";
import type { Auth } from "better-auth";
import { transformToApiFormat } from "./wrapAuthResponse";

/**
 * Runs the auth handler with a proxy response that captures the output,
 * transforms it to our structured format { status, data, error }, and sends to the real res.
 * Use for endpoints where the wrapper may not intercept (e.g. sign-out, reset-password).
 */
export async function runAuthWithStructuredResponse(
  auth: Auth,
  req: IncomingMessage,
  res: ServerResponse,
  targetPath: string
): Promise<void> {
  const chunks: Buffer[] = [];
  const originalEnd = res.end.bind(res);

  const proxyRes = new Proxy(res, {
    get(target, prop) {
      if (prop === "write") {
        return function (chunk: any, encoding?: any, callback?: any) {
          if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          if (typeof callback === "function") process.nextTick(() => callback());
          return true;
        };
      }
      // Intercept json() and send() - adapter may use these; ensure we transform the body
      if (prop === "json") {
        return function (body: any) {
          const statusCode = res.statusCode ?? 500;
          const transformed = transformToApiFormat(body, statusCode, targetPath);
          res.removeHeader("Content-Length");
          res.setHeader("Content-Type", "application/json");
          return originalEnd(JSON.stringify(transformed), "utf8", undefined);
        };
      }
      if (prop === "send") {
        return function (body: any) {
          if (typeof body === "object" && body !== null && !Buffer.isBuffer(body)) {
            const statusCode = res.statusCode ?? 500;
            const transformed = transformToApiFormat(body, statusCode, targetPath);
            res.removeHeader("Content-Length");
            res.setHeader("Content-Type", "application/json");
            return originalEnd(JSON.stringify(transformed), "utf8", undefined);
          }
          return originalEnd(body != null ? body.toString() : "", "utf8", undefined);
        };
      }
      if (prop === "end") {
        return function (
          chunk?: any,
          encoding?: BufferEncoding | (() => void),
          callback?: () => void
        ) {
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
          const fullBody =
            body !== undefined && body !== null
              ? body.toString()
              : chunks.length > 0
                ? Buffer.concat(chunks).toString()
                : undefined;

          const statusCode = res.statusCode ?? 500;
          const enc = typeof encoding === "string" ? encoding : ("utf8" as BufferEncoding);

          if (fullBody?.trim()) {
            const trimmed = fullBody.trim();
            const looksLikeJson =
              (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
              (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
              trimmed === "null";
            if (looksLikeJson) {
              try {
                const parsed = trimmed === "null" ? null : JSON.parse(fullBody);
                const transformed = transformToApiFormat(parsed, statusCode, targetPath);
                res.removeHeader("Content-Length");
                res.setHeader("Content-Type", "application/json");
                return originalEnd(JSON.stringify(transformed), enc, cb);
              } catch {
                // fall through
              }
            }
          }

          // Fallback: ensure we always send a body for 2xx responses
          if (statusCode >= 200 && statusCode < 300 && !fullBody?.trim()) {
            const transformed = transformToApiFormat(null, statusCode, targetPath);
            res.removeHeader("Content-Length");
            res.setHeader("Content-Type", "application/json");
            return originalEnd(JSON.stringify(transformed), enc, cb);
          }

          return originalEnd(chunk, encoding as BufferEncoding, cb);
        };
      }
      return (target as any)[prop];
    },
  });

  const handler = toNodeHandler(auth);
  try {
    await handler(req, proxyRes);
  } finally {
    // Safety: if handler completed without sending (e.g. adapter bypassed our interceptors), send default
    if (!res.writableEnded && (res.statusCode ?? 500) >= 200 && (res.statusCode ?? 500) < 300) {
      const transformed = transformToApiFormat(null, res.statusCode ?? 200, targetPath);
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(transformed));
    }
  }
}
