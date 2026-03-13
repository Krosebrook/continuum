# Database Reference

**Engine:** PostgreSQL (managed by Supabase)  
**Multi-tenancy:** `org_id` scoping with Row-Level Security (RLS) on all tenant tables  
**Auth:** JWT claim `auth.jwt() ->> 'org_id'` used in RLS policies  
**Schema file:** `supabase/schema.sql`

---

## Table of Contents

1. [waitlist](#1-waitlist)
2. [organizations](#2-organizations)
3. [users](#3-users)
4. [icps](#4-icps)
5. [opportunities](#5-opportunities)
6. [opportunity_enrichment](#6-opportunity_enrichment)
7. [opportunity_contacts](#7-opportunity_contacts)
8. [search_runs](#8-search_runs)

---

## 1. waitlist

Pre-launch email waitlist. Stores signup requests before a user account exists.

### Columns

| Column | Type | Nullable | Default | Constraints | Notes |
|--------|------|----------|---------|-------------|-------|
| `id` | `uuid` | No | `uuid_generate_v4()` | PK | |
| `email` | `text` | No | — | UNIQUE, NOT NULL | Lowercase email |
| `name` | `text` | Yes | `NULL` | — | DOMPurify-sanitised on insert |
| `company` | `text` | Yes | `NULL` | — | DOMPurify-sanitised on insert |
| `source` | `text` | Yes | `NULL` | — | Referral source (e.g., `"landing_page"`) |
| `status` | `text` | No | `'pending'` | CHECK IN (`pending`, `invited`, `converted`) | Lifecycle state |
| `created_at` | `timestamptz` | No | `now()` | — | |
| `invited_at` | `timestamptz` | Yes | `NULL` | — | Set when `status → invited` |
| `converted_at` | `timestamptz` | Yes | `NULL` | — | Set when `status → converted` |

### Indexes

- `waitlist_pkey` — PRIMARY KEY (`id`)
- `waitlist_email_key` — UNIQUE (`email`)

### RLS

RLS is **enabled**. The `waitlist` table is write-public (insert via `SUPABASE_SERVICE_ROLE_KEY` from the API route) and read-restricted. Only service-role has SELECT/UPDATE access.

### Relationships

None (pre-auth; no `org_id`).

---

## 2. organizations

Tenant (organisation) accounts. One org can have many users.

### Columns

| Column | Type | Nullable | Default | Constraints | Notes |
|--------|------|----------|---------|-------------|-------|
| `id` | `uuid` | No | `uuid_generate_v4()` | PK | |
| `name` | `text` | No | — | NOT NULL | Organisation display name |
| `plan` | `text` | No | `'solo'` | CHECK IN (`solo`, `team`, `enterprise`) | Billing plan |
| `stripe_customer_id` | `text` | Yes | `NULL` | — | Set when Stripe billing is configured |
| `created_at` | `timestamptz` | No | `now()` | — | |
| `updated_at` | `timestamptz` | No | `now()` | — | Updated via trigger |

### Indexes

- `organizations_pkey` — PRIMARY KEY (`id`)

### RLS

Enabled. Users can only read/update their own organisation (`id = (auth.jwt() ->> 'org_id')::uuid`).

---

## 3. users

Application user profiles. One-to-one with `auth.users` (Supabase Auth).

### Columns

| Column | Type | Nullable | Default | Constraints | Notes |
|--------|------|----------|---------|-------------|-------|
| `id` | `uuid` | No | — | PK, FK → `auth.users(id)` | Same UUID as Supabase auth user |
| `org_id` | `uuid` | No | — | FK → `organizations(id)` | Tenant scope |
| `email` | `text` | No | — | NOT NULL | Mirror of auth email |
| `full_name` | `text` | Yes | `NULL` | — | |
| `role` | `text` | No | `'member'` | CHECK IN (`owner`, `admin`, `member`, `viewer`) | Org-level role |
| `created_at` | `timestamptz` | No | `now()` | — | |
| `last_sign_in_at` | `timestamptz` | Yes | `NULL` | — | Updated on SIGNED_IN event |

### Indexes

- `users_pkey` — PRIMARY KEY (`id`)
- `users_org_id_idx` — INDEX (`org_id`)

### RLS

Enabled. Users can read all members of their org (`org_id = (auth.jwt() ->> 'org_id')::uuid`). Only `owner`/`admin` roles can update others.

### Relationships

- `org_id` → `organizations.id`
- `id` → `auth.users.id`

---

## 4. icps

Ideal Customer Profiles. Define the target account criteria for opportunity search.

### Columns

| Column | Type | Nullable | Default | Constraints | Notes |
|--------|------|----------|---------|-------------|-------|
| `id` | `uuid` | No | `uuid_generate_v4()` | PK | |
| `org_id` | `uuid` | No | — | FK → `organizations(id)` | Tenant scope |
| `name` | `text` | No | — | NOT NULL | ICP display name |
| `industry` | `text[]` | Yes | `'{}'` | — | Target industries |
| `company_size` | `text[]` | Yes | `'{}'` | — | e.g., `["1-10", "11-50"]` |
| `revenue_range` | `text[]` | Yes | `'{}'` | — | e.g., `["$1M-$10M"]` |
| `location` | `text[]` | Yes | `'{}'` | — | Target geographies |
| `keywords` | `text[]` | Yes | `'{}'` | — | Search keywords for AI discovery |
| `is_active` | `boolean` | No | `true` | — | Soft disable without delete |
| `created_at` | `timestamptz` | No | `now()` | — | |
| `updated_at` | `timestamptz` | No | `now()` | — | Updated via trigger |

### Indexes

- `icps_pkey` — PRIMARY KEY (`id`)
- `icps_org_id_idx` — INDEX (`org_id`)

### RLS

Enabled. Full CRUD for org members (`org_id = (auth.jwt() ->> 'org_id')::uuid`).

### Relationships

- `org_id` → `organizations.id`
- `id` ← `opportunities.icp_id`
- `id` ← `search_runs.icp_id`

---

## 5. opportunities

Discovered company accounts matched against an ICP.

### Columns

| Column | Type | Nullable | Default | Constraints | Notes |
|--------|------|----------|---------|-------------|-------|
| `id` | `uuid` | No | `uuid_generate_v4()` | PK | |
| `org_id` | `uuid` | No | — | FK → `organizations(id)` | Tenant scope |
| `icp_id` | `uuid` | Yes | `NULL` | FK → `icps(id)` | Which ICP discovered this |
| `company_name` | `text` | No | — | NOT NULL | |
| `domain` | `text` | Yes | `NULL` | — | Company website domain |
| `description` | `text` | Yes | `NULL` | — | Company description |
| `source_url` | `text` | Yes | `NULL` | — | Discovery source URL |
| `industry` | `text` | Yes | `NULL` | — | |
| `employee_count` | `integer` | Yes | `NULL` | — | |
| `revenue_estimate` | `text` | Yes | `NULL` | — | e.g., `"$5M-$20M"` |
| `location` | `text` | Yes | `NULL` | — | HQ location |
| `funding_stage` | `text` | Yes | `NULL` | — | e.g., `"Series A"` |
| `tech_stack` | `text[]` | Yes | `'{}'` | — | Detected technologies |
| `fit_score` | `integer` | Yes | `NULL` | CHECK 0–100 | AI-generated fit score |
| `fit_reasoning` | `text` | Yes | `NULL` | — | AI explanation |
| `status` | `text` | No | `'new'` | CHECK IN (`new`, `reviewed`, `contacted`, `qualified`, `disqualified`) | Pipeline stage |
| `discovered_at` | `timestamptz` | No | `now()` | — | |
| `enriched_at` | `timestamptz` | Yes | `NULL` | — | Set after enrichment |
| `reviewed_at` | `timestamptz` | Yes | `NULL` | — | Set when first reviewed |

### Indexes

- `opportunities_pkey` — PRIMARY KEY (`id`)
- `opportunities_org_id_idx` — INDEX (`org_id`)
- `opportunities_icp_id_idx` — INDEX (`icp_id`)
- `opportunities_status_idx` — INDEX (`status`)
- `opportunities_fit_score_idx` — INDEX (`fit_score DESC`)

### RLS

Enabled. Read/write for org members.

### Relationships

- `org_id` → `organizations.id`
- `icp_id` → `icps.id`
- `id` ← `opportunity_enrichment.opportunity_id`
- `id` ← `opportunity_contacts.opportunity_id`

---

## 6. opportunity_enrichment

Third-party enrichment data for an opportunity (e.g., Clearbit, Apollo).

### Columns

| Column | Type | Nullable | Default | Constraints | Notes |
|--------|------|----------|---------|-------------|-------|
| `id` | `uuid` | No | `uuid_generate_v4()` | PK | |
| `opportunity_id` | `uuid` | No | — | FK → `opportunities(id)` | |
| `provider` | `text` | No | — | NOT NULL | e.g., `"clearbit"`, `"apollo"` |
| `data` | `jsonb` | No | — | NOT NULL | Raw provider response |
| `enriched_at` | `timestamptz` | No | `now()` | — | |

### Indexes

- `opportunity_enrichment_pkey` — PRIMARY KEY (`id`)
- `opportunity_enrichment_opportunity_id_idx` — INDEX (`opportunity_id`)

### RLS

Enabled. Read access for org members via join to `opportunities`.

### Relationships

- `opportunity_id` → `opportunities.id`

---

## 7. opportunity_contacts

Individual contacts at an opportunity company.

### Columns

| Column | Type | Nullable | Default | Constraints | Notes |
|--------|------|----------|---------|-------------|-------|
| `id` | `uuid` | No | `uuid_generate_v4()` | PK | |
| `opportunity_id` | `uuid` | No | — | FK → `opportunities(id)` | |
| `full_name` | `text` | Yes | `NULL` | — | |
| `title` | `text` | Yes | `NULL` | — | Job title |
| `email` | `text` | Yes | `NULL` | — | |
| `linkedin_url` | `text` | Yes | `NULL` | — | |
| `phone` | `text` | Yes | `NULL` | — | |
| `is_primary` | `boolean` | No | `false` | — | Primary contact flag |
| `created_at` | `timestamptz` | No | `now()` | — | |

### Indexes

- `opportunity_contacts_pkey` — PRIMARY KEY (`id`)
- `opportunity_contacts_opportunity_id_idx` — INDEX (`opportunity_id`)

### RLS

Enabled. Read/write for org members via join to `opportunities`.

### Relationships

- `opportunity_id` → `opportunities.id`

---

## 8. search_runs

Tracks async AI opportunity discovery jobs.

### Columns

| Column | Type | Nullable | Default | Constraints | Notes |
|--------|------|----------|---------|-------------|-------|
| `id` | `uuid` | No | `uuid_generate_v4()` | PK | |
| `org_id` | `uuid` | No | — | FK → `organizations(id)` | |
| `icp_id` | `uuid` | Yes | `NULL` | FK → `icps(id)` | Which ICP was searched |
| `status` | `text` | No | `'running'` | CHECK IN (`running`, `completed`, `failed`) | Job status |
| `opportunities_found` | `integer` | Yes | `NULL` | — | Count on completion |
| `error_message` | `text` | Yes | `NULL` | — | Set on failure |
| `started_at` | `timestamptz` | No | `now()` | — | |
| `completed_at` | `timestamptz` | Yes | `NULL` | — | Set on completion or failure |

### Indexes

- `search_runs_pkey` — PRIMARY KEY (`id`)
- `search_runs_org_id_idx` — INDEX (`org_id`)
- `search_runs_icp_id_idx` — INDEX (`icp_id`)
- `search_runs_status_idx` — PARTIAL INDEX (`status`) WHERE `status = 'running'`

### RLS

Enabled. Read for org members.

### Relationships

- `org_id` → `organizations.id`
- `icp_id` → `icps.id`

---

## Entity Relationship Summary

```
auth.users (Supabase)
    │
    └─── users ─────────── organizations
            │                    │
            │          ┌─────────┴──────────────────┐
            │          │                             │
            │        icps                     (billing: stripe)
            │          │
            │    search_runs
            │
            └── (via org_id) opportunities
                              │
                    ┌─────────┴──────────────────┐
                    │                            │
           opportunity_enrichment    opportunity_contacts
```
