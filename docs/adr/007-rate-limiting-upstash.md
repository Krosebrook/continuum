# ADR-007: Upstash Redis for API Rate Limiting

**Status:** Accepted  
**Date:** 2026-01-20  
**Deciders:** Engineering team

---

## Context

The public `POST /api/waitlist` endpoint is unauthenticated and must be protected against abuse (spam signups, bot traffic). Options evaluated:

1. **Upstash Redis + `@upstash/ratelimit`** — Serverless Redis, per-IP sliding window, free tier
2. **Vercel Edge Middleware rate limiting** — Requires Vercel Pro plan
3. **Cloudflare Rate Limiting** — Requires DNS routing through Cloudflare
4. **In-memory rate limiting** — Does not work across serverless function instances
5. **No rate limiting** — Unacceptable; DB would fill with spam

## Decision

**Upstash Redis** with `@upstash/ratelimit`, configured as a **sliding window of 3 requests per hour per IP**.

## Rationale

- **Serverless-compatible** — Upstash REST API works in Vercel serverless functions without persistent connections.
- **Free tier** — Sufficient for pre-launch traffic (10,000 requests/day).
- **Simple integration** — `@upstash/ratelimit` provides a one-line check.
- **Optional** — When `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` are not set, rate limiting is gracefully skipped. This allows local development without a Redis instance.

## Configuration

```typescript
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, '1 h'),
});
const { success } = await ratelimit.limit(ip);
if (!success) return NextResponse.json({ error: '...' }, { status: 429 });
```

## Consequences

- **Positive:** Protects the only public write endpoint with zero infrastructure overhead.
- **Positive:** Graceful degradation when Redis is unavailable (optional).
- **Negative:** Upstash free tier has request limits; upgrade required at scale.
- **Negative:** Rate limit is per-IP; shared NAT could block legitimate users. Acceptable at pre-launch scale.
- **Risk:** If Upstash is misconfigured, rate limiting silently skips — not a security-critical feature, but worth monitoring.
