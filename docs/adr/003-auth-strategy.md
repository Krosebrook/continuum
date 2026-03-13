# ADR-003: Cookie-Based JWT Auth (Manual, Not @supabase/ssr)

**Status:** Accepted  
**Date:** 2026-01-20  
**Deciders:** Engineering team

---

## Context

Supabase provides two official approaches for Next.js authentication:

1. **`@supabase/ssr`** — Official SSR helper package that manages cookies automatically
2. **Manual cookie management** — Reading/writing `sb-access-token` and `sb-refresh-token` cookies in middleware and Route Handlers

We also evaluated:
- NextAuth.js (now Auth.js) — additional dependency, works well with Supabase but adds complexity
- Server-side sessions (e.g., iron-session) — requires custom user management

## Decision

**Manual cookie-based JWT management** using `lib/supabase/middleware.ts` and `lib/hooks/useAuth.ts`.

## Rationale

- At the time of implementation, `@supabase/ssr` was in flux with breaking changes; manual management gave us full control.
- The cookie names (`sb-access-token`, `sb-refresh-token`) are Supabase's standard names, so compatibility with Supabase tooling is maintained.
- `lib/supabase/middleware.ts` handles token refresh transparently on every request.
- The `useAuth` hook encapsulates all client-side auth state and listens to the `SIGNED_IN` / `SIGNED_OUT` events from the Supabase JS client.
- Magic links via `/auth/callback` use PKCE code exchange (`exchangeCodeForSession`), which is secure against interception.

## Implementation

```
middleware.ts
  └── lib/supabase/middleware.ts  → refreshes session, updates cookies
  
lib/hooks/useAuth.ts             → browser auth state, sign-in, sign-out
app/auth/callback/route.ts       → code exchange for magic links / OAuth
app/api/auth/signout/route.ts    → cookie clear + redirect
```

## Consequences

- **Positive:** Full control over cookie lifetimes and security attributes.
- **Positive:** No dependency on `@supabase/ssr` version churn.
- **Negative:** Manual implementation means we own the token-refresh logic; bugs here could cause auth loops.
- **Negative:** If Supabase changes cookie names, we must update manually.
- **Risk:** If `SUPABASE_SERVICE_ROLE_KEY` is exposed, all RLS is bypassed. This key is server-side only.

## Security Notes

- Cookies use `HttpOnly`, `Secure`, `SameSite=Lax` attributes (set by Supabase JS client defaults).
- Access tokens expire after 1 hour; refresh tokens after 7 days.
- PKCE is used for magic-link flows.

## Related

- ADR-002: Supabase as database + auth
