import { sendEmail } from "./email";
import type { User } from "better-auth";

export interface ResetPasswordEmailParams {
  user: User;
  url: string;
  token: string;
}

export async function sendResetPasswordEmail(
  params: ResetPasswordEmailParams
): Promise<void> {
  const { user, url } = params;
  const appName = process.env.APP_NAME || "App";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Reset your password</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="margin: 0 0 20px;">Hi ${user.name || "there"},</p>
    <p style="margin: 0 0 20px;">We received a request to reset your password for ${appName}. Click the button below to choose a new password:</p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="${url}" style="display: inline-block; background: #667eea; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600;">Reset Password</a>
    </p>
    <p style="margin: 20px 0 0; font-size: 14px; color: #6b7280;">Or copy and paste this link into your browser:</p>
    <p style="margin: 8px 0 0; word-break: break-all; font-size: 12px; color: #667eea;">${url}</p>
    <p style="margin: 30px 0 0; font-size: 12px; color: #9ca3af;">This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
  </div>
</body>
</html>
  `.trim();

  const text = `
Hi ${user.name || "there"},

We received a request to reset your password for ${appName}. Visit this link to choose a new password:

${url}

This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
  `.trim();

  try {
    await sendEmail({
      to: user.email,
      subject: `Reset your password for ${appName}`,
      html,
      text,
    });
  } catch (err) {
    console.error("[Reset Password Email] Failed to send:", err);
    throw err;
  }
}
