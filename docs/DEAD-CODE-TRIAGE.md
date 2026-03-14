# Dead-Code Triage Report

**Project:** Continuum  
**Audited:** 2026-03-12  
**Auditor:** Copilot Audit Agent  
**Status:** Awaiting approval

---

## Summary

| # | Location | Type | Risk | Recommendation |
|---|----------|------|------|----------------|
| 1 | `lib/supabase-server.ts` | Orphaned module (no imports) | Low | **DELETE** |
| 2 | `app/api/waitlist/route.ts:31` | Stale comment | Trivial | **FIX COMMENT** |
| 3 | `components/Footer.tsx:24-39` | Intentionally commented block | None | **KEEP** |

---

## Findings

### 1. `lib/supabase-server.ts` — Orphaned Export

**Classification:** Dead code – orphaned module  
**Lines:** 1–24  
**Author:** Kyle R (2026-03-12, human-written)  
**Risk:** Low (no runtime impact; confusion risk for contributors)

**Detail:**  
This file exports `getSupabaseServerClient()` but zero files import from `lib/supabase-server.ts`.
An enhanced replacement was created by an AI agent at `lib/supabase/server.ts`, which adds:
- `persistSession: false`
- `autoRefreshToken: false`
- Additional helper functions (`getSupabaseAdmin`, `getServerSession`)

**Evidence:**
```bash
$ grep -r "supabase-server" src/ app/ components/ lib/ --include="*.ts" --include="*.tsx"
# → no results
```

**Recommendation:** **DELETE** `lib/supabase-server.ts`.  
Keep `lib/supabase/server.ts` as the canonical server-side Supabase client.

---

### 2. `app/api/waitlist/route.ts:31` — Stale Comment

**Classification:** Stale comment (minor drift)  
**Line:** 31  
**Risk:** Trivial (misleads readers about import source)

**Detail:**  
The comment reads:
```typescript
// Supabase client is now imported from lib/supabase-server.ts
```
The actual import at the top of the file is:
```typescript
import { getSupabaseServerClient } from '@/lib/supabase/server';
```

**Recommendation:** **FIX** the comment to:
```typescript
// Supabase client imported from lib/supabase/server.ts
```

---

### 3. `components/Footer.tsx:24-39` — Intentionally Commented Social Links

**Classification:** Intentional placeholder (not dead code)  
**Lines:** 24–39  
**Risk:** None

**Detail:**  
Social media link markup is commented out pending real URLs:
```tsx
{/* Social links — TODO: add real URLs
  <a href="https://twitter.com/...">Twitter</a>
  ...
*/}
```
This is a deliberate `TODO`, not forgotten dead code.

**Recommendation:** **KEEP** as-is. Uncomment and populate when social profiles are confirmed.

---

## Approval

| Action | File | Approved By | Date |
|--------|------|-------------|------|
| DELETE | `lib/supabase-server.ts` | _pending_ | _pending_ |
| FIX COMMENT | `app/api/waitlist/route.ts:31` | _pending_ | _pending_ |
| KEEP | `components/Footer.tsx:24-39` | _pending_ | _pending_ |
