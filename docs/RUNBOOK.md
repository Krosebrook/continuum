# Runbook

**Service:** Continuum  
**Owner:** Engineering  
**Last Updated:** 2026-03-12

This runbook covers operational procedures for the Continuum production deployment on Vercel.

---

## Table of Contents

1. [Startup & Shutdown](#startup--shutdown)
2. [Health Checks](#health-checks)
3. [Environment Variable Reference](#environment-variable-reference)
4. [Failure Modes](#failure-modes)
5. [Database Operations](#database-operations)
6. [Monitoring](#monitoring)
7. [Incident Response](#incident-response)

---

## Startup & Shutdown

### Production (Vercel)

Continuum is deployed as a serverless application on Vercel. There is no persistent server process to start or stop.

**Deploy a new version:**
```bash
git push origin main
# Vercel CI/CD auto-deploys on push to main
# Monitor deployment at: https://vercel.com/your-org/continuum
```

**Roll back a deployment:**
1. Go to Vercel Dashboard → Deployments
2. Find the last known-good deployment
3. Click **Promote to Production**

**Force re-deploy without code change:**
```bash
# Trigger via Vercel CLI
vercel --prod
```

### Development

```bash
npm run dev     # Start at http://localhost:3000 (hot reload)
npm run build   # Production build (validates types + bundles)
npm start       # Start production build locally
```

---

## Health Checks

### Primary health check

```bash
curl -s https://continuum.vercel.app/api/waitlist
# Expected: {"status":"ok","route":"waitlist"}
```

### Cron health check (requires CRON_SECRET)

```bash
curl -s https://continuum.vercel.app/api/cron/health \
  -H "Authorization: Bearer $CRON_SECRET"
# Expected: {"status":"ok","timestamp":"<ISO 8601>"}
```

### Verify Vercel Cron is running

1. Vercel Dashboard → Project → Cron Jobs
2. Confirm `/api/cron/health` last ran within the past hour
3. If missed runs: check Vercel function logs for errors

---

## Environment Variable Reference

### Required — service will not start correctly without these

| Variable | Where to Get | Notes |
|----------|-------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API | `anon` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API | **Keep secret; server-side only** |

### Optional — service degrades gracefully without these

| Variable | Effect When Missing |
|----------|---------------------|
| `RESEND_API_KEY` | No confirmation emails sent; signups still work |
| `RESEND_FROM_EMAIL` | No emails sent |
| `UPSTASH_REDIS_REST_URL` | Rate limiting disabled on `/api/waitlist` |
| `UPSTASH_REDIS_REST_TOKEN` | Rate limiting disabled |
| `CRON_SECRET` | Cron health endpoint returns 401 (set to any strong random string) |
| `NEXT_PUBLIC_SITE_URL` | Defaults to `https://continuum.vercel.app`; affects unsubscribe links in emails |
| `NEXT_PUBLIC_APP_VERSION` | Informational only |

### Rotating secrets

1. Generate new value
2. Update in Vercel Dashboard → Project Settings → Environment Variables
3. Trigger a new Vercel deployment (env vars are baked in at build time for `NEXT_PUBLIC_*`; server-side vars are available at runtime)
4. Revoke the old value in the provider (Supabase, Upstash, Resend)

---

## Failure Modes

### `/api/waitlist` returns 500

**Likely cause:** Supabase connection failure or schema mismatch

**Steps:**
1. Check Vercel function logs: Dashboard → Functions → waitlist
2. Check Supabase status: https://status.supabase.com
3. Verify `SUPABASE_SERVICE_ROLE_KEY` is current
4. Run: `SELECT 1 FROM waitlist LIMIT 1;` in Supabase SQL editor to verify table exists

---

### Users cannot sign in (magic link not working)

**Likely cause:** Supabase Auth configuration or email provider issue

**Steps:**
1. Supabase Dashboard → Authentication → Logs — check for errors
2. Verify redirect URL `https://continuum.vercel.app/auth/callback` is in Supabase Auth → URL Configuration → Redirect URLs
3. Check if Supabase's built-in email provider is hitting rate limits (free tier: 4 emails/hour)
4. Consider configuring a custom SMTP provider in Supabase Auth settings for production

---

### Users stuck in auth redirect loop (`/login` → `/login`)

**Likely cause:** Middleware failing to set cookies, or expired/invalid Supabase credentials

**Steps:**
1. Check browser DevTools → Application → Cookies for `sb-access-token` and `sb-refresh-token`
2. Check Vercel function logs for middleware errors
3. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
4. If cookies are present but invalid: clear cookies and retry

---

### Rate limiting not working (spam signups)

**Likely cause:** `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` not set

**Steps:**
1. Verify env vars are set in Vercel Dashboard
2. Check Upstash console for request metrics
3. If Upstash is down: the app falls back to no rate limiting (by design) — check Upstash status

---

### Cron job missing (no recent `/api/cron/health` runs)

**Likely cause:** Vercel Cron paused (can happen on free plan limits)

**Steps:**
1. Vercel Dashboard → Project → Cron Jobs → check status
2. Manually trigger: `curl https://continuum.vercel.app/api/cron/health -H "Authorization: Bearer $CRON_SECRET"`
3. If Vercel Cron is paused, re-enable it in the dashboard

---

### Confirmation emails not being delivered

**Likely cause:** Resend misconfiguration or domain not verified

**Steps:**
1. Check Resend dashboard → Logs for delivery errors
2. Verify `RESEND_FROM_EMAIL` matches a verified domain in Resend
3. Check spam folder — Resend unverified domains may trigger spam filters
4. Verify `NEXT_PUBLIC_SITE_URL` is set correctly (affects unsubscribe links)

---

## Database Operations

### View waitlist

```sql
SELECT id, email, name, company, status, created_at
FROM waitlist
ORDER BY created_at DESC
LIMIT 50;
```

### Invite a waitlist subscriber

```sql
UPDATE waitlist
SET status = 'invited', invited_at = NOW()
WHERE email = 'user@example.com';
```

### Convert a subscriber to full user

```sql
UPDATE waitlist
SET status = 'converted', converted_at = NOW()
WHERE email = 'user@example.com';
```

### View organisations and users

```sql
SELECT o.name AS org, o.plan, u.email, u.role
FROM organizations o
JOIN users u ON u.org_id = o.id
ORDER BY o.created_at DESC;
```

### Emergency: disable rate limiting for an IP

Rate limits are stored in Upstash Redis with TTL. To reset:
1. Upstash Console → Redis → Keys — find the key matching the IP
2. Delete the key

---

## Monitoring

**Currently configured:**
- Vercel built-in function metrics (invocations, errors, duration)
- Vercel Cron job status dashboard
- Upstash Redis metrics (request count, rate limit hits)
- Resend email delivery dashboard

**Not yet configured (see `docs/ROADMAP.md` T1-4):**
- Sentry error tracking — no visibility into production exceptions
- Alerting on error rate spikes

**Manual monitoring:**
```bash
# Check recent waitlist signups (last 24h)
# Run in Supabase SQL Editor:
SELECT COUNT(*) FROM waitlist WHERE created_at > NOW() - INTERVAL '24 hours';
```

---

## Incident Response

### Severity Levels

| Level | Description | Response Time | Example |
|-------|-------------|---------------|---------|
| P0 | Full outage — service unavailable | Immediate | `/` returns 500 |
| P1 | Core feature broken | < 1 hour | Waitlist signup fails |
| P2 | Degraded — optional feature broken | < 4 hours | Emails not sending |
| P3 | Minor / cosmetic | Next business day | Stale comment in code |

### P0 Response Checklist

1. Verify outage: `curl https://continuum.vercel.app/api/waitlist`
2. Check Vercel status: https://www.vercel-status.com
3. Check Supabase status: https://status.supabase.com
4. Check Vercel function logs for errors
5. If recent deployment: roll back immediately (Vercel Dashboard → Promote previous deployment)
6. If infrastructure issue: wait for provider resolution + post status update
7. Post-incident: write incident report, add to `CHANGELOG.md`
