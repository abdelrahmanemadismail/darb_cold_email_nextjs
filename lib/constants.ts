// Application Constants

export const APP_NAME = 'Cold Email Dashboard';
export const APP_VERSION = '1.0.0';

// Navigation
export const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: 'LayoutDashboard',
  },
  {
    label: 'Data',
    href: '/dashboard/data',
    icon: 'Database',
  },
  {
    label: 'Scripts',
    href: '/dashboard/scripts',
    icon: 'Code',
  },
  {
    label: 'Apollo Results',
    href: '/dashboard/apollo-results',
    icon: 'Database',
  },
  {
    label: 'Campaigns',
    href: '/dashboard/campaigns',
    icon: 'Mail',
  },
  {
    label: 'Analytics',
    href: '/dashboard/analytics',
    icon: 'BarChart',
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: 'Settings',
  },
] as const;

// Data Sources
export const DATA_SOURCES = ['apify', 'apollo', 'manual', 'import'] as const;

// Script Types
export const SCRIPT_TYPES = ['apify', 'apollo'] as const;

// Script Status
export const SCRIPT_STATUS = {
  IDLE: 'idle',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  SCHEDULED: 'scheduled',
} as const;

// Campaign Status
export const CAMPAIGN_STATUS = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  STOPPED: 'stopped',
} as const;

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
} as const;

// Permissions
export const PERMISSIONS = {
  VIEW_DATA: ['admin', 'editor', 'viewer'],
  EDIT_DATA: ['admin', 'editor'],
  DELETE_DATA: ['admin', 'editor'],
  RUN_SCRIPTS: ['admin', 'editor'],
  CREATE_CAMPAIGNS: ['admin', 'editor'],
  VIEW_ANALYTICS: ['admin', 'editor', 'viewer'],
  MANAGE_USERS: ['admin'],
  SYSTEM_SETTINGS: ['admin'],
  EXPORT_DATA: ['admin', 'editor', 'viewer'],
} as const;

// Schedule Frequencies
export const SCHEDULE_FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
] as const;

// Days of Week
export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
] as const;

// Export Formats
export const EXPORT_FORMATS = [
  { value: 'csv', label: 'CSV', extension: '.csv' },
  { value: 'xlsx', label: 'Excel (XLSX)', extension: '.xlsx' },
] as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 25;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

// Date Formats
export const DATE_FORMAT = 'MMM dd, yyyy';
export const DATE_TIME_FORMAT = 'MMM dd, yyyy HH:mm';
export const TIME_FORMAT = 'HH:mm';

// Chart Colors
export const CHART_COLORS = {
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
} as const;

// API Endpoints (relative to base URL)
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
  },
  COMPANIES: {
    LIST: '/api/companies',
    CREATE: '/api/companies',
    UPDATE: (id: string) => `/api/companies/${id}`,
    DELETE: (id: string) => `/api/companies/${id}`,
    EXPORT: '/api/companies/export',
    IMPORT: '/api/companies/import',
  },
  CONTACTS: {
    LIST: '/api/contacts',
    CREATE: '/api/contacts',
    UPDATE: (id: string) => `/api/contacts/${id}`,
    DELETE: (id: string) => `/api/contacts/${id}`,
    EXPORT: '/api/contacts/export',
    IMPORT: '/api/contacts/import',
  },
  SCRIPTS: {
    LIST: '/api/scripts',
    CREATE: '/api/scripts',
    UPDATE: (id: string) => `/api/scripts/${id}`,
    DELETE: (id: string) => `/api/scripts/${id}`,
    START: (id: string) => `/api/scripts/${id}/start`,
    STOP: (id: string) => `/api/scripts/${id}/stop`,
    LOGS: (id: string) => `/api/scripts/${id}/logs`,
    RUNS: (id: string) => `/api/scripts/${id}/runs`,
  },
  CAMPAIGNS: {
    LIST: '/api/campaigns',
    CREATE: '/api/campaigns',
    UPDATE: (id: string) => `/api/campaigns/${id}`,
    DELETE: (id: string) => `/api/campaigns/${id}`,
    LAUNCH: (id: string) => `/api/campaigns/${id}/launch`,
    PAUSE: (id: string) => `/api/campaigns/${id}/pause`,
    RESUME: (id: string) => `/api/campaigns/${id}/resume`,
    STOP: (id: string) => `/api/campaigns/${id}/stop`,
    STATS: (id: string) => `/api/campaigns/${id}/stats`,
  },
  ANALYTICS: {
    DASHBOARD: '/api/analytics/dashboard',
    DATA_COLLECTION: '/api/analytics/data-collection',
    CAMPAIGNS: '/api/analytics/campaigns',
    CONTACTS: '/api/analytics/contacts',
  },
} as const;

// Toast Messages
export const TOAST_MESSAGES = {
  SUCCESS: {
    SAVE: 'Changes saved successfully',
    DELETE: 'Deleted successfully',
    CREATE: 'Created successfully',
    IMPORT: 'Import completed successfully',
    EXPORT: 'Export completed successfully',
  },
  ERROR: {
    GENERIC: 'Something went wrong. Please try again.',
    NETWORK: 'Network error. Please check your connection.',
    UNAUTHORIZED: 'You are not authorized to perform this action.',
    NOT_FOUND: 'Resource not found.',
  },
} as const;
