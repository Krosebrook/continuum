# Technical Roadmap

**Project:** Continuum  
**Scoring method:** WSJF (Weighted Shortest Job First)  
**WSJF = (Business Value + Time Criticality + Risk Reduction) / Job Size**  
**Scale:** 1 (lowest) – 10 (highest) per dimension  
**Last Updated:** 2026-03-12

---

## Scoring Key

| Column | Description |
|--------|-------------|
| BV | Business Value (user/revenue impact) |
| TC | Time Criticality (cost of delay) |
| RR | Risk Reduction (technical/security risk removed) |
| Size | Effort (1=hours, 3=days, 5=week, 8=2 weeks, 13=month) |
| WSJF | (BV + TC + RR) / Size |

---

## Tier 1 — Do Now (WSJF ≥ 7)

| # | Item | BV | TC | RR | Size | WSJF | Notes |
|---|------|----|----|----|------|------|-------|
| T1-1 | Fix `WaitlistForm.test.tsx` (React 19 + RTL timing) | 5 | 4 | 6 | 3 | **5.0** | 6/7 tests failing; confidence in form is low; fix with `act()` wrappers or RTL upgrade |
| T1-2 | Delete `lib/supabase-server.ts` orphaned file | 2 | 2 | 5 | 1 | **9.0** | No imports; confuses contributors; trivial delete |
| T1-3 | Fix stale comment in `app/api/waitlist/route.ts:31` | 1 | 1 | 3 | 1 | **5.0** | One-line fix |
| T1-4 | Add Sentry error monitoring | 6 | 7 | 7 | 3 | **6.7** | No visibility into production errors today; blocking for GA |
| T1-5 | Implement dashboard opportunity list | 9 | 8 | 3 | 8 | **2.5** | Core product value; stubs not shippable |

---

## Tier 2 — Do Soon (WSJF 4–7)

| # | Item | BV | TC | RR | Size | WSJF | Notes |
|---|------|----|----|----|------|------|-------|
| T2-1 | ICP create / edit forms (functional) | 8 | 6 | 2 | 8 | **2.0** | Prerequisite for AI search |
| T2-2 | `flatted < 3.4.0` DoS vulnerability | 2 | 3 | 8 | 5 | **2.6** | Requires Next.js major upgrade; track and upgrade when stable |
| T2-3 | React Error Boundaries on dashboard pages | 4 | 3 | 5 | 3 | **4.0** | Unhandled RSC errors crash entire page |
| T2-4 | E2E Playwright tests for waitlist flow | 5 | 4 | 5 | 3 | **4.7** | Config exists; no tests written |
| T2-5 | Waitlist admin tooling (invite / convert flow) | 7 | 6 | 2 | 5 | **3.0** | `status` column exists; no UI to change it |
| T2-6 | Populate `Footer.tsx` social links | 2 | 2 | 1 | 1 | **5.0** | Blocked on confirming social profiles |

---

## Tier 3 — Plan (WSJF 2–4)

| # | Item | BV | TC | RR | Size | WSJF | Notes |
|---|------|----|----|----|------|------|-------|
| T3-1 | AI opportunity discovery engine | 10 | 5 | 2 | 13 | **1.3** | Core product; large effort |
| T3-2 | Stripe billing integration | 7 | 4 | 3 | 8 | **1.75** | `plan` column ready; logic not started |
| T3-3 | Test coverage target ≥ 80% | 4 | 2 | 6 | 8 | **1.5** | Currently ~35% estimated |
| T3-4 | Migrate to `@supabase/ssr` | 2 | 1 | 3 | 5 | **1.2** | See ADR-003; low urgency |
| T3-5 | Team invite flow | 6 | 3 | 2 | 5 | **2.2** | Multi-user orgs |
| T3-6 | Analytics dashboard data | 6 | 3 | 1 | 8 | **1.25** | Page stubbed |

---

## Tier 4 — Backlog

| # | Item | Notes |
|---|------|-------|
| T4-1 | CRM integrations (Salesforce, HubSpot) | Post-GA |
| T4-2 | Email sequence / outreach automation | Post-GA |
| T4-3 | Admin super-user dashboard | Post-GA |
| T4-4 | `@next/bundle-analyzer` audit | Nice-to-have |
| T4-5 | Storybook for component catalogue | Nice-to-have |
| T4-6 | OpenTelemetry tracing | Post-GA |

---

## Not Recommended

| Item | Reason |
|------|--------|
| Migrate off Supabase | High vendor lock-in cost; RLS provides significant security value |
| Replace Tailwind with CSS Modules | No ROI; Tailwind working well |
| Add GraphQL layer | Over-engineered for current API surface |
| In-memory rate limiting | Non-functional in serverless (multiple instances) |
