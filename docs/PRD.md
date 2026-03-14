# Product Requirements Document

**Product:** Continuum  
**Version:** 0.2.0  
**Status:** Pre-launch (waitlist open)  
**Last Updated:** 2026-03-12  
**Source:** Reverse-engineered from codebase audit

---

## 1. Product Overview

Continuum is an AI-powered opportunity discovery platform for sales and growth teams. The platform discovers and qualifies high-fit accounts based on configurable Ideal Customer Profiles (ICPs).

**Current state:** Production-ready landing page with waitlist capture and a stub authenticated dashboard. Core AI features are schema-ready but not yet implemented.

### Target Users

- **Primary:** B2B sales teams (AEs, SDRs) at companies with 10–500 employees
- **Secondary:** Growth/RevOps managers who define ICPs and review opportunity pipelines
- **Onboarding path:** Waitlist → invited via `status = 'invited'` → self-serve signup

---

## 2. Core Features

### 2.1 Waitlist Signup

**Status:** ✅ Live  
**Entry point:** `POST /api/waitlist`, `components/WaitlistForm.tsx`

**Description:** Unauthenticated users submit their email (plus optional name and company) to join the pre-launch waitlist. A welcome email is sent via Resend if configured.

**User flow:**
1. User visits `/` and sees the `WaitlistForm` component
2. Submits email (+ optional name, company)
3. API validates input with Zod, rate-limits by IP (3 req/hr), sanitises name/company with DOMPurify
4. Row inserted into `waitlist` table with `status = 'pending'`
5. Welcome email sent via Resend (if `RESEND_API_KEY` configured)
6. User sees success message

**Data model:** `waitlist` table — see `docs/DATABASE.md`

**Dependencies:** Supabase, Resend (optional), Upstash Redis (optional)

**Known issues:**
- `WaitlistForm.test.tsx`: 6/7 tests fail due to React 19 + Testing Library async timing (pre-existing, non-blocking)

---

### 2.2 User Authentication

**Status:** ✅ Implemented (magic link + password)  
**Entry points:** `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/auth/callback`

**Description:** Users authenticate via magic link or password. The `useAuth` hook manages auth state. Middleware protects all `/dashboard/*` routes.

**User flow:**
1. User navigates to `/login`
2. Submits email → Supabase sends magic link
3. User clicks link → `/auth/callback?code=...` → cookies set → redirect to `/dashboard/opportunities`
4. Subsequent visits: middleware reads `sb-access-token` cookie; refreshes silently if needed

**Auth pages:**
- `/login` — Sign in
- `/signup` — Create account
- `/forgot-password` — Request password reset email
- `/reset-password` — Set new password (requires reset token in URL)

**Data model:** Supabase `auth.users` (managed) + `users` table (application profile)

**Dependencies:** Supabase Auth, `lib/supabase/middleware.ts`, `lib/hooks/useAuth.ts`

---

### 2.3 Dashboard (Stub)

**Status:** ⚠️ Stub — routes exist, core logic not yet implemented  
**Entry points:** `/dashboard/opportunities`, `/dashboard/icps`, `/dashboard/analytics`, `/dashboard/settings`

**Description:** Protected dashboard area accessible after login. Pages are scaffolded but data fetching and AI features are not yet implemented.

**Pages:**

| Route | Description | Status |
|-------|-------------|--------|
| `/dashboard/opportunities` | List discovered opportunities with fit scores | Stub |
| `/dashboard/icps` | List ICPs for the organisation | Stub |
| `/dashboard/icps/new` | Create a new ICP | Stub |
| `/dashboard/icps/[id]/edit` | Edit an existing ICP | Stub |
| `/dashboard/analytics` | Analytics and pipeline metrics | Stub |
| `/dashboard/settings` | Organisation and user settings | Stub |

**Data models:** `icps`, `opportunities`, `opportunity_contacts`, `opportunity_enrichment`, `search_runs` — see `docs/DATABASE.md`

---

### 2.4 Organisation Multi-Tenancy

**Status:** ✅ Schema implemented; application enforcement pending  
**Entry point:** All dashboard routes

**Description:** All data is scoped to an `organisation`. RLS policies on all tenant tables enforce `org_id` isolation at the database layer using the JWT claim `auth.jwt() ->> 'org_id'`.

**Plans:** `solo`, `team`, `enterprise` (defined in `organizations.plan`; pricing logic not yet implemented)

**Data model:** `organizations`, `users`

---

### 2.5 Unsubscribe

**Status:** ✅ Live  
**Entry point:** `GET /unsubscribe?email=<encoded>`

**Description:** Allows waitlist subscribers to unsubscribe. Linked from the Resend welcome email footer.

---

### 2.6 Operational Health Check

**Status:** ✅ Live  
**Entry point:** `GET /api/cron/health` (Vercel Cron, hourly)

**Description:** Simple health check endpoint called by Vercel Cron every hour (`0 * * * *`). Returns `{ status: "ok", timestamp }`. Requires `Authorization: Bearer CRON_SECRET`.

---

## 3. In-Code but Undocumented Items

The following were found in code but are not yet in any product spec:

| Item | Location | Notes |
|------|----------|-------|
| `search_runs` table | `supabase/schema.sql` | Async search job tracking — no API yet |
| `opportunity_enrichment` table | `supabase/schema.sql` | Third-party enrichment data storage — no provider integrated |
| `opportunity_contacts` table | `supabase/schema.sql` | Contact info per opportunity — no UI yet |
| `fit_score` (0–100) + `fit_reasoning` | `opportunities` table | AI-generated scoring — model not yet integrated |
| `tech_stack[]` array | `opportunities` table | Technology detection — source not yet implemented |
| Social links in Footer | `components/Footer.tsx:24-39` | Commented out pending real URLs |

---

## 4. Out of Scope (Current Release)

- AI search / opportunity discovery engine
- Stripe billing integration
- CRM integrations (Salesforce, HubSpot)
- Email sequences / outreach automation
- Team invite flows
- Admin dashboard
