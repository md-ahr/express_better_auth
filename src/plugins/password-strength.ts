import { APIError } from "better-auth/api";
import type { BetterAuthPlugin } from "better-auth";

const PASSWORD_RULES = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
};

const SPECIAL_CHARS = "!@#$%^&*()_+-=[]{}|;':\",./<>?`~";

function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
  if (password.length < PASSWORD_RULES.minLength) {
    return {
      valid: false,
      message: `Password must be at least ${PASSWORD_RULES.minLength} characters long`,
    };
  }
  if (PASSWORD_RULES.requireUppercase && !/[A-Z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one uppercase letter" };
  }
  if (PASSWORD_RULES.requireLowercase && !/[a-z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one lowercase letter" };
  }
  if (PASSWORD_RULES.requireNumber && !/\d/.test(password)) {
    return { valid: false, message: "Password must contain at least one number" };
  }
  if (PASSWORD_RULES.requireSpecialChar && !new RegExp(`[${SPECIAL_CHARS.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}]`).test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one special character (!@#$%^&* etc.)",
    };
  }
  return { valid: true };
}

export const passwordStrengthPlugin = (): BetterAuthPlugin => ({
  id: "password-strength",
  init(ctx) {
    const originalHash = ctx.password.hash;
    return {
      context: {
        password: {
          ...ctx.password,
          async hash(password: string) {
            const result = validatePasswordStrength(password);
            if (!result.valid) {
              throw APIError.from("BAD_REQUEST", {
                message: result.message ?? "Password does not meet strength requirements",
                code: "WEAK_PASSWORD",
              });
            }
            return originalHash(password);
          },
        },
      },
    };
  },
});
