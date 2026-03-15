# Continuum

> AI-powered opportunity discovery platform

Continuum helps sales and growth teams discover and qualify high-fit accounts using AI-generated Ideal Customer Profiles (ICPs). The current release is a production-ready **landing page + waitlist** with a stub dashboard, ready for deployment on Vercel.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Prerequisites](#prerequisites)
3. [Setup](#setup)
4. [Environment Variables](#environment-variables)
5. [Scripts](#scripts)
6. [Project Structure](#project-structure)
7. [API Reference](#api-reference)
8. [Architecture Overview](#architecture-overview)
9. [Testing](#testing)
10. [Deployment](#deployment)
11. [Known Issues](#known-issues)

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| UI | React | 19.x |
| Language | TypeScript (strict) | 5.x |
| Styling | Tailwind CSS | 4.x |
| Database / Auth | Supabase (PostgreSQL + RLS) | latest client |
| Validation | Zod | 4.x |
| Email | Resend | latest |
| Rate Limiting | Upstash Redis + Ratelimit | latest |
| XSS Sanitisation | isomorphic-dompurify | latest |
| Unit Tests | Vitest + React Testing Library | 4.x / 16.x |
| E2E Tests | Playwright | latest |
| Deployment | Vercel | — |

---

## Prerequisites

- **Node.js** ≥ 20.x (LTS recommended)
- **npm** ≥ 10.x
- A [Supabase](https://supabase.com) project
- (Optional) [Resend](https://resend.com) account for transactional email
- (Optional) [Upstash Redis](https://upstash.com) instance for rate limiting

---

## Setup

```bash
# 1. Clone
git clone https://github.com/your-org/continuum.git
cd continuum

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Fill in required variables (see below)

# 4. Initialise the database
# Run supabase/schema.sql in your Supabase SQL editor

# 5. Start development server
npm run dev
# → http://localhost:3000
```

---

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key — **server-side only** |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `RESEND_API_KEY` | Resend API key for confirmation emails | — (email disabled) |
| `RESEND_FROM_EMAIL` | Sender address for transactional email | — |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL for rate limiting | — (rate limiting disabled) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token | — |
| `CRON_SECRET` | Bearer token to authenticate cron requests | — |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL used in email links | `https://continuum.vercel.app` |
| `NEXT_PUBLIC_APP_VERSION` | App version (auto-set from package.json) | — |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server at `http://localhost:3000` |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | TypeScript check (`tsc --noEmit`) |
| `npm test` | Run Vitest unit tests |
| `npm run test:coverage` | Unit tests with coverage report |
| `npm run test:e2e` | Run Playwright E2E tests |

---

## Project Structure

```
continuum/
├── app/                          # Next.js App Router
│   ├── api/
│   │   ├── waitlist/route.ts     # POST /api/waitlist — join waitlist
│   │   ├── cron/health/route.ts  # GET  /api/cron/health — cron health check
│   │   └── auth/signout/route.ts # POST /api/auth/signout — sign out
│   ├── auth/callback/route.ts    # GET  /auth/callback — OAuth / magic-link callback
│   ├── login/                    # Login page
│   ├── signup/                   # Signup page
│   ├── forgot-password/          # Forgot-password page
│   ├── reset-password/           # Reset-password page
│   ├── unsubscribe/              # Unsubscribe page
│   ├── dashboard/
│   │   ├── opportunities/        # Opportunities list (protected)
│   │   ├── icps/                 # ICP CRUD (protected)
│   │   ├── analytics/            # Analytics (protected)
│   │   └── settings/             # Settings (protected)
│   ├── globals.css               # Tailwind + global styles
│   ├── layout.tsx                # Root layout + metadata
│   └── page.tsx                  # Homepage (Hero + Footer)
├── components/
│   ├── Hero.tsx                  # Landing hero section
│   ├── WaitlistForm.tsx          # Email signup form
│   └── Footer.tsx                # Site footer
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser Supabase client
│   │   ├── server.ts             # Server Supabase client (canonical)
│   │   └── middleware.ts         # Session refresh in middleware
│   ├── hooks/
│   │   └── useAuth.ts            # Auth state + sign-in/out hook
│   ├── schemas/
│   │   └── waitlist.ts           # Zod validation schema for waitlist
│   └── emails/
│       └── waitlist-welcome.ts   # Resend email template
├── supabase/
│   └── schema.sql                # Full PostgreSQL schema
├── __tests__/                    # Vitest test suite
├── middleware.ts                 # Route protection + session refresh
├── vercel.json                   # Vercel config, security headers, CORS, crons
├── next.config.ts                # Next.js config
├── tailwind.config.ts            # Tailwind config
└── vitest.config.ts              # Vitest config
```

---

## API Reference

See [`docs/API.md`](docs/API.md) for the full reference and [`docs/openapi.yaml`](docs/openapi.yaml) for the OpenAPI 3.1 spec.

### Quick Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/` | None | Landing page |
| `GET` | `/unsubscribe` | None | Unsubscribe (`?email=`) |
| `POST` | `/api/waitlist` | None | Join waitlist |
| `GET` | `/api/waitlist` | None | Route health check |
| `GET` | `/api/cron/health` | `Bearer CRON_SECRET` | Cron health check |
| `POST` | `/api/auth/signout` | Cookie | Sign out |
| `GET` | `/auth/callback` | None | Auth callback (magic link / OAuth) |

---

## Architecture Overview

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full system design.

**High-level flow:**

```
Browser → Vercel Edge (middleware) → Next.js App Router
                                           ├── Server Components → Supabase (PostgreSQL)
                                           ├── Route Handlers → Supabase / Resend / Upstash
                                           └── Client Components → Supabase JS client
```

Authentication uses **cookie-based JWTs** managed by the middleware. `sb-access-token` and `sb-refresh-token` cookies are set on sign-in and refreshed on every request.

---

## Testing

```bash
npm test                # Run all Vitest unit tests (17 tests)
npm run test:coverage   # Coverage report
npm run test:e2e        # Playwright E2E
```

**Current status (unit tests):**

| Suite | Pass | Fail | Notes |
|-------|------|------|-------|
| `__tests__/api/waitlist.test.ts` | 10 | 0 | ✅ Full coverage |
| `__tests__/components/WaitlistForm.test.tsx` | 7 | 0 | ✅ All passing |

---

## Deployment

See [`DEPLOYMENT.md`](DEPLOYMENT.md) for the full guide.

1. Push to `main` → Vercel auto-deploys via GitHub integration
2. Set all required environment variables in Vercel project settings
3. Run `supabase/schema.sql` in your Supabase SQL editor before first deployment
4. Verify cron job `/api/cron/health` is active in Vercel dashboard (runs hourly)

---

## Known Issues

| Issue | Severity | Status |
|-------|----------|--------|
| `flatted < 3.4.0` — transitive DoS vulnerability via Next.js dependency | High | No fix available without major Next.js upgrade; CI runs with `--audit-level=high --continue-on-error` |

---

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md).

## License

See [`LICENSE`](LICENSE).
