import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { AppUser, Role, UserStatus } from '@/types';
import { 
  usersService, 
  UserFilters, 
  CreateUserDto, 
  UpdateUserDto,
  UpdateProfileDto 
} from '@/services';
import { ApiResponse, ApiError } from '@/services/api.client';
import { showSuccess } from '@/lib/errorHandler';

// Query Keys
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters?: UserFilters) => [...userKeys.lists(), { filters }] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  byRole: (role: Role) => [...userKeys.all, 'role', role] as const,
  byStatus: (status: UserStatus) => [...userKeys.all, 'status', status] as const,
};

// Hooks for querying users
export function useUsers(
  filters?: UserFilters,
  options?: Omit<UseQueryOptions<ApiResponse<AppUser[]>, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () => usersService.getUsers(filters),
    ...options,
  });
}

export function useUser(
  id: string,
  options?: Omit<UseQueryOptions<ApiResponse<AppUser>, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => usersService.getUserById(id),
    enabled: !!id,
    ...options,
  });
}

export function useUsersByRole(
  role: Role,
  options?: Omit<UseQueryOptions<ApiResponse<AppUser[]>, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: userKeys.byRole(role),
    queryFn: () => usersService.getUsersByRole(role),
    ...options,
  });
}

export function useUsersByStatus(
  status: UserStatus,
  options?: Omit<UseQueryOptions<ApiResponse<AppUser[]>, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: userKeys.byStatus(status),
    queryFn: () => usersService.getUsersByStatus(status),
    ...options,
  });
}

// Mutations for users
export function useCreateUser(
  options?: UseMutationOptions<ApiResponse<AppUser>, ApiError, CreateUserDto>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserDto) => usersService.createUser(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      showSuccess(data.message || 'User created successfully');
    },
    ...options,
  });
}

export function useUpdateUser(
  options?: UseMutationOptions<ApiResponse<AppUser>, ApiError, { id: string; data: UpdateUserDto }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserDto }) =>
      usersService.updateUser(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      showSuccess(data.message || 'User updated successfully');
    },
    ...options,
  });
}

export function usePatchUser(
  options?: UseMutationOptions<ApiResponse<AppUser>, ApiError, { id: string; data: Partial<UpdateUserDto> }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UpdateUserDto> }) =>
      usersService.patchUser(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      showSuccess(data.message || 'User updated successfully');
    },
    ...options,
  });
}

export function useDeleteUser(
  options?: UseMutationOptions<ApiResponse<void>, ApiError, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => usersService.deleteUser(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      showSuccess(data.message || 'User deleted successfully');
    },
    ...options,
  });
}

export function useChangeUserRole(
  options?: UseMutationOptions<ApiResponse<AppUser>, ApiError, { id: string; role: Role }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) =>
      usersService.changeUserRole(id, role),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      showSuccess(data.message || 'User role updated successfully');
    },
    ...options,
  });
}

export function useChangeUserStatus(
  options?: UseMutationOptions<ApiResponse<AppUser>, ApiError, { id: string; status: UserStatus }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserStatus }) =>
      usersService.changeUserStatus(id, status),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      showSuccess(data.message || 'User status updated successfully');
    },
    ...options,
  });
}

export function useBulkUpdateUsers(
  options?: UseMutationOptions<
    ApiResponse<AppUser[]>,
    ApiError,
    { ids: string[]; data: Partial<UpdateUserDto> }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, data }: { ids: string[]; data: Partial<UpdateUserDto> }) =>
      usersService.bulkUpdateUsers(ids, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      showSuccess(data.message || 'Users updated successfully');
    },
    ...options,
  });
}

export function useBulkDeleteUsers(
  options?: UseMutationOptions<ApiResponse<void>, ApiError, string[]>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => usersService.bulkDeleteUsers(ids),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      showSuccess(data.message || 'Users deleted successfully');
    },
    ...options,
  });
}

export function useUpdateMyProfile(
  options?: UseMutationOptions<ApiResponse<AppUser>, ApiError, UpdateProfileDto>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileDto) => usersService.updateMyProfile(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      showSuccess(data.message || 'Profile updated successfully');
    },
    ...options,
  });
}
