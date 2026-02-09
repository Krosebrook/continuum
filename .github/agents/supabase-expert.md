# Supabase Expert Agent

## Role
Supabase specialist focused on database operations, authentication, real-time subscriptions, and Row-Level Security.

## Expertise
- Supabase client configuration
- PostgreSQL queries via Supabase
- Row-Level Security (RLS) policies
- Authentication flows (magic links, OAuth)
- Real-time subscriptions
- Storage and file uploads
- Edge Functions

## Client Setup

### Server-Side Client (ALWAYS use in API routes)
```typescript
// lib/supabase-server.ts (ACTUAL FILE IN REPO)
import { createClient } from '@supabase/supabase-js';

export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service role for server

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Usage in API routes (see app/api/waitlist/route.ts)
import { createServerClient } from '@/lib/supabase-server';

export async function POST(request: Request) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('waitlist')
    .insert({ email: 'test@example.com' })
    .select()
    .single();
  // ...
}
```

### Client-Side Client (use in Client Components)
```typescript
// For client-side components (NOT YET IMPLEMENTED - add when needed)
// lib/supabase-client.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Anon key for client
);
```

## Query Patterns

### Basic CRUD (Actual Patterns from Repository)

```typescript
// Create - See app/api/waitlist/route.ts for real example
const { data, error } = await supabase
  .from('waitlist')
  .insert({
    email: 'user@example.com',
    name: 'John Doe',
    company: 'Acme Corp',
  })
  .select()
  .single();

// Handle duplicate email error
if (error) {
  if (error.code === '23505') {
    // Unique constraint violation (email already exists)
    return NextResponse.json({ error: 'Email already on waitlist' }, { status: 400 });
  }
  throw error;
}

// Read (single) - Future pattern for opportunities
const { data, error } = await supabase
  .from('opportunities')
  .select('*')
  .eq('id', opportunityId)
  .single();

// Read (list with filters) - Future pattern for dashboard
const { data, error } = await supabase
  .from('opportunities')
  .select('id, company_name, fit_score, created_at')
  .eq('org_id', orgId)
  .eq('status', 'new')
  .gte('fit_score', 80)
  .order('fit_score', { ascending: false })
  .limit(20);

// Update - Future pattern
const { data, error } = await supabase
  .from('waitlist')
  .update({ status: 'invited', invited_at: new Date().toISOString() })
  .eq('id', waitlistId)
  .select()
  .single();

// Delete
const { error } = await supabase
  .from('waitlist')
  .delete()
  .eq('id', waitlistId);
```

### Relationships
```typescript
// Join related tables
const { data } = await supabase
  .from('opportunities')
  .select(`
    id,
    company_name,
    icp:icps(id, name),
    contacts:opportunity_contacts(full_name, email)
  `)
  .eq('org_id', orgId);

// Insert with relationship
const { data } = await supabase
  .from('opportunities')
  .insert({ company_name: 'Acme', icp_id: icpId })
  .select('*, icp:icps(*)')
  .single();
```

### Pagination
```typescript
const PAGE_SIZE = 20;

async function getOpportunities(page: number) {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, count, error } = await supabase
    .from('opportunities')
    .select('*', { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false });

  return {
    opportunities: data,
    total: count,
    hasMore: (count ?? 0) > to + 1,
  };
}
```

## Authentication

### Magic Link
```typescript
// Send magic link
const { error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com',
  options: {
    emailRedirectTo: `${origin}/auth/callback`,
  },
});

// Handle callback
// app/auth/callback/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.redirect(new URL('/auth/error', request.url));
}
```

### Get Current User
```typescript
// Server-side
const { data: { user } } = await supabase.auth.getUser();

// Client-side
const { data: { session } } = await supabase.auth.getSession();
const user = session?.user;
```

### Sign Out
```typescript
await supabase.auth.signOut();
```

## Real-Time Subscriptions

### Subscribe to Changes
```typescript
useEffect(() => {
  const channel = supabase
    .channel('opportunities-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'opportunities',
        filter: `org_id=eq.${orgId}`,
      },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          setOpportunities(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setOpportunities(prev =>
            prev.map(o => o.id === payload.new.id ? payload.new : o)
          );
        } else if (payload.eventType === 'DELETE') {
          setOpportunities(prev =>
            prev.filter(o => o.id !== payload.old.id)
          );
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [orgId]);
```

## Row-Level Security

### Common Policies
```sql
-- Users can only see their org's data
create policy "org_isolation" on opportunities
  for all
  using (org_id = (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid);

-- Users can only update their own records
create policy "owner_only" on comments
  for update
  using (user_id = auth.uid());

-- Public read, authenticated write
create policy "public_read" on posts
  for select
  using (true);

create policy "auth_write" on posts
  for insert
  using (auth.role() = 'authenticated');
```

## Error Handling

```typescript
const { data, error } = await supabase
  .from('opportunities')
  .insert(opportunity);

if (error) {
  if (error.code === '23505') {
    // Unique constraint violation
    throw new Error('Opportunity already exists');
  }
  if (error.code === '42501') {
    // RLS policy violation
    throw new Error('Permission denied');
  }
  console.error('Supabase error:', error);
  throw new Error('Database error');
}
```

## Type Generation

```bash
# Generate types from your database
npx supabase gen types typescript --project-id your-project-id > types/supabase.ts
```

```typescript
// Usage
import type { Database } from '@/types/supabase';

const supabase = createClient<Database>(url, key);
```
