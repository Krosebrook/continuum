# ADR-005: Next.js Route Handlers + Zod Validation for API Design

**Status:** Accepted  
**Date:** 2026-01-15  
**Deciders:** Engineering team

---

## Context

Options for the API layer:

1. **Next.js Route Handlers** (`app/api/**/route.ts`) — co-located with app, serverless, no extra server
2. **Separate Express/Fastify API** — separate service, more ops overhead
3. **tRPC** — type-safe RPC, good for monorepo but adds learning curve
4. **GraphQL** — over-engineered for current feature set

For input validation:
1. **Zod 4.x** — runtime schema validation, TypeScript inference
2. **Yup** — similar but slower, less TypeScript-native
3. **Valibot** — newer, smaller bundle, less ecosystem support

## Decision

**Next.js Route Handlers** for the API layer and **Zod 4.x** for input validation.

## Rationale

### Route Handlers

- Zero additional infrastructure; API routes are deployed as serverless functions automatically by Vercel.
- Co-located with pages in the `app/` directory — easier to navigate.
- Full access to Next.js features (Edge Runtime, caching headers, `NextRequest`/`NextResponse`).
- `vercel.json` CORS and security headers apply to all routes uniformly.

### Zod Validation

- **Runtime + compile-time safety**: Zod schemas serve as both the TypeScript type source and the runtime validator.
- **`z.infer<>`** eliminates type duplication between schema and interface.
- Excellent error messages that can be forwarded directly to API consumers.
- Zod 4.x is significantly faster than v3 and has a smaller bundle.

## Pattern

```typescript
// lib/schemas/waitlist.ts
export const waitlistSchema = z.object({
  email: z.string().email('Invalid email'),
  name: z.string().min(2).max(100).optional(),
  company: z.string().max(100).optional(),
});
export type WaitlistInput = z.infer<typeof waitlistSchema>;

// app/api/waitlist/route.ts
const body = await request.json();
const result = waitlistSchema.safeParse(body);
if (!result.success) {
  return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
}
```

## Consequences

- **Positive:** Single repository, single deployment unit.
- **Positive:** Type safety from schema to handler to response.
- **Negative:** Route Handlers run serverless (cold start possible); not suitable for long-running tasks.
- **Negative:** No built-in API versioning (use path prefixes if needed: `/api/v2/...`).
