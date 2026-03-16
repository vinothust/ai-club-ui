import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { UseCase } from '@/types';
import { 
  dashboardService, 
  DashboardStats, 
  DashboardCharts,
  ActivityItem,
  AccountSummary,
  PodWorkload,
  RiskItem 
} from '@/services';
import { ApiResponse, ApiError } from '@/services/api.client';

// Query Keys
export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  charts: () => [...dashboardKeys.all, 'charts'] as const,
  activity: (limit?: number) => [...dashboardKeys.all, 'activity', limit] as const,
  timeRange: (startDate: string, endDate: string) => 
    [...dashboardKeys.all, 'timeRange', { startDate, endDate }] as const,
  insightsAccounts: () => [...dashboardKeys.all, 'insights', 'accounts'] as const,
  insightsWorkload: () => [...dashboardKeys.all, 'insights', 'workload'] as const,
  insightsRisks: () => [...dashboardKeys.all, 'insights', 'risks'] as const,
  insightsRecent: (limit?: number) => [...dashboardKeys.all, 'insights', 'recent', limit] as const,
};

// Hooks for dashboard data
export function useDashboardStats(
  options?: Omit<UseQueryOptions<ApiResponse<DashboardStats>, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: () => dashboardService.getDashboardStats(),
    ...options,
  });
}

export function useDashboardCharts(
  options?: Omit<UseQueryOptions<ApiResponse<DashboardCharts>, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: dashboardKeys.charts(),
    queryFn: () => dashboardService.getDashboardCharts(),
    ...options,
  });
}

export function useRecentActivity(
  limit = 10,
  options?: Omit<UseQueryOptions<ApiResponse<ActivityItem[]>, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: dashboardKeys.activity(limit),
    queryFn: () => dashboardService.getRecentActivity(limit),
    ...options,
  });
}

export function useDashboardTimeRange(
  startDate: string,
  endDate: string,
  options?: Omit<UseQueryOptions<ApiResponse<DashboardStats>, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: dashboardKeys.timeRange(startDate, endDate),
    queryFn: () => dashboardService.getStatsForTimeRange(startDate, endDate),
    enabled: !!startDate && !!endDate,
    ...options,
  });
}

// Manager Insights hooks
export function useAccountSummaries(
  options?: Omit<UseQueryOptions<ApiResponse<AccountSummary[]>, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: dashboardKeys.insightsAccounts(),
    queryFn: () => dashboardService.getAccountSummaries(),
    ...options,
  });
}

export function usePodWorkload(
  options?: Omit<UseQueryOptions<ApiResponse<PodWorkload[]>, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: dashboardKeys.insightsWorkload(),
    queryFn: () => dashboardService.getPodWorkload(),
    ...options,
  });
}

export function useRiskHeatmap(
  options?: Omit<UseQueryOptions<ApiResponse<RiskItem[]>, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: dashboardKeys.insightsRisks(),
    queryFn: () => dashboardService.getRiskHeatmap(),
    ...options,
  });
}

export function useRecentUseCases(
  limit = 20,
  options?: Omit<UseQueryOptions<ApiResponse<UseCase[]>, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: dashboardKeys.insightsRecent(limit),
    queryFn: () => dashboardService.getRecentUseCases(limit),
    ...options,
  });
}
