# YogaCare CRM — Backend

Express + TypeScript REST API for the YogaCare CRM web application.

## Stack

- Node.js + Express 5
- TypeScript (strict, `NodeNext` module resolution)
- PostgreSQL via Prisma ORM
- Zod request/env validation
- Vitest + Supertest tests

## Prerequisites

- Node.js 20+
- A PostgreSQL database (this project uses Supabase Postgres)

## Environment

Copy `.env.example` to `.env` and fill in real values. Never commit `.env`.

| Variable | Purpose |
|---|---|
| `NODE_ENV` | `development` / `test` / `production` |
| `PORT` | HTTP port (default `4000`) |
| `CORS_ORIGIN` | Comma-separated allowed origins (frontend URL) |
| `DATABASE_URL` | Pooled Postgres connection string (runtime) |
| `DIRECT_URL` | Direct Postgres connection string (Prisma migrations) |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | ≥32-char secrets (`openssl rand -hex 32`) |
| `ACCESS_TOKEN_TTL_MIN` / `REFRESH_TOKEN_TTL_DAYS` | Token lifetimes |
| `COOKIE_SECURE` | `true` in production (HTTPS) |
| `STORAGE_DRIVER` | Object storage driver (`supabase`) |
| `SUPABASE_URL` / `SUPABASE_SECRET_KEY` / `SUPABASE_BUCKET` | Supabase Storage (private bucket) |
| `MAX_UPLOAD_MB` | Upload size limit |

## Database

```sh
npm run prisma:generate   # generate the Prisma client
npm run migrate:dev       # create/apply migrations in development
npm run migrate:deploy    # apply migrations in production
npm run prisma:studio     # browse data
```

## Commands

```sh
npm install
npm run dev        # tsx watch (http://localhost:4000)
npm run build      # tsc -> dist/
npm run start      # run the compiled server
npm run typecheck  # type check src + tests
npm test           # vitest run
npm run test:watch
```

## Health checks

- `GET /api/health` — liveness (no database required)
- `GET /api/health/db` — readiness (executes `SELECT 1`)

## Architecture

```
src/
  server.ts        bootstrap + graceful shutdown
  app.ts           Express app factory (security headers, CORS, rate limit, routes, errors)
  config/          env validation + Prisma client singleton
  middleware/      centralized error handling
  routes/          route definitions
  controllers/     request/response handling (thin)
  services/        business logic (authoritative)
  validation/      Zod schemas
  storage/         object storage drivers
  utils/           shared helpers
```

Business rules (payment derivation, validation, normalization) are enforced server-side.
The frontend mirrors them for UX only.
