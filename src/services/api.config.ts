// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  TIMEOUT: 30000,
  HEADERS: {
    'Content-Type': 'application/json',
  },
};

export const API_ENDPOINTS = {
  // Health
  HEALTH: '/health',

  // Use Cases
  USE_CASES: '/use-cases',
  USE_CASE_BY_ID: (id: string) => `/use-cases/${id}`,
  USE_CASES_BY_STATUS: (status: string) => `/use-cases?status=${status}`,
  USE_CASES_BY_CATEGORY: (category: string) => `/use-cases?category=${category}`,
  USE_CASES_BY_PRIORITY: (priority: string) => `/use-cases?priority=${priority}`,
  USE_CASES_STATS: '/use-cases/stats',
  USE_CASES_BULK_UPDATE: '/use-cases/bulk-update',
  USE_CASES_BULK_DELETE: '/use-cases/bulk-delete',
  USE_CASES_IMPORT: '/use-cases/import',
  USE_CASES_EXPORT: '/use-cases/export',
  USE_CASES_TEMPLATE: '/use-cases/template',
  
  // Users
  USERS: '/users',
  USER_BY_ID: (id: string) => `/users/${id}`,
  USERS_BY_ROLE: (role: string) => `/users?role=${role}`,
  USERS_BY_STATUS: (status: string) => `/users?status=${status}`,
  USER_PROFILE: '/users/me/profile',
  USERS_BULK_UPDATE: '/users/bulk-update',
  USERS_BULK_DELETE: '/users/bulk-delete',
  
  // Authentication
  AUTH_LOGIN: '/auth/login',
  AUTH_LOGOUT: '/auth/logout',
  AUTH_REFRESH: '/auth/refresh',
  AUTH_ME: '/auth/me',
  AUTH_WINDOWS_LOGIN: '/auth/windows-login',
  
  // Dashboard
  DASHBOARD_STATS: '/dashboard/stats',
  DASHBOARD_CHARTS: '/dashboard/charts',
  DASHBOARD_ACTIVITY: '/dashboard/stats/activity',
  DASHBOARD_INSIGHTS_ACCOUNTS: '/dashboard/insights/accounts',
  DASHBOARD_INSIGHTS_WORKLOAD: '/dashboard/insights/workload',
  DASHBOARD_INSIGHTS_RISKS: '/dashboard/insights/risks',
  DASHBOARD_INSIGHTS_RECENT: '/dashboard/insights/recent',
} as const;
