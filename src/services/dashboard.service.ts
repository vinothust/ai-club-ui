import { apiClient, ApiResponse } from './api.client';
import { API_ENDPOINTS } from './api.config';
import { UseCase, UseCaseStatus, UseCaseType } from '@/types';

export interface DashboardStats {
  totalUseCases: number;
  activeUseCases: number;
  completedUseCases: number;
  onHoldUseCases: number;
  cancelledUseCases: number;
  totalUsers: number;
  activeUsers: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'created' | 'updated' | 'completed' | 'deleted';
  entityType: 'useCase' | 'user';
  entityId: string;
  entityTitle: string;
  performedBy: string;
  timestamp: string;
}

export interface StatusChartData {
  name: UseCaseStatus;
  value: number;
}

export interface TypeChartData {
  name: UseCaseType;
  count: number;
}

export interface DashboardCharts {
  statusDistribution: StatusChartData[];
  typeDistribution: TypeChartData[];
  monthlyTrends: MonthlyTrendData[];
}

export interface MonthlyTrendData {
  month: string;
  created: number;
  completed: number;
}

// Manager Insights interfaces
export interface AccountSummary {
  account: string;
  total: number;
  active: number;
  completed: number;
  onHold: number;
  cancelled: number;
  overdue: number;
  avgAge: number;
  types: Record<string, number>;
}

export interface PodWorkload {
  name: string;
  totalCases: number;
  activeCases: number;
  accounts: string[];
  overdue: number;
}

export interface RiskItem {
  uc: UseCase;
  risks: string[];
  severity: 'high' | 'medium' | 'low';
}

class DashboardService {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return apiClient.get<DashboardStats>(API_ENDPOINTS.DASHBOARD_STATS);
  }

  /**
   * Get dashboard chart data
   */
  async getDashboardCharts(): Promise<ApiResponse<DashboardCharts>> {
    return apiClient.get<DashboardCharts>(API_ENDPOINTS.DASHBOARD_CHARTS);
  }

  /**
   * Get recent activity
   */
  async getRecentActivity(limit = 10): Promise<ApiResponse<ActivityItem[]>> {
    return apiClient.get<ActivityItem[]>(
      `${API_ENDPOINTS.DASHBOARD_ACTIVITY}?limit=${limit}`
    );
  }

  /**
   * Get statistics for a specific time range
   */
  async getStatsForTimeRange(
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<DashboardStats>> {
    return apiClient.get<DashboardStats>(
      `${API_ENDPOINTS.DASHBOARD_STATS}?startDate=${startDate}&endDate=${endDate}`
    );
  }

  /**
   * Check API health
   */
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return apiClient.get<{ status: string; timestamp: string }>(API_ENDPOINTS.HEALTH);
  }

  /**
   * Get account summaries for Manager Insights
   */
  async getAccountSummaries(): Promise<ApiResponse<AccountSummary[]>> {
    return apiClient.get<AccountSummary[]>(API_ENDPOINTS.DASHBOARD_INSIGHTS_ACCOUNTS);
  }

  /**
   * Get POD workload for Manager Insights
   */
  async getPodWorkload(): Promise<ApiResponse<PodWorkload[]>> {
    return apiClient.get<PodWorkload[]>(API_ENDPOINTS.DASHBOARD_INSIGHTS_WORKLOAD);
  }

  /**
   * Get risk heatmap items for Manager Insights
   */
  async getRiskHeatmap(): Promise<ApiResponse<RiskItem[]>> {
    return apiClient.get<RiskItem[]>(API_ENDPOINTS.DASHBOARD_INSIGHTS_RISKS);
  }

  /**
   * Get recent use cases for Manager Insights
   */
  async getRecentUseCases(limit = 20): Promise<ApiResponse<UseCase[]>> {
    return apiClient.get<UseCase[]>(
      `${API_ENDPOINTS.DASHBOARD_INSIGHTS_RECENT}?limit=${limit}`
    );
  }
}

export const dashboardService = new DashboardService();
