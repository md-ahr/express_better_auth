# Express Better Auth

A production-ready REST API template built with Express.js, TypeScript, and Drizzle ORM. Includes security best practices, a standardized response format, and a clean architecture for rapid development.

## Features

- **TypeScript** — Full type safety with strict mode
- **Express 5** — Fast, unopinionated web framework
- **Better Auth** — Full-featured auth (email/password, email verification, password reset)
- **Drizzle ORM** — Lightweight ORM with PostgreSQL
- **Standardized API Responses** — Consistent `{ status, data, error }` format
- **Swagger / OpenAPI** — Interactive API docs at `/api-docs`
- **Security** — Helmet, CORS, rate limiting (100 req/15 min per IP)
- **Health Check** — `/api/v1/health` for load balancers and monitoring
- **Global Error Handling** — User-friendly error messages, no stack trace leakage
- **Background Email** — Verification and reset-password emails sent asynchronously
- **Password Strength** — Configurable validation via plugin

## Project Structure

```
src/
├── app.ts                 # Express app, middleware, auth handler
├── auth.ts                # Better Auth config (Drizzle adapter)
├── server.ts              # Entry point
├── config/
│   ├── env.ts             # Environment validation
│   ├── auth-paths.ts      # Path mapping (e.g. /login → /sign-in/email)
│   └── openapi.ts         # OpenAPI 3.0 spec for Swagger
├── db/
│   ├── index.ts           # Drizzle client
│   └── auth-schema.ts     # Better Auth tables
├── lib/
│   ├── email.ts           # Nodemailer transport
│   ├── email-background.ts # Async email sending
│   ├── verification-email.ts
│   └── reset-password-email.ts
├── middleware/
│   └── error.middleware.ts
├── plugins/
│   └── password-strength.ts
├── routes/
│   ├── auth.route.ts      # /api/v1/auth/me (custom)
│   └── health.route.ts    # /api/v1/health
└── utils/
    ├── appError.ts
    ├── authHandlerProxy.ts   # Response proxy for auth endpoints
    ├── catchAsync.ts
    ├── response.ts
    ├── transformAuthResponse.ts
    └── wrapAuthResponse.ts   # Wraps auth responses to { status, data, error }
```

## Prerequisites

- **Node.js** 18+
- **PostgreSQL**
- **pnpm** (or npm/yarn)

## Quick Start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

Create a `.env` file in the project root:

```env
NODE_ENV=development
PORT=8000
DATABASE_URL=postgresql://user:password@localhost:5432/your_db
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
BETTER_AUTH_SECRET=your-secret-min-32-chars
BETTER_AUTH_URL=http://localhost:8000

# SMTP (required for verification & reset-password emails)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
EMAIL_FROM=noreply@example.com
```

### 3. Push database schema

```bash
pnpm db:push
```

### 4. Run the server

```bash
# Development (with hot reload)
pnpm dev

# Production
pnpm build
pnpm start
```

The server runs at `http://localhost:8000` (or your configured `PORT`).

## API Documentation

Interactive Swagger UI is available at:

**http://localhost:8000/api-docs**

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check (database + server status) |
| GET | `/api/v1/auth/me` | Current session (requires auth cookie) |
| POST | `/api/v1/auth/login` | Sign in with email/password |
| POST | `/api/v1/auth/register` | Sign up with email/password |
| POST | `/api/v1/auth/logout` | Sign out |
| POST | `/api/v1/auth/forgot-password` | Request password reset email |
| POST | `/api/v1/auth/reset-password` | Reset password (token + newPassword) |
| GET | `/api/v1/auth/reset-password/:token` | Validate reset token |
| POST | `/api/v1/auth/send-verification-email` | Send verification email (requires session) |
| GET | `/api/v1/auth/verify-email` | Verify email (token in query) |

Path aliases are mapped internally (e.g. `/login` → `/sign-in/email`, `/logout` → `/sign-out`). See [Better Auth docs](https://better-auth.com/docs) for details.

## Response Format

All responses follow a consistent structure:

**Success:**
```json
{
  "status": true,
  "data": { ... },
  "error": null
}
```

**Error:**
```json
{
  "status": false,
  "data": null,
  "error": "User-friendly error message"
}
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server with hot reload (tsx watch) |
| `pnpm build` | Bundle for production (esbuild) |
| `pnpm start` | Run production build |
| `pnpm db:push` | Push schema changes to database |
| `pnpm db:generate` | Generate migrations |
| `pnpm db:migrate` | Run migrations |
| `pnpm db:studio` | Open Drizzle Studio (GUI) |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | `development` or `production` |
| `PORT` | Yes | Server port (e.g. `8000`) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `ALLOWED_ORIGINS` | Yes | Comma-separated CORS origins |
| `BETTER_AUTH_SECRET` | Yes | Secret for signing cookies/tokens (min 32 chars) |
| `BETTER_AUTH_URL` | Yes | App URL (e.g. `http://localhost:8000`) |
| `SMTP_HOST` | Yes | SMTP server host |
| `SMTP_PORT` | Yes | SMTP port (587 for TLS, 465 for SSL) |
| `SMTP_SECURE` | Yes | `true` or `false` |
| `SMTP_USER` | Yes | SMTP username |
| `SMTP_PASS` | Yes | SMTP password |
| `EMAIL_FROM` | Yes | From address for outgoing emails |

## License

ISC — Abdul Halim
