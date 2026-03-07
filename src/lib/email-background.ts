/**
 * Runs an async email-sending function in the background.
 * Response returns immediately; email is sent asynchronously.
 * Handles failures without blocking or throwing to the caller.
 *
 * Edge cases handled:
 * - Invalid/missing email: skip send, log warning
 * - SMTP errors: log, no unhandled rejection
 * - Null/undefined user: validated by caller before invoking
 */
export function sendEmailInBackground(
  fn: () => Promise<void>,
  context: { type: string; email?: string; userId?: string }
): void {
  // Skip if no valid email to send to
  if (!context.email || typeof context.email !== "string" || !context.email.trim()) {
    console.warn(`[Email Skipped] ${context.type}: no valid email address`, {
      userId: context.userId,
    });
    return;
  }

  setImmediate(() => {
    fn().catch((err) => {
      const meta = [
        context.type,
        `to=${context.email}`,
        context.userId && `userId=${context.userId}`,
      ]
        .filter(Boolean)
        .join(" ");
      console.error(`[Email Failed] ${meta}:`, err?.message ?? err);
      // Ensure no unhandled rejection - errors are logged only
    });
  });
}
