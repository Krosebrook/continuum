# Security Documentation

**Project:** Continuum  
**Last Updated:** 2026-03-12  
**Auditor:** Copilot Audit Agent

---

## Table of Contents

1. [OWASP Top 10 Checklist](#owasp-top-10-checklist)
2. [Known Vulnerabilities](#known-vulnerabilities)
3. [Dependency Audit](#dependency-audit)
4. [Authentication Security Review](#authentication-security-review)
5. [Rate Limiting Configuration](#rate-limiting-configuration)
6. [Security Headers](#security-headers)
7. [Secrets Management](#secrets-management)
8. [Reporting a Vulnerability](#reporting-a-vulnerability)

---

## OWASP Top 10 Checklist

| # | Category | Status | Evidence | Findings |
|---|----------|--------|----------|---------|
| A01 | Broken Access Control | ✅ Mitigated | `middleware.ts` protects all `/dashboard/*`; Supabase RLS enforces `org_id` scoping on all tenant tables | No issues found |
| A02 | Cryptographic Failures | ✅ Mitigated | HSTS enabled; TLS enforced by Vercel; Supabase handles password hashing (bcrypt); JWT tokens used (not custom crypto) | No issues found |
| A03 | Injection | ✅ Mitigated | Supabase JS client uses parameterised queries; user input sanitised with `isomorphic-dompurify` before DB insert; Zod validation on all API inputs | No issues found |
| A04 | Insecure Design | ✅ Mitigated | Multi-tenant isolation at DB layer (RLS); service-role key server-side only; optional services (Resend, Upstash) degrade gracefully | No issues found |
| A05 | Security Misconfiguration | ✅ Mitigated | CSP, HSTS, X-Frame-Options, X-Content-Type-Options set in `vercel.json`; no default credentials; `.env.local` gitignored | No issues found |
| A06 | Vulnerable & Outdated Components | ⚠️ Partial | `npm audit` passes at `--audit-level=moderate`; 1 high-severity transitive dep (`flatted < 3.4.0`) with no available fix | See §Known Vulnerabilities |
| A07 | Identification & Authentication Failures | ✅ Mitigated | Supabase Auth with PKCE for magic links; HttpOnly cookies; token refresh on every request; `/api/auth/signout` clears cookies | No issues found |
| A08 | Software & Data Integrity Failures | ✅ Mitigated | `package-lock.json` committed; Vercel build from locked dependencies; no `eval` or dynamic code execution | No issues found |
| A09 | Security Logging & Monitoring Failures | ⚠️ Partial | `console.error` used for server errors; Vercel function logs available; no Sentry/alerting yet | Sentry planned (ROADMAP T1-4) |
| A10 | Server-Side Request Forgery (SSRF) | ✅ N/A | No user-controlled URLs are fetched server-side in current implementation | No current risk |

---

## Known Vulnerabilities

### HIGH — `flatted < 3.4.0` (CVE: DoS via unbounded recursion)

| Field | Detail |
|-------|--------|
| **Package** | `flatted` |
| **Severity** | High |
| **Type** | Denial of Service (unbounded recursion in `parse()`) |
| **Affected version** | `< 3.4.0` |
| **How it enters** | Transitive dependency via Next.js |
| **Direct fix available** | No — requires Next.js major version upgrade |
| **Exploitability** | Low in practice — `flatted.parse()` is not called on user input in this codebase |
| **Mitigations** | CI runs `npm audit --audit-level=high` with `continue-on-error: true`; tracked for resolution on Next.js upgrade |
| **Tracked in** | `docs/ROADMAP.md` T2-2 |

---

## Dependency Audit

```bash
npm audit --audit-level=moderate
# Expected: 0 vulnerabilities at moderate level
# 1 high-severity (flatted) — see above; no fix available

npm audit --audit-level=high
# Will report flatted; CI continues on error
```

Run before every release. Any **new** moderate or higher vulnerability requires a fix or documented exception before deployment.

### Audit Policy

| Severity | Policy |
|----------|--------|
| Critical | Block deployment; fix immediately |
| High | Block deployment unless documented exception exists |
| Moderate | Fix within 7 days; document exception if not fixable |
| Low | Fix at next dependency update cycle |

---

## Authentication Security Review

### Cookie Configuration

| Attribute | Value | Notes |
|-----------|-------|-------|
| `HttpOnly` | Yes | Prevents JavaScript access |
| `Secure` | Yes (production) | HTTPS only |
| `SameSite` | `Lax` | CSRF protection for form submissions |
| Cookie names | `sb-access-token`, `sb-refresh-token` | Supabase standard names |

### Token Lifetimes

| Token | Lifetime |
|-------|----------|
| Access token | 1 hour (Supabase default) |
| Refresh token | 7 days (Supabase default) |

### PKCE Flow

Magic links use Proof Key for Code Exchange (PKCE). The `/auth/callback` route calls `supabase.auth.exchangeCodeForSession(code)`. The code is single-use and short-lived.

### Service Role Key

`SUPABASE_SERVICE_ROLE_KEY` bypasses all Row-Level Security. It is:
- Used only in server-side Route Handlers (`lib/supabase/server.ts`)
- Never prefixed with `NEXT_PUBLIC_` (never sent to the browser)
- Rotated immediately if accidentally exposed

### Row-Level Security

All tenant-scoped tables have RLS enabled with policies of the form:

```sql
USING ((auth.jwt() ->> 'org_id')::uuid = org_id)
```

This means even if application-level `org_id` filtering is accidentally omitted from a query, the database will not return another tenant's data.

---

## Rate Limiting Configuration

| Setting | Value |
|---------|-------|
| Endpoint | `POST /api/waitlist` |
| Algorithm | Sliding window |
| Limit | 3 requests per hour |
| Scope | Per IP address |
| Provider | Upstash Redis |
| Behaviour when Upstash unavailable | Rate limiting silently disabled (graceful degradation) |

**Note:** Rate limiting is optional. If `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are not set, all requests are allowed through. This is acceptable for development but should be configured in production.

---

## Security Headers

Configured in `vercel.json`, applied to all responses:

| Header | Value |
|--------|-------|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |

---

## Secrets Management

- All secrets stored as Vercel environment variables (encrypted at rest)
- `.env.local` is in `.gitignore` — never committed
- No hardcoded secrets found in codebase (audited 2026-03-12)
- `NEXT_PUBLIC_*` variables are safe to expose to the browser (anon key, site URL, app version)
- `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `UPSTASH_REDIS_REST_TOKEN`, `CRON_SECRET` are server-side only

### Secret Rotation Procedure

1. Generate new value in the provider dashboard
2. Update in Vercel Dashboard → Environment Variables
3. Trigger a new deployment
4. Revoke the old value in the provider

---

## Reporting a Vulnerability

Please report security vulnerabilities privately by emailing **security@continuum.ai** (or opening a GitHub Security Advisory if the repository is public). Do not open a public GitHub issue for security vulnerabilities.

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if known)

We aim to acknowledge reports within 48 hours and provide a fix or mitigation plan within 7 days for critical/high issues.
