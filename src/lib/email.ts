import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

/** Escape HTML to prevent XSS in email templates */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: { user, pass },
  });

  return transporter;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  /** For dev logging when SMTP not configured */
  verificationUrl?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@localhost";
  const transport = getTransporter();

  if (!transport) {
    // Development fallback: log the email (including verification URL) instead of sending
    if (process.env.NODE_ENV === "development") {
      const urlMatch = (options.html || options.text || "").match(/https?:\/\/[^\s"'<>]+/);
      console.log("\n📧 [DEV] Email not sent (SMTP not configured). Would send to:", options.to);
      console.log("  Subject:", options.subject);
      if (urlMatch) console.log("  🔗 Verification URL:", urlMatch[0]);
      console.log("  Add SMTP_* env vars to send real emails.\n");
      return;
    }
    throw new Error(
      "Email not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env"
    );
  }

  await transport.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
}

export function isEmailConfigured(): boolean {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
}
