# ADR-002: Supabase as Database and Authentication Provider

**Status:** Accepted  
**Date:** 2026-01-15  
**Deciders:** Engineering team

---

## Context

The platform requires:
- A relational database with multi-tenant isolation
- User authentication (magic links, potentially OAuth)
- Row-level security so tenants cannot see each other's data
- Minimal operational overhead for a small team

Options evaluated:

1. **Supabase** — Managed PostgreSQL + Auth + RLS + Realtime
2. **PlanetScale** — MySQL-based, no RLS, Auth must be separate
3. **Neon** — Serverless PostgreSQL, Auth must be separate
4. **Firebase** — Document DB, weaker relational query support

## Decision

**Supabase** for both the database (PostgreSQL) and authentication.

## Rationale

- **PostgreSQL with RLS** allows us to enforce multi-tenant isolation at the database layer using JWT claims (`org_id`), eliminating an entire class of data-leak bugs.
- **Supabase Auth** provides magic links, OAuth providers, and PKCE flows without a separate auth service.
- **`service_role` key** allows server-side code to bypass RLS when necessary (e.g., admin writes), while client-side code uses the `anon` key and is always scoped by RLS.
- **JavaScript client** (`@supabase/supabase-js`) works in both browser and Node/Edge environments.
- **Generous free tier** suitable for pre-launch.

## Consequences

- **Positive:** Multi-tenancy enforced at the DB layer — no application-level `WHERE org_id = ?` required on every query.
- **Positive:** Auth + DB in one service reduces credential sprawl.
- **Negative:** Supabase vendor lock-in; migrating off would require re-implementing auth and RLS.
- **Negative:** `service_role` key must be strictly guarded server-side; exposure would bypass all RLS.

## Schema

See `supabase/schema.sql` and `docs/DATABASE.md` for the full schema.

## Related

- ADR-003: Cookie-based JWT auth
