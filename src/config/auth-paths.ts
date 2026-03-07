/**
 * Maps user-friendly API paths to better-auth internal paths.
 * All paths are relative to /api/v1/auth
 */
export const AUTH_PATH_MAP: Record<string, string> = {
  "/login": "/sign-in/email",
  "/register": "/sign-up/email",
  "/forgot-password": "/request-password-reset",
  "/send-verification-email": "/send-verification-email", // same
  "/verify-email": "/verify-email", // same
  "/reset-password": "/reset-password", // same
  "/logout": "/sign-out", // alias for sign-out
  "/me": "/get-session", // better-auth uses get-session
};

export function resolveAuthPath(requestPath: string): string {
  const basePath = "/api/v1/auth";
  const path = requestPath.startsWith(basePath)
    ? requestPath.slice(basePath.length) || "/"
    : requestPath;

  // Handle /reset-password/:token (GET) - no mapping needed
  if (path.startsWith("/reset-password/")) return path;

  const pathWithoutQuery = path.split("?")[0];
  const mapped = AUTH_PATH_MAP[pathWithoutQuery];
  if (mapped) {
    return path.replace(pathWithoutQuery, mapped);
  }
  return path;
}
