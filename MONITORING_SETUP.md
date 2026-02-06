# Monitoring Setup Guide

**Priority:** 🔴 CRITICAL - Required before public launch  
**Estimated Time:** 1-2 hours  
**Date:** February 6, 2026

---

## Overview

Based on the three-persona audit of ACTION_PLAN.md, the only critical gap identified before production launch is **error monitoring and alerting**. This guide provides step-by-step instructions to implement the recommended monitoring stack.

---

## 1. Error Monitoring with Sentry (CRITICAL)

**Why:** Detect and respond to production errors in real-time.

### Step 1: Install Sentry

```bash
npm install @sentry/nextjs
```

### Step 2: Initialize Sentry

```bash
npx @sentry/wizard@latest -i nextjs
```

This will:
- Create `sentry.client.config.ts`
- Create `sentry.server.config.ts`
- Create `sentry.edge.config.ts`
- Update `next.config.ts`

### Step 3: Add Environment Variables

Add to `.env.local`:
```env
SENTRY_DSN=https://your-dsn@sentry.io/your-project-id
SENTRY_ORG=your-org
SENTRY_PROJECT=continuum
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/your-project-id
```

Add to Vercel:
```bash
vercel env add SENTRY_DSN
vercel env add SENTRY_ORG
vercel env add SENTRY_PROJECT
vercel env add NEXT_PUBLIC_SENTRY_DSN
```

### Step 4: Configure Sentry (Optional)

Edit `sentry.server.config.ts`:
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Set sample rate for production
  tracesSampleRate: 0.1, // 10% of transactions
  
  // Capture 100% of errors
  sampleRate: 1.0,
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Ignore common errors
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
  ],
});
```

### Step 5: Test Error Monitoring

Add a test error route (remove after testing):
```typescript
// app/api/test-error/route.ts
export async function GET() {
  throw new Error('Test error for Sentry monitoring');
}
```

Visit `/api/test-error` and verify error appears in Sentry dashboard.

### Step 6: Configure Alerts

In Sentry dashboard:
1. Go to **Alerts** → **Create Alert Rule**
2. Set conditions:
   - Alert when: "Error count" is above 10 in 1 hour
   - Action: Email/Slack notification
3. Create alert for critical endpoints:
   - `/api/waitlist` error rate > 5%
   - Any 500 errors

**Cost:** Free for up to 5,000 events/month  
**Upgrade:** $26/month for 50,000 events (only if needed)

---

## 2. Uptime Monitoring (RECOMMENDED)

**Why:** Get notified immediately if the site goes down.

### Option A: UptimeRobot (Free - Recommended)

**Sign up:** https://uptimerobot.com (free account)

**Configure monitors:**

1. **Website Monitor**
   - URL: `https://your-site.vercel.app`
   - Interval: 5 minutes
   - Alert: Email/SMS when down

2. **API Health Check**
   - URL: `https://your-site.vercel.app/api/waitlist`
   - Interval: 5 minutes
   - Keyword check: `"status":"ok"`
   - Alert: Email/SMS when down or keyword missing

**Cost:** Free for 50 monitors (more than enough)

### Option B: Pingdom (Paid - More Features)

**Cost:** $10/month  
**Features:** More detailed analytics, faster checks

---

## 3. Performance Monitoring (OPTIONAL - Week 1)

**Why:** Identify slow pages and API endpoints.

### Vercel Analytics

**Enable in Vercel Dashboard:**
1. Go to your project
2. Click "Analytics" tab
3. Enable Web Analytics

**Add to code:**
```bash
npm install @vercel/analytics
```

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

**Cost:** Free on all Vercel plans

---

## 4. Logs Aggregation (OPTIONAL - Month 1)

**Why:** Search and analyze logs across all functions.

### Option A: Vercel Log Drains

Configure in Vercel dashboard to send logs to:
- Datadog
- Logtail
- Axiom
- Custom HTTP endpoint

### Option B: Axiom (Recommended for startups)

**Cost:** Free for 500MB/month  
**Setup:**
1. Sign up at axiom.co
2. Create dataset
3. Add Vercel Log Drain integration
4. Query logs with SQL-like syntax

---

## 5. Database Monitoring (Built-in)

**Supabase Dashboard:**
- Query performance metrics
- Connection pool usage
- Slow query log
- Error rates

**No additional setup required** - already included in Supabase.

---

## 6. Rate Limit Analytics (Built-in)

**Upstash Dashboard:**
- Request counts
- Rate limit violations
- Geographic distribution

**Already enabled** via `analytics: true` in rate limiter config.

---

## Quick Start Checklist

For minimal production-ready monitoring (1-2 hours):

- [ ] **Install Sentry** (30 min)
  - `npm install @sentry/nextjs`
  - `npx @sentry/wizard@latest -i nextjs`
  - Add environment variables
  - Configure alerts for critical errors

- [ ] **Set up UptimeRobot** (15 min)
  - Create account
  - Add website monitor
  - Add API health check
  - Configure email alerts

- [ ] **Enable Vercel Analytics** (5 min)
  - Install package
  - Add to root layout
  - Deploy

- [ ] **Test monitoring** (10 min)
  - Trigger test error
  - Verify Sentry alert
  - Stop Vercel deployment
  - Verify UptimeRobot alert

**Total Time:** 1 hour

---

## Alert Configuration Recommendations

### Critical Alerts (Immediate Response)
- Site down (UptimeRobot)
- API error rate > 10% (Sentry)
- Database connection failures (Sentry)

### High Priority (1 hour response)
- API error rate > 5% (Sentry)
- API response time > 2 seconds (Vercel)
- Rate limit violations > 100/hour (manual check)

### Medium Priority (24 hour response)
- New error types (Sentry)
- Slow database queries > 1 second (Supabase)

---

## Cost Summary

| Service | Free Tier | Paid (if needed) |
|---------|-----------|------------------|
| Sentry | 5K events/month | $26/mo for 50K |
| UptimeRobot | 50 monitors | $7/mo for more |
| Vercel Analytics | Unlimited | Included |
| Supabase Metrics | Included | Included |
| Upstash Analytics | Included | Included |

**Total Monthly Cost:** $0 (free tiers sufficient for MVP)

---

## Post-Setup Verification

After completing monitoring setup, verify:

1. **Error Tracking:**
   - Create test error
   - Check Sentry dashboard (should appear within 1 minute)
   - Verify email alert received

2. **Uptime Monitoring:**
   - Stop Vercel deployment
   - Wait 5 minutes
   - Verify UptimeRobot alert received
   - Restart deployment

3. **Analytics:**
   - Visit your site
   - Check Vercel Analytics (may take 1-24 hours)

---

## Next Steps After Monitoring

Once monitoring is in place:

1. **Week 1:**
   - Fix failing test mocks
   - Add E2E tests
   - Document runbooks

2. **Week 2:**
   - Monitor for 7 days
   - Review error patterns
   - Optimize based on metrics

3. **Month 1:**
   - GDPR compliance (if targeting EU)
   - Performance optimizations
   - Scale monitoring as needed

---

## Troubleshooting

### Sentry not capturing errors
- Check `SENTRY_DSN` is set correctly
- Verify `sentry.*.config.ts` files exist
- Check browser console for Sentry initialization errors

### UptimeRobot not alerting
- Verify email/SMS contact is confirmed
- Check alert settings (threshold, interval)
- Test by stopping deployment

### High Sentry costs
- Reduce `tracesSampleRate` to 0.01 (1%)
- Add more `ignoreErrors` patterns
- Use Sentry's "Inbound Filters" to exclude noisy errors

---

## Support

- **Sentry Docs:** https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **UptimeRobot Docs:** https://uptimerobot.com/help/
- **Vercel Analytics:** https://vercel.com/docs/analytics

---

**Status:** 🔴 Required before public launch  
**Priority:** CRITICAL  
**Effort:** 1-2 hours  
**ROI:** High - Prevent undetected outages and errors

Once this monitoring is in place, the application is fully production-ready with a comprehensive observability stack. ✅
