import { AppUser, Role } from '@/types';
import { apiClient, ApiResponse } from './api.client';
import { API_ENDPOINTS } from './api.config';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: AppUser;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

class AuthService {
  /**
   * Windows authentication
   */
  async windowsLogin(): Promise<ApiResponse<LoginResponse>> {
    const response = await apiClient.get<LoginResponse>(
      API_ENDPOINTS.AUTH_WINDOWS_LOGIN
    );
    
    if (response.success && response.data.accessToken) {
      apiClient.setAuthToken(response.data.accessToken);
      this.storeTokens(response.data.accessToken, response.data.refreshToken);
    }
    
    return response;
  }

  /**
   * Login user with email and password
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> {
    const response = await apiClient.post<LoginResponse>(
      API_ENDPOINTS.AUTH_LOGIN,
      credentials
    );
    
    if (response.success && response.data.accessToken) {
      apiClient.setAuthToken(response.data.accessToken);
      this.storeTokens(response.data.accessToken, response.data.refreshToken);
    }
    
    return response;
  }

  /**
   * Logout current user
   */
  async logout(): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.post<void>(API_ENDPOINTS.AUTH_LOGOUT);
      this.clearTokens();
      apiClient.removeAuthToken();
      return response;
    } catch (error) {
      this.clearTokens();
      apiClient.removeAuthToken();
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<ApiResponse<RefreshTokenResponse>> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      throw {
        message: 'No refresh token available',
        status: 401,
      };
    }

    const response = await apiClient.post<RefreshTokenResponse>(
      API_ENDPOINTS.AUTH_REFRESH,
      { refreshToken }
    );

    if (response.success && response.data.accessToken) {
      apiClient.setAuthToken(response.data.accessToken);
      this.storeAccessToken(response.data.accessToken);
    }

    return response;
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<ApiResponse<AppUser>> {
    return apiClient.get<AppUser>(API_ENDPOINTS.AUTH_ME);
  }

  /**
   * Store tokens in localStorage
   */
  private storeTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  /**
   * Store access token only
   */
  private storeAccessToken(accessToken: string) {
    localStorage.setItem('accessToken', accessToken);
  }

  /**
   * Get access token from localStorage
   */
  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  /**
   * Get refresh token from localStorage
   */
  private getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  /**
   * Clear tokens from localStorage
   */
  private clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * Initialize auth client with stored token
   */
  initializeAuth() {
    const token = this.getAccessToken();
    if (token) {
      apiClient.setAuthToken(token);
    }
  }
}

export const authService = new AuthService();
