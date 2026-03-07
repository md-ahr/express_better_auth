const API_PREFIX = "/api/v1";

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Express Better Auth API",
    version: "1.0.0",
    description: "REST API with better-auth authentication",
  },
  servers: [{ url: API_PREFIX }],
  paths: {
    "/health": {
      get: {
        summary: "Health check",
        tags: ["Health"],
        responses: {
          "200": {
            description: "Service is healthy",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiResponse" },
                example: {
                  status: true,
                  data: {
                    status: "UP",
                    timestamp: "2025-03-06T12:00:00.000Z",
                    uptime: 3600,
                    services: { database: "OK", server: "OK" },
                  },
                  error: null,
                },
              },
            },
          },
          "503": {
            description: "Service unavailable",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiResponse" },
              },
            },
          },
        },
      },
    },
    "/auth/me": {
      get: {
        summary: "Get current session",
        tags: ["Auth"],
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "Session data",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiResponse" },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiResponse" },
              },
            },
          },
        },
      },
    },
    "/auth/login": {
      post: {
        summary: "Sign in with email",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", format: "password" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Success" },
          "401": { description: "Invalid credentials" },
        },
      },
    },
    "/auth/register": {
      post: {
        summary: "Sign up with email",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password", "name"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", format: "password" },
                  name: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Success" },
          "400": { description: "Validation error" },
        },
      },
    },
    "/auth/forgot-password": {
      post: {
        summary: "Request password reset",
        tags: ["Auth"],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: { email: { type: "string", format: "email" } },
              },
            },
          },
        },
        responses: {
          "200": { description: "Reset email sent if account exists" },
        },
      },
    },
    "/auth/logout": {
      post: {
        summary: "Sign out",
        tags: ["Auth"],
        security: [{ cookieAuth: [] }],
        responses: {
          "200": { description: "Signed out" },
        },
      },
    },
    "/auth/send-verification-email": {
      post: {
        summary: "Send verification email",
        tags: ["Auth"],
        description: "Sends a verification email to the currently logged-in user. Requires an active session.",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": { description: "Verification email sent" },
          "401": { description: "Unauthorized - must be logged in" },
        },
      },
    },
    "/auth/verify-email": {
      get: {
        summary: "Verify email",
        tags: ["Auth"],
        description: "Verifies the user's email using the token from the verification link.",
        parameters: [
          {
            name: "token",
            in: "query",
            required: true,
            schema: { type: "string" },
            description: "Verification token from the email link",
          },
        ],
        responses: {
          "200": { description: "Email verified successfully" },
          "400": { description: "Invalid or expired token" },
        },
      },
    },
    "/auth/reset-password": {
      post: {
        summary: "Reset password",
        tags: ["Auth"],
        description: "Resets the password using the token from the reset-password email.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["token", "newPassword"],
                properties: {
                  token: { type: "string", description: "Reset token from the email link" },
                  newPassword: { type: "string", format: "password", minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Password reset successfully" },
          "400": { description: "Invalid or expired token" },
        },
      },
    },
    "/auth/reset-password/{token}": {
      get: {
        summary: "Validate reset token",
        tags: ["Auth"],
        description: "Validates the reset token (e.g. when user opens the reset link). Returns token validity.",
        parameters: [
          {
            name: "token",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Token is valid" },
          "400": { description: "Invalid or expired token" },
        },
      },
    },
  },
  components: {
    schemas: {
      ApiResponse: {
        type: "object",
        required: ["status", "data", "error"],
        properties: {
          status: { type: "boolean" },
          data: { type: "object", nullable: true },
          error: { type: "string", nullable: true },
        },
      },
    },
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "better-auth.session_token",
        description: "Session cookie set by better-auth",
      },
    },
  },
} as const;
