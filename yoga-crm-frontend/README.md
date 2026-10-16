# YogaCare CRM — Frontend

Next.js (App Router) web client for the YogaCare CRM clinic-management application.

## Stack

- Next.js 16 (App Router, Turbopack) + React 19
- TypeScript (strict)
- Tailwind CSS v4 (CSS-first config in `src/app/globals.css`)

## Prerequisites

- Node.js 20+
- The backend API running (see `../yoga-crm-backend/README.md`)

## Environment

Copy the template and adjust if needed:

```sh
cp .env.example .env.local
```

| Variable | Purpose | Default |
|---|---|---|
| `API_BASE_URL` | Server-side proxy target for `/api/*` rewrites (`next.config.ts`) | `http://localhost:4000` |
| `NEXT_PUBLIC_API_BASE_URL` | Browser-facing API base (same-origin proxy) | `/api` |

Requests to `/api/*` are rewritten to the Express backend, so the browser only talks
same-origin. Cookies therefore work without cross-origin configuration in development.

## Commands

```sh
npm install
npm run dev      # http://localhost:3000
npm run build    # production build + type check
npm run start    # serve the production build
npm run lint
```

## Project layout

```
src/
  app/            App Router routes (layout, pages)
  lib/api.ts      Typed fetch client + backend health check
```

The home page performs a live backend health check to verify connectivity.
