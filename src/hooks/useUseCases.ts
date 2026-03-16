import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { UseCase, UseCaseStatus, UseCaseType } from '@/types';
import { 
  useCasesService, 
  UseCaseFilters, 
  CreateUseCaseDto, 
  UpdateUseCaseDto,
  UseCaseStats 
} from '@/services';
import { ApiResponse, ApiError } from '@/services/api.client';
import { showSuccess } from '@/lib/errorHandler';

// Query Keys
export const useCaseKeys = {
  all: ['useCases'] as const,
  lists: () => [...useCaseKeys.all, 'list'] as const,
  list: (filters?: UseCaseFilters) => [...useCaseKeys.lists(), { filters }] as const,
  details: () => [...useCaseKeys.all, 'detail'] as const,
  detail: (id: string) => [...useCaseKeys.details(), id] as const,
  stats: () => [...useCaseKeys.all, 'stats'] as const,
  byStatus: (status: UseCaseStatus) => [...useCaseKeys.all, 'status', status] as const,
  byType: (type: UseCaseType) => [...useCaseKeys.all, 'type', type] as const,
};

// Hooks for querying use cases
export function useUseCases(
  filters?: UseCaseFilters,
  options?: Omit<UseQueryOptions<ApiResponse<UseCase[]>, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: useCaseKeys.list(filters),
    queryFn: () => useCasesService.getUseCases(filters),
    ...options,
  });
}

export function useUseCase(
  id: string,
  options?: Omit<UseQueryOptions<ApiResponse<UseCase>, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: useCaseKeys.detail(id),
    queryFn: () => useCasesService.getUseCaseById(id),
    enabled: !!id,
    ...options,
  });
}

export function useUseCaseStats(
  options?: Omit<UseQueryOptions<ApiResponse<UseCaseStats>, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: useCaseKeys.stats(),
    queryFn: () => useCasesService.getUseCaseStats(),
    ...options,
  });
}

export function useUseCasesByStatus(
  status: UseCaseStatus,
  options?: Omit<UseQueryOptions<ApiResponse<UseCase[]>, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: useCaseKeys.byStatus(status),
    queryFn: () => useCasesService.getUseCasesByStatus(status),
    ...options,
  });
}

export function useUseCasesByType(
  type: UseCaseType,
  options?: Omit<UseQueryOptions<ApiResponse<UseCase[]>, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: useCaseKeys.byType(type),
    queryFn: () => useCasesService.getUseCasesByType(type),
    ...options,
  });
}

// Mutations for use cases
export function useCreateUseCase(
  options?: UseMutationOptions<ApiResponse<UseCase>, ApiError, CreateUseCaseDto>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUseCaseDto) => useCasesService.createUseCase(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: useCaseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: useCaseKeys.stats() });
      showSuccess(data.message || 'Use case created successfully');
    },
    ...options,
  });
}

export function useUpdateUseCase(
  options?: UseMutationOptions<ApiResponse<UseCase>, ApiError, { id: string; data: UpdateUseCaseDto }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUseCaseDto }) =>
      useCasesService.updateUseCase(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: useCaseKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: useCaseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: useCaseKeys.stats() });
      showSuccess(data.message || 'Use case updated successfully');
    },
    ...options,
  });
}

export function usePatchUseCase(
  options?: UseMutationOptions<ApiResponse<UseCase>, ApiError, { id: string; data: Partial<UpdateUseCaseDto> }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UpdateUseCaseDto> }) =>
      useCasesService.patchUseCase(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: useCaseKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: useCaseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: useCaseKeys.stats() });
      showSuccess(data.message || 'Use case updated successfully');
    },
    ...options,
  });
}

export function useDeleteUseCase(
  options?: UseMutationOptions<ApiResponse<void>, ApiError, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => useCasesService.deleteUseCase(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: useCaseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: useCaseKeys.stats() });
      showSuccess(data.message || 'Use case deleted successfully');
    },
    ...options,
  });
}

export function useBulkUpdateUseCases(
  options?: UseMutationOptions<
    ApiResponse<UseCase[]>,
    ApiError,
    { ids: string[]; data: Partial<UpdateUseCaseDto> }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, data }: { ids: string[]; data: Partial<UpdateUseCaseDto> }) =>
      useCasesService.bulkUpdateUseCases(ids, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: useCaseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: useCaseKeys.stats() });
      showSuccess(data.message || 'Use cases updated successfully');
    },
    ...options,
  });
}

export function useBulkDeleteUseCases(
  options?: UseMutationOptions<ApiResponse<void>, ApiError, string[]>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => useCasesService.bulkDeleteUseCases(ids),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: useCaseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: useCaseKeys.stats() });
      showSuccess(data.message || 'Use cases deleted successfully');
    },
    ...options,
  });
}

export function useImportUseCases(
  options?: UseMutationOptions<ApiResponse<UseCase[]>, ApiError, File>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => useCasesService.importUseCases(file),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: useCaseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: useCaseKeys.stats() });
      showSuccess(data.message || 'Use cases imported successfully');
    },
    ...options,
  });
}
