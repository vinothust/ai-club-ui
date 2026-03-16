import { AppUser, Role, UserStatus } from '@/types';
import { apiClient, ApiResponse } from './api.client';
import { API_ENDPOINTS } from './api.config';

export interface UserFilters {
  role?: Role;
  status?: UserStatus;
  search?: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
}

export interface UpdateUserDto extends Partial<CreateUserDto> {}

export interface UpdateProfileDto {
  name?: string;
  email?: string;
}

export interface UserStats {
  total: number;
  byRole: Record<Role, number>;
  byStatus: Record<UserStatus, number>;
  recentlyAdded: number;
}

class UsersService {
  /**
   * Get all users with optional filters
   */
  async getUsers(filters?: UserFilters): Promise<ApiResponse<AppUser[]>> {
    const queryParams = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
    }

    const endpoint = queryParams.toString()
      ? `${API_ENDPOINTS.USERS}?${queryParams.toString()}`
      : API_ENDPOINTS.USERS;

    return apiClient.get<AppUser[]>(endpoint);
  }

  /**
   * Get a single user by ID
   */
  async getUserById(id: string): Promise<ApiResponse<AppUser>> {
    return apiClient.get<AppUser>(API_ENDPOINTS.USER_BY_ID(id));
  }

  /**
   * Create a new user
   */
  async createUser(data: CreateUserDto): Promise<ApiResponse<AppUser>> {
    return apiClient.post<AppUser>(API_ENDPOINTS.USERS, data);
  }

  /**
   * Update an existing user
   */
  async updateUser(id: string, data: UpdateUserDto): Promise<ApiResponse<AppUser>> {
    return apiClient.put<AppUser>(API_ENDPOINTS.USER_BY_ID(id), data);
  }

  /**
   * Partially update a user
   */
  async patchUser(id: string, data: Partial<UpdateUserDto>): Promise<ApiResponse<AppUser>> {
    return apiClient.patch<AppUser>(API_ENDPOINTS.USER_BY_ID(id), data);
  }

  /**
   * Delete a user
   */
  async deleteUser(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(API_ENDPOINTS.USER_BY_ID(id));
  }

  /**
   * Get users by role
   */
  async getUsersByRole(role: Role): Promise<ApiResponse<AppUser[]>> {
    return apiClient.get<AppUser[]>(API_ENDPOINTS.USERS_BY_ROLE(role));
  }

  /**
   * Get users by status
   */
  async getUsersByStatus(status: UserStatus): Promise<ApiResponse<AppUser[]>> {
    return apiClient.get<AppUser[]>(API_ENDPOINTS.USERS_BY_STATUS(status));
  }

  /**
   * Update current user's own profile (name and/or email)
   */
  async updateMyProfile(data: UpdateProfileDto): Promise<ApiResponse<AppUser>> {
    return apiClient.patch<AppUser>(API_ENDPOINTS.USER_PROFILE, data);
  }

  /**
   * Bulk update users
   */
  async bulkUpdateUsers(
    ids: string[],
    data: Partial<UpdateUserDto>
  ): Promise<ApiResponse<AppUser[]>> {
    return apiClient.post<AppUser[]>(API_ENDPOINTS.USERS_BULK_UPDATE, {
      ids,
      data,
    });
  }

  /**
   * Bulk delete users
   */
  async bulkDeleteUsers(ids: string[]): Promise<ApiResponse<void>> {
    return apiClient.post<void>(API_ENDPOINTS.USERS_BULK_DELETE, { ids });
  }

  /**
   * Change user role
   */
  async changeUserRole(id: string, role: Role): Promise<ApiResponse<AppUser>> {
    return apiClient.patch<AppUser>(API_ENDPOINTS.USER_BY_ID(id), { role });
  }

  /**
   * Change user status
   */
  async changeUserStatus(id: string, status: UserStatus): Promise<ApiResponse<AppUser>> {
    return apiClient.patch<AppUser>(API_ENDPOINTS.USER_BY_ID(id), { status });
  }
}

export const usersService = new UsersService();
