import { ApiClient } from './client';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
  ApiResponse,
} from './types';
import { STORAGE_KEYS } from './config';

export class AuthService {
  constructor(private apiClient: ApiClient) {}

  /**
   * Register a new user account
   */
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await this.apiClient.post<AuthResponse>(
      '/auth/register',
      userData
    );

    if (response.success && response.data) {
      await this.storeAuthData(response.data);
    }

    return response.data!;
  }

  /**
   * Login with email and password
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.apiClient.post<AuthResponse>(
      '/auth/login',
      credentials
    );

    if (response.success && response.data) {
      await this.storeAuthData(response.data);
    }

    return response.data!;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = await this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.apiClient.post<AuthResponse>('/auth/refresh', {
      refreshToken,
    });

    if (response.success && response.data) {
      await this.storeAuthData(response.data);
    }

    return response.data!;
  }

  /**
   * Logout and clear stored tokens
   */
  async logout(): Promise<void> {
    try {
      // Attempt to notify server of logout
      await this.apiClient.post('/auth/logout');
    } catch (error) {
      // Continue with local logout even if server request fails
      console.warn(
        'Server logout failed, continuing with local logout:',
        error
      );
    }

    await this.clearAuthData();
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<User> {
    const response = await this.apiClient.get<User>('/auth/profile');
    return response.data!;
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<User>): Promise<User> {
    const response = await this.apiClient.put<User>('/auth/profile', updates);
    return response.data!;
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    await this.apiClient.post('/auth/reset-password', { email });
  }

  /**
   * Check if user is currently authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAccessToken();
    if (!token) return false;

    try {
      // Verify token is still valid by making a test request
      await this.getProfile();
      return true;
    } catch (error) {
      // Token is invalid, try to refresh
      try {
        await this.refreshToken();
        return true;
      } catch (refreshError) {
        // Refresh failed, user is not authenticated
        await this.clearAuthData();
        return false;
      }
    }
  }

  /**
   * Get current access token
   */
  async getAccessToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;

    try {
      return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  /**
   * Get current refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;

    try {
      return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Failed to get refresh token:', error);
      return null;
    }
  }

  /**
   * Get current user data from storage
   */
  async getCurrentUser(): Promise<User | null> {
    if (typeof window === 'undefined') return null;

    try {
      const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Failed to get user data:', error);
      return null;
    }
  }

  /**
   * Store authentication data in localStorage
   */
  private async storeAuthData(authData: AuthResponse): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(
        STORAGE_KEYS.ACCESS_TOKEN,
        authData.tokens.accessToken
      );
      localStorage.setItem(
        STORAGE_KEYS.REFRESH_TOKEN,
        authData.tokens.refreshToken
      );
      localStorage.setItem(
        STORAGE_KEYS.USER_DATA,
        JSON.stringify(authData.user)
      );
    } catch (error) {
      console.error('Failed to store auth data:', error);
      throw new Error('Failed to store authentication data');
    }
  }

  /**
   * Clear all authentication data from storage
   */
  private async clearAuthData(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    } catch (error) {
      console.error('Failed to clear auth data:', error);
    }
  }

  /**
   * Migrate guest user data to authenticated account
   */
  async migrateGuestData(): Promise<void> {
    // This will be implemented when we have the hybrid storage system
    // It will transfer IndexedDB data to the authenticated user's cloud storage
    console.log('Guest data migration will be implemented with hybrid storage');
  }
}
