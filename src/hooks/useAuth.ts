import { useMutation, useQuery, UseMutationOptions, UseQueryOptions } from '@tanstack/react-query';
import { AppUser } from '@/types';
import { 
  authService, 
  LoginCredentials, 
  LoginResponse, 
  RefreshTokenResponse 
} from '@/services';
import { ApiResponse, ApiError } from '@/services/api.client';

// Hooks for authentication
export function useLogin(
  options?: UseMutationOptions<ApiResponse<LoginResponse>, ApiError, LoginCredentials>
) {
  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    ...options,
  });
}

export function useWindowsLogin(
  options?: UseMutationOptions<ApiResponse<LoginResponse>, ApiError, void>
) {
  return useMutation({
    mutationFn: () => authService.windowsLogin(),
    ...options,
  });
}

export function useLogout(
  options?: UseMutationOptions<ApiResponse<void>, ApiError, void>
) {
  return useMutation({
    mutationFn: () => authService.logout(),
    ...options,
  });
}

export function useRefreshToken(
  options?: UseMutationOptions<ApiResponse<RefreshTokenResponse>, ApiError, void>
) {
  return useMutation({
    mutationFn: () => authService.refreshToken(),
    ...options,
  });
}

export function useCurrentUser(
  options?: Omit<UseQueryOptions<ApiResponse<AppUser>, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authService.getCurrentUser(),
    enabled: authService.isAuthenticated(),
    ...options,
  });
}

// Helper hook to check authentication status
export function useAuthStatus() {
  const isAuthenticated = authService.isAuthenticated();
  const accessToken = authService.getAccessToken();

  return {
    isAuthenticated,
    accessToken,
  };
}
