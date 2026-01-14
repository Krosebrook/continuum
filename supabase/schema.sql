-- ============================================================================
-- CONTINUUM DATABASE SCHEMA
-- Version: 1.0
-- Date: 2025-01-10
-- Description: Complete production schema for Continuum MVP
--
-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Click "New Query"
-- 3. Copy-paste this entire file
-- 4. Click "Run"
-- ============================================================================

-- Enable UUID extension (if not already enabled)
create extension if not exists "uuid-ossp";

-- ============================================================================
-- TABLE 1: waitlist (landing page signups) - REQUIRED FOR LANDING PAGE
-- ============================================================================
create table if not exists waitlist (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  name text,
  company text,
  source text default 'landing_page', -- 'landing_page', 'referral', 'product_hunt'
  status text check (status in ('pending', 'invited', 'converted')) default 'pending',
  created_at timestamptz default now(),
  invited_at timestamptz,
  converted_at timestamptz
);

-- Indexes for common queries
create index if not exists idx_waitlist_email on waitlist(email);
create index if not exists idx_waitlist_status on waitlist(status);
create index if not exists idx_waitlist_created on waitlist(created_at desc);

-- Row Level Security for waitlist
alter table waitlist enable row level security;

-- Allow anyone (anon users) to insert into waitlist
create policy "public_can_insert" on waitlist
  for insert
  to anon, authenticated
  with check (true);

-- Deny anonymous reads (prevent email scraping)
create policy "no_anon_select" on waitlist
  for select
  to anon
  using (false);

-- Allow authenticated users to read
create policy "authenticated_can_select" on waitlist
  for select
  to authenticated
  using (true);

-- Allow authenticated users to update
create policy "authenticated_can_update" on waitlist
  for update
  to authenticated
  using (true)
  with check (true);

-- Allow authenticated users to delete
create policy "authenticated_can_delete" on waitlist
  for delete
  to authenticated
  using (true);

-- ============================================================================
-- TABLE 2: organizations (multi-tenant isolation root) - FOR FUTURE MVP
-- ============================================================================
create table if not exists organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  plan text check (plan in ('solo', 'team', 'enterprise')) default 'solo',
  stripe_customer_id text unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS: Users can only see their own organization
alter table organizations enable row level security;

-- Split policies for better security and functionality
create policy "org_select" on organizations
  for select
  using (id = (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid);

create policy "org_insert" on organizations
  for insert
  with check (true);

create policy "org_update" on organizations
  for update
  using (id = (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid)
  with check (id = (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid);

create policy "org_delete" on organizations
  for delete
  using (id = (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid);

-- Index for faster lookups
create index if not exists idx_organizations_stripe on organizations(stripe_customer_id);

-- ============================================================================
-- TABLE 3: users (authentication + RBAC) - FOR FUTURE MVP
-- ============================================================================
create table if not exists users (
  id uuid primary key references auth.users on delete cascade,
  org_id uuid references organizations on delete cascade not null,
  email text not null unique,
  full_name text,
  role text check (role in ('owner', 'admin', 'member', 'viewer')) default 'owner',
  created_at timestamptz default now(),
  last_sign_in_at timestamptz
);

-- RLS: Users can only see users in their org
alter table users enable row level security;

-- Split policies for better security and functionality
create policy "user_select" on users
  for select
  using (org_id = (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid);

create policy "user_insert" on users
  for insert
  with check (org_id = (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid);

create policy "user_update" on users
  for update
  using (org_id = (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid)
  with check (org_id = (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid);

create policy "user_delete" on users
  for delete
  using (org_id = (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid);

-- Indexes
create index if not exists idx_users_org on users(org_id);
create index if not exists idx_users_email on users(email);

-- ============================================================================
-- TABLE 4: icps (ideal customer profiles) - FOR FUTURE MVP
-- ============================================================================
create table if not exists icps (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organizations on delete cascade not null,
  name text not null,

  -- Targeting criteria
  industry text[],
  company_size text[], -- e.g., ['11-50', '51-200']
  revenue_range text[], -- e.g., ['$2M-$10M', '$10M-$50M']
  location text[], -- e.g., ['United States', 'Canada']
  keywords text[], -- e.g., ['EHR', 'patient data', 'HIPAA']

  -- Metadata
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS: Users can only see ICPs in their org
alter table icps enable row level security;

-- Split policies for better security and functionality
create policy "icp_select" on icps
  for select
  using (org_id = (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid);

create policy "icp_insert" on icps
  for insert
  with check (org_id = (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid);

create policy "icp_update" on icps
  for update
  using (org_id = (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid)
  with check (org_id = (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid);

create policy "icp_delete" on icps
  for delete
  using (org_id = (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid);

-- Indexes
create index if not exists idx_icps_org_active on icps(org_id, is_active);

-- ============================================================================
-- TABLE 5: opportunities (discovered prospects) - FOR FUTURE MVP
-- ============================================================================
create table if not exists opportunities (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organizations on delete cascade not null,
  icp_id uuid references icps on delete cascade not null,

  -- Core data (from scout agent)
  company_name text not null,
  domain text, -- example.com
  description text,
  source_url text, -- where we found it

  -- Enriched data (from APIs)
  industry text,
  employee_count int,
  revenue_estimate text, -- e.g., "$5M-$10M"
  location text,
  funding_stage text, -- e.g., "Series A", "Bootstrapped"
  tech_stack text[], -- e.g., ['React', 'Node.js', 'PostgreSQL']

  -- Qualification
  fit_score int check (fit_score >= 0 and fit_score <= 100),
  fit_reasoning text, -- AI-generated explanation

  -- Status
  status text check (status in ('new', 'reviewed', 'contacted', 'qualified', 'disqualified')) default 'new',

  -- Metadata
  discovered_at timestamptz default now(),
  enriched_at timestamptz,
  reviewed_at timestamptz
);

-- RLS: Users can only see opportunities in their org
alter table opportunities enable row level security;

-- Split policies for better security and functionality
create policy "opportunity_select" on opportunities
  for select
  using (org_id = (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid);

create policy "opportunity_insert" on opportunities
  for insert
  with check (org_id = (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid);

create policy "opportunity_update" on opportunities
  for update
  using (org_id = (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid)
  with check (org_id = (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid);

create policy "opportunity_delete" on opportunities
  for delete
  using (org_id = (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid);

-- Indexes for common queries
create index if not exists idx_opps_org_icp on opportunities(org_id, icp_id);
create index if not exists idx_opps_fit_score on opportunities(fit_score desc nulls last);
create index if not exists idx_opps_status on opportunities(status);
create index if not exists idx_opps_discovered on opportunities(discovered_at desc);
create index if not exists idx_opps_domain on opportunities(domain); -- for deduplication

-- ============================================================================
-- TABLE 6: opportunity_enrichment (API response storage) - FOR FUTURE MVP
-- ============================================================================
create table if not exists opportunity_enrichment (
  id uuid primary key default uuid_generate_v4(),
  opportunity_id uuid references opportunities on delete cascade not null,
  provider text not null, -- 'apollo', 'clearbit', 'custom'
  data jsonb not null, -- raw API response
  enriched_at timestamptz default now()
);

-- Index for fast lookups
create index if not exists idx_enrichment_opp on opportunity_enrichment(opportunity_id);
create index if not exists idx_enrichment_provider on opportunity_enrichment(provider);

-- ============================================================================
-- TABLE 7: opportunity_contacts (people at the company) - FOR FUTURE MVP
-- ============================================================================
create table if not exists opportunity_contacts (
  id uuid primary key default uuid_generate_v4(),
  opportunity_id uuid references opportunities on delete cascade not null,
  full_name text not null,
  title text,
  email text,
  linkedin_url text,
  phone text,
  is_primary boolean default false,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_contacts_opp on opportunity_contacts(opportunity_id);
create index if not exists idx_contacts_email on opportunity_contacts(email);

-- ============================================================================
-- TABLE 8: search_runs (audit trail of discovery jobs) - FOR FUTURE MVP
-- ============================================================================
create table if not exists search_runs (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organizations on delete cascade not null,
  icp_id uuid references icps on delete cascade not null,
  status text check (status in ('running', 'completed', 'failed')) not null default 'running',
  opportunities_found int default 0,
  error_message text,
  started_at timestamptz default now(),
  completed_at timestamptz
);

-- RLS: Users can only see search runs in their org
alter table search_runs enable row level security;

-- Split policies for better security and functionality
create policy "search_run_select" on search_runs
  for select
  using (org_id = (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid);

create policy "search_run_insert" on search_runs
  for insert
  with check (org_id = (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid);

create policy "search_run_update" on search_runs
  for update
  using (org_id = (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid)
  with check (org_id = (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid);

create policy "search_run_delete" on search_runs
  for delete
  using (org_id = (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid);

-- Indexes
create index if not exists idx_runs_org_started on search_runs(org_id, started_at desc);
create index if not exists idx_runs_status on search_runs(status);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply trigger to organizations (drop first if exists)
drop trigger if exists update_organizations_updated_at on organizations;
create trigger update_organizations_updated_at
  before update on organizations
  for each row
  execute function update_updated_at_column();

-- Apply trigger to icps
drop trigger if exists update_icps_updated_at on icps;
create trigger update_icps_updated_at
  before update on icps
  for each row
  execute function update_updated_at_column();

-- ============================================================================
-- PERMISSIONS (Grant access to authenticated users)
-- ============================================================================

-- Grant usage on schema
grant usage on schema public to anon;
grant usage on schema public to authenticated;

-- Grant access to waitlist table (for landing page - anon access needed)
grant select, insert on waitlist to anon;
grant select, insert, update, delete on waitlist to authenticated;

-- Grant specific access to other tables (authenticated only)
-- Organizations table
grant select, insert, update, delete on organizations to authenticated;

-- Users table
grant select, insert, update, delete on users to authenticated;

-- ICPs table
grant select, insert, update, delete on icps to authenticated;

-- Opportunities table
grant select, insert, update, delete on opportunities to authenticated;

-- Opportunity enrichment table
grant select, insert, update, delete on opportunity_enrichment to authenticated;

-- Opportunity contacts table
grant select, insert, update, delete on opportunity_contacts to authenticated;

-- Search runs table
grant select, insert, update, delete on search_runs to authenticated;

-- Grant access to sequences
grant usage, select on all sequences in schema public to authenticated;

-- ============================================================================
-- COMPLETE ✅
-- ============================================================================
--
-- After running this SQL:
-- 1. Your waitlist table is ready for the landing page
-- 2. All future MVP tables are pre-created
-- 3. RLS policies are in place for multi-tenant security
-- 4. Indexes are created for performance
--
-- Next steps:
-- 1. Copy your Supabase URL and anon key to .env.local
-- 2. Run `npm install` in the project directory
-- 3. Run `npm run dev` to start the development server
-- 4. Test the waitlist form at http://localhost:3000
-- ============================================================================
