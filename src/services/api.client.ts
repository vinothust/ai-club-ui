import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG } from './api.config';
import { toast } from 'sonner';

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]> | string[];
}

// Global loading state manager
class LoadingManager {
  private loadingCount = 0;
  private listeners: Set<(isLoading: boolean) => void> = new Set();

  increment() {
    this.loadingCount++;
    this.notify();
  }

  decrement() {
    this.loadingCount = Math.max(0, this.loadingCount - 1);
    this.notify();
  }

  subscribe(listener: (isLoading: boolean) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const isLoading = this.loadingCount > 0;
    this.listeners.forEach(listener => listener(isLoading));
  }

  isLoading() {
    return this.loadingCount > 0;
  }
}

export const loadingManager = new LoadingManager();

class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: API_CONFIG.HEADERS,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Increment loading counter
        loadingManager.increment();

        // Add auth token if available
        const token = localStorage.getItem('accessToken');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
      },
      (error: AxiosError) => {
        loadingManager.decrement();
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // Decrement loading counter
        loadingManager.decrement();
        return response;
      },
      async (error: AxiosError<any>) => {
        // Decrement loading counter
        loadingManager.decrement();

        // Handle errors globally
        const apiError = this.handleError(error);

        // Don't show toast for 401 (handled by auth flow)
        if (apiError.status !== 401) {
          toast.error(apiError.message);
        }

        // Handle 401 Unauthorized - token expired
        if (apiError.status === 401) {
          const originalRequest = error.config;
          
          // Try to refresh token
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken && originalRequest && !originalRequest.headers['X-Retry']) {
            try {
              const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh`, {
                refreshToken,
              });

              const { accessToken } = response.data.data;
              localStorage.setItem('accessToken', accessToken);

              // Retry original request
              originalRequest.headers['X-Retry'] = 'true';
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return this.axiosInstance(originalRequest);
            } catch (refreshError) {
              // Refresh failed - logout user
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              window.location.href = '/';
              toast.error('Session expired. Please login again.');
            }
          } else {
            // No refresh token or retry failed - logout
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/';
            toast.error('Session expired. Please login again.');
          }
        }

        return Promise.reject(apiError);
      }
    );
  }

  private handleError(error: AxiosError<any>): ApiError {
    if (error.response) {
      // Server responded with error
      const { data, status } = error.response;
      return {
        message: data?.message || data?.error || 'An error occurred',
        status,
        errors: data?.errors,
      };
    } else if (error.request) {
      // Request made but no response
      return {
        message: 'No response from server. Please check your connection.',
        status: 0,
      };
    } else if (error.code === 'ECONNABORTED') {
      // Timeout
      return {
        message: 'Request timeout. Please try again.',
        status: 408,
      };
    } else {
      // Other errors
      return {
        message: error.message || 'An unexpected error occurred',
        status: 500,
      };
    }
  }

  async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.get<ApiResponse<T>>(endpoint, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async post<T>(
    endpoint: string,
    body?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.post<ApiResponse<T>>(endpoint, body, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async put<T>(
    endpoint: string,
    body?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.put<ApiResponse<T>>(endpoint, body, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async patch<T>(
    endpoint: string,
    body?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.patch<ApiResponse<T>>(endpoint, body, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.delete<ApiResponse<T>>(endpoint, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  setAuthToken(token: string) {
    this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  removeAuthToken() {
    delete this.axiosInstance.defaults.headers.common['Authorization'];
  }

  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}

export const apiClient = new ApiClient();
