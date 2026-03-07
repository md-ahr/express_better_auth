import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./db/auth-schema";
import { ENV } from "./config/env";
import { passwordStrengthPlugin } from "./plugins/password-strength";

export const auth = betterAuth({
  plugins: [passwordStrengthPlugin()],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  secret: ENV.BETTER_AUTH_SECRET,
  baseURL: ENV.BETTER_AUTH_URL,
  basePath: "/api/v1/auth",
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [ENV.BETTER_AUTH_URL, ...ENV.ALLOWED_ORIGINS],
  advanced: {
    defaultCookieAttributes: {
      sameSite: "lax",
    },
  },
  onAPIError: (ctx: any) => {
    const code = ctx.error?.code;
    const message = ctx.error?.message ?? "An error occurred";
    if (code === "MISSING_OR_NULL_ORIGIN") {
      return {
        message:
          "Request is missing the Origin header. Browsers send this automatically. For API clients (Postman, curl, mobile apps), add an Origin header matching your client URL, or ensure your client URL is in ALLOWED_ORIGINS.",
        code,
      };
    }
    return { message, code };
  },
});
