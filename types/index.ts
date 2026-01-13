// Core Types for Dashboard Application

// Export all type modules
export * from './auth';
export * from './company';
export * from './contact';
export * from './apollo';

export type UserRole = 'admin' | 'editor' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Company {
  id: string;
  name: string;
  domain?: string;
  industry?: string;
  location?: string;
  employeeCount?: number;
  description?: string;
  source: DataSource;
  createdAt: Date;
  updatedAt: Date;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  companyId?: string;
  company?: Company;
  linkedin?: string;
  source: DataSource;
  createdAt: Date;
  updatedAt: Date;
}

export type DataSource = 'apify' | 'apollo' | 'manual' | 'import';

export type ScriptType = 'apify' | 'apollo';

export type ScriptStatus = 'idle' | 'running' | 'completed' | 'failed' | 'scheduled';

export interface Script {
  id: string;
  name: string;
  type: ScriptType;
  status: ScriptStatus;
  configuration: ApifyConfig | ApolloConfig;
  schedule?: ScheduleConfig;
  lastRun?: Date;
  nextRun?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApifyConfig {
  actorId: string;
  inputParameters: Record<string, unknown>;
  maxResults?: number;
}

export interface ApolloConfig {
  searchQuery?: string;
  industries?: string[];
  locations?: string[];
  companySizeRange?: {
    min?: number;
    max?: number;
  };
  jobTitles?: string[];
}

export interface ScheduleConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string; // HH:mm format
  daysOfWeek?: number[]; // 0-6, Sunday to Saturday
  dayOfMonth?: number; // 1-31
}

export interface ScriptRun {
  id: string;
  scriptId: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  recordsCollected: number;
  duplicatesRemoved: number;
  recordsSaved: number;
  errorMessage?: string;
  logs: string[];
}

export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'stopped';

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  template: EmailTemplate;
  status: CampaignStatus;
  settings: CampaignSettings;
  segment?: ContactSegment;
  stats: CampaignStats;
  createdAt: Date;
  updatedAt: Date;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  personalizationTags: string[];
}

export interface CampaignSettings {
  dailyLimit: number;
  schedule: {
    startDate: Date;
    time: string;
    timezone: string;
  };
  followUp?: {
    enabled: boolean;
    daysAfter: number;
    onlyIfNoResponse: boolean;
    template: EmailTemplate;
  };
  tracking: {
    opens: boolean;
    clicks: boolean;
  };
}

export interface ContactSegment {
  id: string;
  name: string;
  filters: SegmentFilter[];
  contactCount: number;
}

export interface SegmentFilter {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'in' | 'notIn';
  value: unknown;
}

export interface CampaignStats {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  replied: number;
}

export interface ContactActivity {
  id: string;
  contactId: string;
  campaignId: string;
  type: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed' | 'replied';
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface DashboardStats {
  totalCompanies: number;
  totalContacts: number;
  activeCampaigns: number;
  emailsSent30d: number;
  recentActivity: Activity[];
}

export interface Activity {
  id: string;
  type: 'data_collected' | 'campaign_started' | 'campaign_completed' | 'script_run' | 'data_imported';
  title: string;
  description: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalRecords: number;
  };
}

export interface FilterOptions {
  dateRange?: {
    start: Date;
    end: Date;
  };
  industries?: string[];
  locations?: string[];
  sources?: DataSource[];
  search?: string;
}
