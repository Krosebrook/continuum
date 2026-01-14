// Database types matching Supabase schema

export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';
export type OrgPlan = 'solo' | 'team' | 'enterprise';
export type WaitlistStatus = 'pending' | 'invited' | 'converted';
export type OpportunityStatus = 'new' | 'reviewed' | 'contacted' | 'qualified' | 'disqualified';
export type SearchRunStatus = 'running' | 'completed' | 'failed';

export interface Organization {
  id: string;
  name: string;
  plan: OrgPlan;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  org_id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  last_sign_in_at: string | null;
}

export interface WaitlistEntry {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  source: string;
  status: WaitlistStatus;
  created_at: string;
  invited_at: string | null;
  converted_at: string | null;
}

export interface ICP {
  id: string;
  org_id: string;
  name: string;
  industry: string[] | null;
  company_size: string[] | null;
  revenue_range: string[] | null;
  location: string[] | null;
  keywords: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Opportunity {
  id: string;
  org_id: string;
  icp_id: string;
  company_name: string;
  domain: string | null;
  description: string | null;
  source_url: string | null;
  industry: string | null;
  employee_count: number | null;
  revenue_estimate: string | null;
  location: string | null;
  funding_stage: string | null;
  tech_stack: string[] | null;
  fit_score: number | null;
  fit_reasoning: string | null;
  status: OpportunityStatus;
  discovered_at: string;
  enriched_at: string | null;
  reviewed_at: string | null;
}

export interface OpportunityEnrichment {
  id: string;
  opportunity_id: string;
  provider: string;
  data: Record<string, unknown>;
  enriched_at: string;
}

export interface OpportunityContact {
  id: string;
  opportunity_id: string;
  full_name: string;
  title: string | null;
  email: string | null;
  linkedin_url: string | null;
  phone: string | null;
  is_primary: boolean;
  created_at: string;
}

export interface SearchRun {
  id: string;
  org_id: string;
  icp_id: string;
  status: SearchRunStatus;
  opportunities_found: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

// Database schema type for Supabase client
export interface Database {
  public: {
    Tables: {
      waitlist: {
        Row: WaitlistEntry;
        Insert: Omit<WaitlistEntry, 'id' | 'created_at' | 'invited_at' | 'converted_at'>;
        Update: Partial<Omit<WaitlistEntry, 'id'>>;
      };
      organizations: {
        Row: Organization;
        Insert: Omit<Organization, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Organization, 'id'>>;
      };
      users: {
        Row: User;
        Insert: Omit<User, 'created_at' | 'last_sign_in_at'>;
        Update: Partial<Omit<User, 'id'>>;
      };
      icps: {
        Row: ICP;
        Insert: Omit<ICP, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ICP, 'id'>>;
      };
      opportunities: {
        Row: Opportunity;
        Insert: Omit<Opportunity, 'id' | 'discovered_at'>;
        Update: Partial<Omit<Opportunity, 'id'>>;
      };
      opportunity_enrichment: {
        Row: OpportunityEnrichment;
        Insert: Omit<OpportunityEnrichment, 'id' | 'enriched_at'>;
        Update: Partial<Omit<OpportunityEnrichment, 'id'>>;
      };
      opportunity_contacts: {
        Row: OpportunityContact;
        Insert: Omit<OpportunityContact, 'id' | 'created_at'>;
        Update: Partial<Omit<OpportunityContact, 'id'>>;
      };
      search_runs: {
        Row: SearchRun;
        Insert: Omit<SearchRun, 'id' | 'started_at'>;
        Update: Partial<Omit<SearchRun, 'id'>>;
      };
    };
  };
}
