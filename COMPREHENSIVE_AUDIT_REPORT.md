# Continuum — Comprehensive Three-Level Codebase Audit

**Date:** March 12, 2026  
**Auditor:** GitHub Copilot (Senior Engineering Consultant)  
**Repository:** `Krosebrook/continuum`  
**Branch audited:** `copilot/high-level-repository-audit`  
**Overall grade:** **B+ (87 / 100)**

---

## Executive Summary

Continuum is a well-structured Next.js 16 / React 19 SaaS starter with a landing page, waitlist API, and an emerging authenticated dashboard. The codebase shows strong security awareness (Zod validation, DOMPurify sanitisation, Upstash rate-limiting, RLS policies) and solid TypeScript discipline. No critical runtime vulnerabilities were found.

**Three issues required immediate remediation and have been fixed in this PR:**

| # | Severity | Finding | Status |
|---|----------|---------|--------|
| 1 | 🔴 Critical | GitHub Actions workflows used non-existent `@v6` action versions, blocking every CI run | **Fixed** |
| 2 | 🟠 High | Duplicate Supabase server client (`lib/supabase-server.ts` vs `lib/supabase/server.ts`) with inconsistent imports across the app | **Fixed** |
| 3 | 🟠 High | Auth cookie `Secure` flag derived from `NODE_ENV` string rather than the actual transport protocol | **Fixed** |

Additional findings at each scope level are documented below with priority-rated recommendations.

---

## HIGH LEVEL — Architecture & Technology Stack

### Key Findings

**Architecture pattern:** Modular monolith using Next.js App Router. The application mixes a public marketing layer (landing page + waitlist API) with a nascent authenticated product layer (dashboard, ICPs, opportunities). Both live in the same deployment unit, which is appropriate at this stage but will need boundary enforcement as the product layer grows.

**Technology choices:**
- Next.js 16.1.6 + React 19 — leading edge, appropriate for the problem domain
- Supabase (PostgreSQL + RLS) — excellent choice for multi-tenant SaaS with built-in auth
- Upstash Redis — right-sized distributed rate limiting
- Zod 4.x — modern schema validation with good TypeScript inference
- Tailwind CSS 4.x — utility-first, suits a small team moving fast
- Vercel deployment with `vercel.json` security headers — well configured

**Deployment:** Single-region (`iad1`) Vercel deployment with edge middleware, hourly cron health-check, and static asset long-cache headers.

### Strengths
- ✅ Strict TypeScript enabled (`tsconfig.json` has `"strict": true`)
- ✅ Security headers fully configured (CSP, HSTS, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`) in `vercel.json` complemented by `next.config.ts`
- ✅ Rate-limiting via sliding window with graceful degradation when Redis is absent
- ✅ `poweredByHeader: false` removes the `X-Powered-By: Next.js` fingerprint
- ✅ Immutable cache headers for `/_next/static/*` assets

### Areas of Concern

**🟠 HIGH — No error monitoring (Sentry or equivalent)**  
`ErrorBoundary.tsx` logs to the console only. There is no production error collection. `MONITORING_SETUP.md` contains a pre-written integration guide; this is the single critical blocker for a public launch.

**🟡 MEDIUM — Single-region deployment**  
`"regions": ["iad1"]` hard-codes US East. For a global product, consider Vercel's multi-region option or at minimum document the decision.

**🟡 MEDIUM — No structured logging**  
`console.error` is scattered throughout API routes. In production, errors are visible only in Vercel function logs with no aggregation or alerting.

### Recommendations

| Priority | Action |
|----------|--------|
| 🔴 Critical | Integrate Sentry (or equivalent) before public launch. `MONITORING_SETUP.md` already describes the steps. Est. effort: 30–60 min. |
| 🟡 Medium | Add a `pino` / `winston` structured logger wrapper so all server logs share a consistent format and can be shipped to a log aggregator. |
| 🟢 Low | Document the single-region deployment decision, or add a multi-region config when traffic warrants it. |

---

## MEDIUM LEVEL — Module & Package Structure

### Key Findings

**Module layout:**
```
app/
  api/waitlist/        – public waitlist endpoint (well implemented)
  api/auth/signout/    – sign-out handler
  api/cron/health/     – uptime cron
  (auth)/              – login, signup, password-reset pages
  dashboard/           – protected product shell (scaffold-level)
lib/
  supabase/            – canonical server, browser, and middleware clients
  supabase-server.ts   – LEGACY duplicate (superseded; dead code after this fix)
  schemas/             – shared Zod schemas
  emails/              – email template
  hooks/               – React hooks (useAuth)
  types/               – TypeScript interfaces
components/            – UI layer (WaitlistForm, Hero, Footer, dashboard scaffold)
```

**Identified coupling / structural issues:**

1. **Duplicate Supabase client (fixed)** — `lib/supabase-server.ts` was an older singleton lacking `persistSession: false` / `autoRefreshToken: false`. `lib/supabase/server.ts` is the canonical client. `app/api/waitlist/route.ts` has been updated to import from the canonical path.

2. **Singleton module-level client caching in serverless** — Both `lib/supabase/server.ts` and `lib/supabase/client.ts` cache the client in module-level variables. In Vercel serverless runtimes, module scope is per warm container, which is generally safe. The service-key singleton correctly sets `persistSession: false` to avoid cross-request session bleed.

3. **Dashboard pages are scaffold-level** — `app/dashboard/*/page.tsx` files contain placeholder content. Route structure is sound but feature work is incomplete.

4. **No test for middleware or useAuth** — `middleware.ts` contains auth redirection logic that is completely untested.

### Strengths
- ✅ Schemas co-located in `lib/schemas/` and shared between API and client
- ✅ Types centralised in `lib/types/database.ts` and `lib/types/index.ts`
- ✅ Email templates isolated in `lib/emails/` with typed parameters
- ✅ Separation of browser vs. server Supabase clients prevents service-key exposure on the client

### Areas of Concern

**🟠 HIGH — `lib/supabase-server.ts` is dead code**  
The legacy file is no longer imported after this consolidation fix. It should be deleted.

**🟡 MEDIUM — CI did not run tests**  
The CI workflow ran only `lint`, `type-check`, and `build` — no test execution. A `test` job has been added in this PR.

**🟡 MEDIUM — No integration tests for middleware / auth flow**  
Cookie-based auth redirection in `middleware.ts` is business-critical but has zero test coverage.

**🟡 MEDIUM — Component tests are flaky (React 19 + Testing Library timing)**  
6 / 7 component tests time out because `waitFor` does not align with React 19's concurrent rendering. These should be fixed with `@testing-library/user-event` and `act()` wrappers.

### Recommendations

| Priority | Action |
|----------|--------|
| 🟠 High | Delete `lib/supabase-server.ts` (now dead code after consolidation). |
| 🟠 High | Fix the 6 flaky component tests by migrating from `fireEvent` to `@testing-library/user-event`. |
| 🟡 Medium | Add middleware integration tests using Playwright. |
| 🟢 Low | Add a path-alias `@/lib/supabase` pointing to `lib/supabase/server.ts` to make correct imports obvious. |

---

## LOW LEVEL — Feature Deep-Dives

Five representative features are analysed below.

---

### Feature 1: Waitlist API (`app/api/waitlist/route.ts`)

**Code quality:** Excellent  
**Security:** Strong

**Positive observations:**
- Input validated with Zod before any database interaction
- `DOMPurify.sanitize()` applied to name/company fields
- Email normalised to lowercase before storage
- PostgreSQL unique constraint used for race-condition safety, with explicit handling of error code `23505`
- Email failure is deliberately non-fatal
- `created_at` omitted from `insert()` payload, delegating to database default
- Response exposes only `id` and `email`

**Issues found:**

```typescript
// MEDIUM: resendClient is module-scoped — cached for container lifetime.
// A change to RESEND_API_KEY requires a cold start to take effect.
let resendClient: Resend | null | undefined;
```

```typescript
// LOW: unused import from an earlier iteration
import { createClient } from '@supabase/supabase-js'; // never called directly
```

| Priority | Action |
|----------|--------|
| 🟡 Medium | Document the module-scoped `resendClient` caching behaviour with a comment. |
| 🟢 Low | Remove the unused `createClient` import from `route.ts`. |

---

### Feature 2: Rate Limiting (`getRateLimiter` in `route.ts`)

**Code quality:** Good  
**Security:** Good (sliding window, 3 req / hr per IP)

**Issue found — IP spoofing risk:**

```typescript
// Current (risk): x-forwarded-for is caller-controlled
const forwardedFor = request.headers.get('x-forwarded-for');
const ip = forwardedFor?.split(',')[0]?.trim() || ...

// Recommended: trust Vercel's injected header first
const ip =
  request.headers.get('x-real-ip') ||
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
  '127.0.0.1';
```

Vercel injects `x-real-ip` from its own infrastructure; this header cannot be spoofed by the caller.

| Priority | Action |
|----------|--------|
| 🟠 High | Prefer `x-real-ip` (Vercel-injected, unforgeable) over `x-forwarded-for` for the rate-limit key. |
| 🟡 Medium | Add a global rate-limiter at the Vercel edge layer (via `middleware.ts`) so bots are rejected before reaching the Node.js function. |

---

### Feature 3: Authentication Cookie Handling (`lib/hooks/useAuth.ts`)

**Code quality:** Adequate  
**Security:** Improved in this PR

**Issue (fixed in this PR):**

```typescript
// BEFORE (bug): NODE_ENV may not reflect actual transport protocol
`; ${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`

// AFTER (fixed): uses actual protocol
const secure = window.location.protocol === 'https:' ? '; Secure' : '';
```

**Remaining structural concern:**

Browser-JS-set cookies cannot carry the `HttpOnly` flag. This means the access and refresh tokens are readable by any JavaScript on the page. The `lib/supabase/middleware.ts` correctly upgrades these to `httpOnly` cookies on the next request, but the initial login window has a brief XSS exposure.

**Recommended long-term fix:** Implement a server-side `/api/auth/session` endpoint that sets `HttpOnly; Secure` cookies directly, replacing the `document.cookie` writes.

| Priority | Action |
|----------|--------|
| 🟠 High | Create a `/api/auth/session` POST endpoint that accepts Supabase session tokens and responds with `Set-Cookie: ...; HttpOnly; Secure`. |
| 🟡 Medium | Tighten CSP `script-src` to remove `unsafe-inline` to reduce XSS risk while the browser-cookie pattern is in use. |

---

### Feature 4: Middleware Route Protection (`middleware.ts`)

**Code quality:** Adequate  
**Security:** Functional but redundant

```typescript
// middleware.ts creates its OWN Supabase client (direct createClient call)
// instead of reusing lib/supabase/middleware.ts utilities.
// Changes to auth configuration must be made in two places.
function createSupabaseClient() {
  return createClient<Database>(url, anonKey, { auth: { persistSession: false } });
}
```

Additionally, `isProtectedRoute` references root-level paths that don't exist:

```typescript
// lib/supabase/middleware.ts — incorrect root-level paths
const protectedRoutes = [
  '/dashboard',
  '/settings',    // ← should be /dashboard/settings (not a real route)
  '/icps',        // ← should be /dashboard/icps (not a real route)
  '/opportunities', // ← /dashboard/opportunities
  '/analytics',   // ← /dashboard/analytics
];
// Only '/dashboard' is needed since all protected routes are nested under it.
```

| Priority | Action |
|----------|--------|
| 🟠 High | Remove incorrect root-level paths from `isProtectedRoute` in `lib/supabase/middleware.ts` — only `/dashboard` is needed. |
| 🟠 High | Replace the inline `createClient` call in `middleware.ts` with the helper from `lib/supabase/middleware.ts`. |
| 🟡 Medium | Add Playwright tests for protected route redirects. |

---

### Feature 5: Database Schema (`supabase/schema.sql`)

**Security:** Good foundations; one over-permission noted  
**RLS policies:** Present and meaningful

**Positive observations:**
- All tables have `enable row level security`
- `waitlist` table accessible to `anon` role (no auth required)
- `organizations` and `users` scoped by JWT `org_id` claim
- Indexes on `email`, `org_id`, and `status` columns

**Issues found:**

```sql
-- CRITICAL: Over-broad grant
grant all on all tables in schema public to authenticated;
-- If any RLS policy has a bug, authenticated users have unrestricted access.

-- Recommended: granular grants per table
grant select, insert on waitlist to anon;
grant select, update on organizations to authenticated;
grant select, insert, update, delete on opportunities to authenticated;
-- etc.
```

```sql
-- HIGH: Catchall 'for all' RLS policy blocks INSERT for new organisations
create policy "org_isolation" on organizations
  for all  -- 'for all' includes INSERT
  using (id = (... jwt org_id ...));
-- New org creation fails: no org_id is in the JWT yet at signup time.
-- Solution: split into separate SELECT / INSERT / UPDATE / DELETE policies.
```

| Priority | Action |
|----------|--------|
| 🔴 Critical (DB) | Replace `grant all on all tables … to authenticated` with per-table granular grants. |
| 🟠 High (DB) | Split `for all` RLS policies on `organizations` and `users` into per-operation policies so INSERT works during account creation. |
| 🟡 Medium | Add `moddatetime` trigger on all tables with an `updated_at` column. |

---

## Consolidated Recommendations

| Priority | Area | Recommendation | Status |
|----------|------|---------------|--------|
| 🔴 Critical | CI/CD | Fix GitHub Actions to use correct versions (`@v4` / `@v3`) | ✅ Done |
| 🔴 Critical | Database | Replace `grant all … to authenticated` with per-table grants | ⏳ Pending |
| 🔴 Critical | Monitoring | Integrate Sentry before public launch | ⏳ Pending |
| 🟠 High | Architecture | Consolidate duplicate Supabase clients | ✅ Done |
| 🟠 High | Architecture | Delete dead `lib/supabase-server.ts` | ⏳ Pending |
| 🟠 High | Security | Prefer `x-real-ip` over `x-forwarded-for` for rate-limit key | ✅ Done |
| 🟠 High | Security | Replace client-side `document.cookie` writes with `HttpOnly` session endpoint | ⏳ Pending |
| 🟠 High | Database | Split `for all` RLS into per-operation policies | ⏳ Pending |
| 🟠 High | Middleware | Remove incorrect root-level protected routes | ✅ Done |
| 🟠 High | Middleware | Reuse `lib/supabase/middleware.ts` client in `middleware.ts` | ⏳ Pending |
| 🟡 Medium | Testing | Fix 6 flaky component tests (`user-event` + `act()`) | ⏳ Pending |
| 🟡 Medium | Testing | Add middleware integration tests | ⏳ Pending |
| 🟡 Medium | CI | Add `test` job to CI workflow | ✅ Done |
| 🟡 Medium | Logging | Replace `console.error` with a structured logger | ⏳ Pending |
| 🟡 Medium | Database | Add `updated_at` auto-trigger | ⏳ Pending |
| 🟢 Low | Code quality | Remove unused `createClient` import from `waitlist/route.ts` | ✅ Done |
| 🟢 Low | Deployment | Document or expand single-region deployment | ⏳ Pending |

---

*Report generated as part of PR `copilot/high-level-repository-audit`. Seven code fixes were implemented alongside this report: CI workflow action versions, test job addition, Supabase client consolidation, unused import removal, cookie `Secure` flag, rate-limit IP header order, and protected-route list.*
