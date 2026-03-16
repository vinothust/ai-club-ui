import { UseCase, UseCaseStatus, UseCaseType } from '@/types';
import { apiClient, ApiResponse } from './api.client';
import { API_ENDPOINTS } from './api.config';

export interface UseCaseFilters {
  status?: UseCaseStatus;
  useCaseType?: UseCaseType;
  account?: string;
  aiTechLead?: string;
  useCaseOwner?: string;
  search?: string;
}

export interface UseCaseStats {
  total: number;
  byStatus: Record<UseCaseStatus, number>;
  byType: Record<UseCaseType, number>;
  recentlyCreated: number;
}

export type CreateUseCaseDto = Omit<UseCase, 'id'>;

export type UpdateUseCaseDto = Partial<CreateUseCaseDto>;

class UseCasesService {
  /**
   * Get all use cases with optional filters
   */
  async getUseCases(filters?: UseCaseFilters): Promise<ApiResponse<UseCase[]>> {
    const queryParams = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
    }

    const endpoint = queryParams.toString()
      ? `${API_ENDPOINTS.USE_CASES}?${queryParams.toString()}`
      : API_ENDPOINTS.USE_CASES;

    return apiClient.get<UseCase[]>(endpoint);
  }

  /**
   * Get a single use case by ID
   */
  async getUseCaseById(id: string): Promise<ApiResponse<UseCase>> {
    return apiClient.get<UseCase>(API_ENDPOINTS.USE_CASE_BY_ID(id));
  }

  /**
   * Create a new use case
   */
  async createUseCase(data: CreateUseCaseDto): Promise<ApiResponse<UseCase>> {
    return apiClient.post<UseCase>(API_ENDPOINTS.USE_CASES, data);
  }

  /**
   * Update an existing use case (full replace)
   */
  async updateUseCase(id: string, data: UpdateUseCaseDto): Promise<ApiResponse<UseCase>> {
    return apiClient.put<UseCase>(API_ENDPOINTS.USE_CASE_BY_ID(id), data);
  }

  /**
   * Partially update a use case
   */
  async patchUseCase(id: string, data: Partial<UpdateUseCaseDto>): Promise<ApiResponse<UseCase>> {
    return apiClient.patch<UseCase>(API_ENDPOINTS.USE_CASE_BY_ID(id), data);
  }

  /**
   * Delete a use case
   */
  async deleteUseCase(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(API_ENDPOINTS.USE_CASE_BY_ID(id));
  }

  /**
   * Get use cases by status
   */
  async getUseCasesByStatus(status: UseCaseStatus): Promise<ApiResponse<UseCase[]>> {
    return apiClient.get<UseCase[]>(API_ENDPOINTS.USE_CASES_BY_STATUS(status));
  }

  /**
   * Get use cases by type
   */
  async getUseCasesByType(type: UseCaseType): Promise<ApiResponse<UseCase[]>> {
    return apiClient.get<UseCase[]>(`${API_ENDPOINTS.USE_CASES}?useCaseType=${type}`);
  }

  /**
   * Get use case statistics
   */
  async getUseCaseStats(): Promise<ApiResponse<UseCaseStats>> {
    return apiClient.get<UseCaseStats>(API_ENDPOINTS.USE_CASES_STATS);
  }

  /**
   * Bulk update use cases
   */
  async bulkUpdateUseCases(
    ids: string[],
    data: Partial<UpdateUseCaseDto>
  ): Promise<ApiResponse<UseCase[]>> {
    return apiClient.post<UseCase[]>(API_ENDPOINTS.USE_CASES_BULK_UPDATE, {
      ids,
      data,
    });
  }

  /**
   * Bulk delete use cases
   */
  async bulkDeleteUseCases(ids: string[]): Promise<ApiResponse<void>> {
    return apiClient.post<void>(API_ENDPOINTS.USE_CASES_BULK_DELETE, { ids });
  }

  /**
   * Import use cases from a file (Excel/CSV)
   */
  async importUseCases(file: File): Promise<ApiResponse<UseCase[]>> {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<UseCase[]>(API_ENDPOINTS.USE_CASES_IMPORT, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  /**
   * Export use cases (returns file blob)
   */
  async exportUseCases(format: 'xlsx' | 'csv' = 'xlsx'): Promise<Blob> {
    const response = await apiClient.getAxiosInstance().get(
      `${API_ENDPOINTS.USE_CASES_EXPORT}?format=${format}`,
      { responseType: 'blob' }
    );
    return response.data;
  }

  /**
   * Download use case import template
   */
  async downloadTemplate(): Promise<Blob> {
    const response = await apiClient.getAxiosInstance().get(
      API_ENDPOINTS.USE_CASES_TEMPLATE,
      { responseType: 'blob' }
    );
    return response.data;
  }
}

export const useCasesService = new UseCasesService();
