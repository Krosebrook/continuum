// Re-export all types
export * from './database';

// Auth types
export interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
  org_id?: string;
  role?: string;
}

export interface AuthSession {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Form types
export interface ICPFormData {
  name: string;
  industry: string[];
  company_size: string[];
  revenue_range: string[];
  location: string[];
  keywords: string[];
}

// Dashboard types
export interface DashboardStats {
  totalOpportunities: number;
  newOpportunities: number;
  contactedOpportunities: number;
  qualifiedOpportunities: number;
  avgFitScore: number;
  activeICPs: number;
}

export interface OpportunityFilters {
  status?: string[];
  icpId?: string;
  minScore?: number;
  maxScore?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Notification types
export interface NotificationPreferences {
  emailDigest: 'daily' | 'weekly' | 'never';
  newOpportunityAlert: boolean;
  highScoreThreshold: number;
  icpFilters: string[];
}

// Analytics types
export interface AnalyticsMetric {
  label: string;
  value: number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface PipelineStage {
  name: string;
  count: number;
  percentage: number;
}
