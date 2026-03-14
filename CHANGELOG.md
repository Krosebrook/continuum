# Changelog

All notable changes to Continuum are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Added

**Infrastructure & Tooling**
- Next.js 16.1.6 (App Router) with React 19 and TypeScript 5 strict mode
- Tailwind CSS 4.x with custom brand colour tokens
- ESLint configuration (`eslint.config.mjs`)
- Vitest 4.x test suite with React Testing Library 16 (`vitest.config.ts`, `vitest.setup.ts`)
- Playwright E2E configuration (`playwright.config.ts`)
- Vercel deployment configuration with security headers, CORS, and cron jobs (`vercel.json`)
- TypeScript path aliases (`@/*` → project root)

**Landing Page & Waitlist**
- Hero section (`components/Hero.tsx`) with value proposition and feature highlights
- Waitlist signup form (`components/WaitlistForm.tsx`) with client-side validation and error handling
- Footer component (`components/Footer.tsx`)
- `POST /api/waitlist` — join waitlist with Zod validation, DOMPurify sanitisation, Upstash rate limiting (3 req/hr/IP), Supabase insert, Resend welcome email
- `GET /api/waitlist` — route health check
- `/unsubscribe` page for waitlist unsubscribe flow
- Waitlist Zod schema (`lib/schemas/waitlist.ts`)
- Resend welcome email template (`lib/emails/waitlist-welcome.ts`)

**Authentication**
- Cookie-based JWT authentication (see ADR-003)
- `middleware.ts` — protects all `/dashboard/*` routes, refreshes tokens on each request
- `lib/supabase/middleware.ts` — session refresh helper
- `lib/hooks/useAuth.ts` — browser auth state hook with `SIGNED_IN`/`SIGNED_OUT` event handling
- `/login`, `/signup`, `/forgot-password`, `/reset-password` pages
- `GET /auth/callback` — PKCE code exchange for magic links and OAuth
- `POST /api/auth/signout` — cookie clear + redirect

**Dashboard (Stub)**
- `/dashboard/opportunities` — opportunities list page (stub)
- `/dashboard/icps` — ICP list page (stub)
- `/dashboard/icps/new` — new ICP form (stub)
- `/dashboard/icps/[id]/edit` — edit ICP form (stub)
- `/dashboard/analytics` — analytics page (stub)
- `/dashboard/settings` — settings page (stub)

**Supabase / Database**
- `lib/supabase/client.ts` — browser Supabase client
- `lib/supabase/server.ts` — server-side Supabase client with `persistSession: false`, `autoRefreshToken: false`
- `supabase/schema.sql` — full PostgreSQL schema with 8 tables and RLS policies

**Operations**
- `GET /api/cron/health` — hourly cron health check with Bearer token auth
- Vercel Cron configured to call `/api/cron/health` at `0 * * * *`

**Documentation**
- `docs/ARCHITECTURE.md` — system components, auth flow, deployment topology
- `docs/API.md` — full API reference
- `docs/openapi.yaml` — OpenAPI 3.1 spec
- `docs/DATABASE.md` — schema reference for all 8 tables
- `docs/PRD.md` — product requirements (reverse-engineered)
- `docs/ROADMAP.md` — WSJF-scored technical roadmap
- `docs/DEAD-CODE-TRIAGE.md` — dead code audit
- `docs/RUNBOOK.md` — operational procedures
- `docs/SECURITY.md` — OWASP checklist, vulnerability tracking
- `docs/AUDIT-REPORT.md` — audit findings
- `docs/adr/` — 8 Architecture Decision Records (ADR-001 through ADR-008)

### Tests

- `__tests__/api/waitlist.test.ts` — 10/10 passing ✅
- `__tests__/components/WaitlistForm.test.tsx` — 1/7 passing ⚠️ (React 19 + RTL timing; pre-existing)

### Known Issues

- `WaitlistForm.test.tsx`: 6/7 tests failing (React 19 + RTL async timing) — tracked in `docs/ROADMAP.md` T1-1
- `flatted < 3.4.0`: transitive DoS via Next.js — no fix without major upgrade — tracked in `docs/ROADMAP.md` T2-2
- `lib/supabase-server.ts`: orphaned legacy file, never imported — tracked in `docs/DEAD-CODE-TRIAGE.md`

---

## [0.1.0] — 2026-03-12

- Initial commit: project scaffolded by Copilot agent (`3ac0ca0`)

---

[Unreleased]: https://github.com/your-org/continuum/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/your-org/continuum/releases/tag/v0.1.0
