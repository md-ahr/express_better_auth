# Express Better Auth

A production-ready REST API template built with Express.js, TypeScript, and Drizzle ORM. Includes security best practices, a standardized response format, and a clean architecture for rapid development.

## Features

- **TypeScript** — Full type safety with strict mode
- **Express 5** — Fast, unopinionated web framework
- **Better Auth** — Full-featured auth (email/password, OAuth, magic links)
- **Drizzle ORM** — Lightweight ORM with PostgreSQL
- **Standardized API Responses** — Consistent `{ status, data, error }` format
- **Security** — Helmet, CORS, rate limiting (100 req/15 min per IP)
- **Health Check** — `/api/v1/health` for load balancers and monitoring
- **Global Error Handling** — User-friendly error messages, no stack trace leakage

## Project Structure

```
src/
├── app.ts              # Express app setup, middleware, routes
├── auth.ts             # Better Auth config (Drizzle adapter)
├── server.ts           # Entry point
├── config/
│   └── env.ts          # Environment validation
├── db/
│   ├── index.ts        # Drizzle client
│   └── auth-schema.ts  # Better Auth tables (user, session, account, verification)
├── middleware/
│   └── error.middleware.ts
├── routes/
│   ├── auth.route.ts   # /api/v1/auth
│   └── health.route.ts # /api/v1/health
└── utils/
    ├── appError.ts     # Custom error class
    ├── catchAsync.ts
    └── response.ts     # successResponse, errorResponse
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
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/your_db
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
BETTER_AUTH_SECRET=your-secret-min-32-chars
BETTER_AUTH_URL=http://localhost:3000
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

The server runs at `http://localhost:3000` (or your configured `PORT`).

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check (database + server status) |
| GET | `/api/v1/auth/me` | Current session (requires auth cookie) |
| POST | `/api/v1/auth/register` | Email/password registration |
| POST | `/api/v1/auth/login` | Email/password login |
| POST | `/api/v1/auth/sign-out` | Sign out |
| POST | `/api/v1/auth/send-verification-email` | Send verification email |
| GET | `/api/v1/auth/verify-email` | Verify email (token in query) |

See [Better Auth docs](https://better-auth.com/docs) for the full API.

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

## Database Commands

| Command | Description |
|---------|-------------|
| `pnpm db:push` | Push schema changes to database |
| `pnpm db:generate` | Generate migrations |
| `pnpm db:migrate` | Run migrations |
| `pnpm db:studio` | Open Drizzle Studio (GUI) |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | `development` or `production` |
| `PORT` | Yes | Server port (e.g. `3000`) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `ALLOWED_ORIGINS` | Yes | Comma-separated CORS origins |
| `BETTER_AUTH_SECRET` | Yes | Secret for signing cookies/tokens (min 32 chars) |
| `BETTER_AUTH_URL` | Yes | App URL (e.g. `http://localhost:3000`) |
| `SMTP_HOST` | Prod | SMTP server host (e.g. `smtp.gmail.com`) |
| `SMTP_PORT` | Prod | SMTP port (587 for TLS, 465 for SSL) |
| `SMTP_USER` | Prod | SMTP username |
| `SMTP_PASS` | Prod | SMTP password |
| `SMTP_FROM` | No | From address (defaults to `SMTP_USER`) |

## License

ISC — Abdul Halim
