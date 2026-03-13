# ADR-001: Next.js App Router as Application Framework

**Status:** Accepted  
**Date:** 2026-01-15  
**Deciders:** Engineering team

---

## Context

We needed a React-based full-stack framework that supports server-side rendering, file-based routing, API routes, and edge deployments. Options evaluated:

1. **Next.js 16 (App Router)** — React 19, RSC, streaming SSR, Vercel-native
2. **Remix** — Excellent data-loading model, less ecosystem momentum
3. **SvelteKit** — Non-React, smaller team familiarity
4. **Vite + React SPA** — No SSR, SEO limitations

## Decision

**Next.js 16 with the App Router** is the framework.

## Rationale

- **React Server Components (RSC)** reduce client bundle size by keeping data-fetching server-side, reducing JavaScript sent to browsers.
- **Streaming SSR** improves perceived performance for dashboard pages.
- **Route Handlers** (`app/api/**`) provide API endpoints without a separate backend service.
- **Vercel first-class support** — zero-config deployment, Edge Middleware, Cron Jobs.
- **`use client` boundary** makes the server/client split explicit and auditable.
- TypeScript 5 strict-mode support is excellent.

## Consequences

- **Positive:** Full-stack TypeScript in one repo; Vercel deployment is trivial.
- **Positive:** React 19 concurrent features available out of the box.
- **Negative:** React 19 + Testing Library async timing is still maturing (see `WaitlistForm.test.tsx` failures).
- **Negative:** App Router documentation and ecosystem patterns are still evolving.

## Related

- ADR-003: Auth strategy (why not `@supabase/ssr`)
- ADR-005: API design
