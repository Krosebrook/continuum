# Architecture

**Project:** Continuum  
**Version:** 0.2.0  
**Last Updated:** 2026-03-12

---

## Table of Contents

1. [System Component Diagram](#system-component-diagram)
2. [Request Lifecycle](#request-lifecycle)
3. [Authentication Flow](#authentication-flow)
4. [Database Schema Summary](#database-schema-summary)
5. [External Service Map](#external-service-map)
6. [Error Handling Strategy](#error-handling-strategy)
7. [Deployment Topology](#deployment-topology)

---

## System Component Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          BROWSER / CLIENT                           │
│                                                                     │
│  React 19 (App Router)                                              │
│  ├── Server Components  (SSR, data fetching)                        │
│  ├── Client Components  ('use client' — forms, hooks, auth state)   │
│  └── useAuth hook       (Supabase JS client, SIGNED_IN event)       │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTPS
┌──────────────────────────────▼──────────────────────────────────────┐
│                       VERCEL EDGE NETWORK                           │
│                                                                     │
│  middleware.ts                                                      │
│  ├── Reads sb-access-token / sb-refresh-token cookies               │
│  ├── Calls lib/supabase/middleware.ts → refreshes session           │
│  ├── Redirects unauthenticated requests to /login?redirect=<path>   │
│  └── Passes refreshed tokens downstream                             │
│                                                                     │
│  vercel.json security headers (CSP, HSTS, X-Frame-Options, CORS)    │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│                     NEXT.JS APP ROUTER (Serverless)                 │
│                                                                     │
│  Pages (RSC)                    Route Handlers (API)                │
│  ├── / (landing)                ├── POST /api/waitlist              │
│  ├── /login                     ├── GET  /api/waitlist              │
│  ├── /signup                    ├── GET  /api/cron/health           │
│  ├── /forgot-password           ├── POST /api/auth/signout          │
│  ├── /reset-password            └── GET  /auth/callback             │
│  ├── /unsubscribe                                                   │
│  └── /dashboard/* (protected)                                       │
└──────┬──────────────────────┬───────────────┬───────────────────────┘
       │                      │               │
┌──────▼──────┐   ┌───────────▼──────┐  ┌────▼────────────────────┐
│  SUPABASE   │   │   RESEND (email)  │  │  UPSTASH REDIS          │
│             │   │                  │  │                          │
│  PostgreSQL │   │  Waitlist welcome│  │  Rate limiter            │
│  Auth       │   │  confirmation    │  │  3 req/hr per IP         │
│  RLS        │   │  emails          │  │  (optional)              │
└─────────────┘   └──────────────────┘  └──────────────────────────┘
```

---

## Request Lifecycle

### Public page (e.g., `/`)

1. Browser requests `/`
2. Vercel Edge runs `middleware.ts` → route is public → passes through
3. Next.js renders `app/page.tsx` as a React Server Component
4. HTML streamed to browser

### Protected page (e.g., `/dashboard/opportunities`)

1. Browser requests `/dashboard/opportunities`
2. Edge middleware checks `sb-access-token` cookie
3. **No valid token** → redirect `302` to `/login?redirect=/dashboard/opportunities`
4. **Valid token** → `lib/supabase/middleware.ts` calls `supabase.auth.getSession()` (token refresh if needed) → updated `Set-Cookie` on response → request proceeds
5. Server Component fetches data from Supabase using service-role client
6. HTML rendered and streamed

### API call (e.g., `POST /api/waitlist`)

1. Client sends `POST /api/waitlist` with JSON body
2. Edge middleware: public route → no auth check
3. Route Handler validates input with Zod schema (`lib/schemas/waitlist.ts`)
4. (Optional) Upstash rate limit check — 3 req/hr per IP
5. DOMPurify sanitises `name` and `company` fields
6. Supabase service-role client inserts row into `waitlist` table
7. (Optional) Resend sends welcome email
8. Returns `201 Created` with `{ message, email }`

---

## Authentication Flow

```
1. User visits protected route
   └── middleware → no sb-access-token cookie
       └── redirect /login?redirect=<path>

2. User submits credentials on /login
   └── useAuth.signIn() → supabase.auth.signInWithOtp() or signInWithPassword()
       └── Supabase returns session (access_token, refresh_token)
           └── SIGNED_IN event fires in useAuth hook
               └── Sets sb-access-token and sb-refresh-token cookies
                   └── router.push(redirectPath || '/dashboard/opportunities')

3. Magic link flow
   └── User clicks email link → /auth/callback?code=<code>
       └── app/auth/callback/route.ts
           └── supabase.auth.exchangeCodeForSession(code)
               └── Sets cookies, redirects to /dashboard/opportunities

4. Token refresh (every request)
   └── middleware.ts → lib/supabase/middleware.ts
       └── supabase.auth.getSession()
           └── If expired: auto-refresh using refresh_token
               └── Updated cookies written to response headers

5. Sign out
   └── POST /api/auth/signout
       └── Clears sb-access-token and sb-refresh-token cookies
           └── Redirects to /login
```

**Cookie names:** `sb-access-token`, `sb-refresh-token`  
**Token lifetime:** Access token = 1 hour; Refresh token = 7 days (Supabase default)  
**Implementation note:** Uses custom cookie management (not `@supabase/ssr`). See ADR-003.

---

## Database Schema Summary

See [`docs/DATABASE.md`](DATABASE.md) for the full per-table reference.

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `waitlist` | Pre-launch signups | `email`, `status` (pending/invited/converted) |
| `organizations` | Tenants | `name`, `plan` (solo/team/enterprise) |
| `users` | App users (linked to `auth.users`) | `org_id`, `role` (owner/admin/member/viewer) |
| `icps` | Ideal Customer Profiles | `org_id`, `industry[]`, `keywords[]`, `is_active` |
| `opportunities` | Discovered accounts | `org_id`, `icp_id`, `fit_score`, `status` |
| `opportunity_enrichment` | Third-party enrichment data | `opportunity_id`, `provider`, `data` (jsonb) |
| `opportunity_contacts` | Contacts at opportunities | `opportunity_id`, `email`, `is_primary` |
| `search_runs` | Async search job records | `org_id`, `icp_id`, `status`, `opportunities_found` |

**Multi-tenancy:** All tenant-scoped tables include `org_id uuid` and Row-Level Security policies that enforce `(auth.jwt() ->> 'org_id')::uuid = org_id`.

---

## External Service Map

| Service | Purpose | Required | Credentials |
|---------|---------|----------|-------------|
| Supabase | Database, Auth, RLS | **Yes** | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Resend | Transactional email (waitlist welcome) | No | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` |
| Upstash Redis | API rate limiting (3 req/hr/IP) | No | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| Vercel | Hosting, Edge Network, Cron | Deployment | Configured via `vercel.json` |

When optional services are absent (no env vars set), the application degrades gracefully:
- **No Resend** → waitlist signups succeed, no confirmation email sent
- **No Upstash** → rate limiting is skipped; all requests allowed through

---

## Error Handling Strategy

### API Routes

All Route Handlers follow this pattern:

```typescript
try {
  // 1. Validate input (Zod) → 400 on ZodError
  // 2. Rate limit check     → 429 on exceeded
  // 3. Business logic       → 500 on unexpected error
} catch (error) {
  if (error instanceof z.ZodError) {
    return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
  }
  console.error('Unexpected error:', error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
```

### Client Components

- User-facing error messages are surfaced via component state (no raw stack traces)
- `console.error` used in development; Sentry integration is planned (see `docs/ROADMAP.md`)
- React Error Boundaries are not yet implemented (planned)

### Middleware

- On session refresh failure: cookies cleared, redirect to `/login`
- Non-critical errors (e.g., Upstash unavailable) log and continue

---

## Deployment Topology

```
GitHub (main branch)
        │  push
        ▼
Vercel CI/CD Pipeline
  ├── npm run build (Next.js production build)
  ├── TypeScript check
  └── Deploy to Vercel Edge Network (global CDN)
           │
    ┌──────┴───────────────────────────────────┐
    │          Vercel Functions                │
    │  (Serverless, Node 20.x runtime)         │
    │                                          │
    │  ├── Page rendering (RSC streaming)      │
    │  ├── API Route Handlers                  │
    │  └── Cron: /api/cron/health (hourly)     │
    └──────────────────────────────────────────┘
           │                    │
    ┌──────▼──────┐    ┌────────▼────────┐
    │  Supabase   │    │  Upstash Redis  │
    │  (managed   │    │  (managed Redis │
    │  PostgreSQL)│    │   rate limiter) │
    └─────────────┘    └─────────────────┘
```

**Environments:**

| Environment | Branch | URL |
|-------------|--------|-----|
| Production | `main` | `https://continuum.vercel.app` |
| Preview | PR branches | `https://<branch>-continuum.vercel.app` |
| Development | local | `http://localhost:3000` |
