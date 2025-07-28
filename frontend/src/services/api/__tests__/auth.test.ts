import { AuthService } from '../auth';
import { ApiClient } from '../client';
import { STORAGE_KEYS } from '../config';

// Mock ApiClient
jest.mock('../client');
const MockApiClient = ApiClient as jest.MockedClass<typeof ApiClient>;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('AuthService', () => {
  let authService: AuthService;
  let mockApiClient: jest.Mocked<ApiClient>;

  beforeEach(() => {
    mockApiClient = new MockApiClient() as jest.Mocked<ApiClient>;
    authService = new AuthService(mockApiClient);

    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  describe('register', () => {
    it('should register user and store auth data', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const authResponse = {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        tokens: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          expiresAt: Date.now() + 900000, // 15 minutes
        },
      };

      mockApiClient.post.mockResolvedValueOnce({
        success: true,
        data: authResponse,
      });

      const result = await authService.register(registerData);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/auth/register',
        registerData
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.ACCESS_TOKEN,
        'access-token'
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.REFRESH_TOKEN,
        'refresh-token'
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.USER_DATA,
        JSON.stringify(authResponse.user)
      );
      expect(result).toEqual(authResponse);
    });
  });

  describe('login', () => {
    it('should login user and store auth data', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const authResponse = {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        tokens: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          expiresAt: Date.now() + 900000,
        },
      };

      mockApiClient.post.mockResolvedValueOnce({
        success: true,
        data: authResponse,
      });

      const result = await authService.login(loginData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/login', loginData);
      expect(result).toEqual(authResponse);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token when refresh token is available', async () => {
      localStorageMock.getItem.mockReturnValue('refresh-token');

      const authResponse = {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        tokens: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          expiresAt: Date.now() + 900000,
        },
      };

      mockApiClient.post.mockResolvedValueOnce({
        success: true,
        data: authResponse,
      });

      const result = await authService.refreshToken();

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/refresh', {
        refreshToken: 'refresh-token',
      });
      expect(result).toEqual(authResponse);
    });

    it('should throw error when no refresh token is available', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      await expect(authService.refreshToken()).rejects.toThrow(
        'No refresh token available'
      );
    });
  });

  describe('logout', () => {
    it('should logout and clear auth data', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        success: true,
        data: null,
      });

      await authService.logout();

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/logout');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        STORAGE_KEYS.ACCESS_TOKEN
      );
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        STORAGE_KEYS.REFRESH_TOKEN
      );
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        STORAGE_KEYS.USER_DATA
      );
    });

    it('should clear auth data even if server logout fails', async () => {
      mockApiClient.post.mockRejectedValueOnce(new Error('Server error'));

      await authService.logout();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        STORAGE_KEYS.ACCESS_TOKEN
      );
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        STORAGE_KEYS.REFRESH_TOKEN
      );
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        STORAGE_KEYS.USER_DATA
      );
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when user is authenticated', async () => {
      localStorageMock.getItem.mockReturnValue('access-token');

      mockApiClient.get.mockResolvedValueOnce({
        success: true,
        data: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      });

      const result = await authService.isAuthenticated();

      expect(result).toBe(true);
      expect(mockApiClient.get).toHaveBeenCalledWith('/auth/profile');
    });

    it('should return false when no token is available', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = await authService.isAuthenticated();

      expect(result).toBe(false);
    });

    it('should try to refresh token when profile request fails', async () => {
      localStorageMock.getItem
        .mockReturnValueOnce('access-token') // getAccessToken call
        .mockReturnValueOnce('refresh-token'); // getRefreshToken call

      // Profile request fails
      mockApiClient.get.mockRejectedValueOnce(new Error('Unauthorized'));

      // Refresh token succeeds
      mockApiClient.post.mockResolvedValueOnce({
        success: true,
        data: {
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
          tokens: {
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
            expiresAt: Date.now() + 900000,
          },
        },
      });

      const result = await authService.isAuthenticated();

      expect(result).toBe(true);
      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/refresh', {
        refreshToken: 'refresh-token',
      });
    });

    it('should return false when both profile and refresh fail', async () => {
      localStorageMock.getItem
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      mockApiClient.get.mockRejectedValueOnce(new Error('Unauthorized'));
      mockApiClient.post.mockRejectedValueOnce(new Error('Refresh failed'));

      const result = await authService.isAuthenticated();

      expect(result).toBe(false);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        STORAGE_KEYS.ACCESS_TOKEN
      );
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        STORAGE_KEYS.REFRESH_TOKEN
      );
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        STORAGE_KEYS.USER_DATA
      );
    });
  });

  describe('getProfile', () => {
    it('should get user profile', async () => {
      const userData = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockApiClient.get.mockResolvedValueOnce({
        success: true,
        data: userData,
      });

      const result = await authService.getProfile();

      expect(mockApiClient.get).toHaveBeenCalledWith('/auth/profile');
      expect(result).toEqual(userData);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updates = { name: 'Updated Name' };
      const updatedUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Updated Name',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockApiClient.put.mockResolvedValueOnce({
        success: true,
        data: updatedUser,
      });

      const result = await authService.updateProfile(updates);

      expect(mockApiClient.put).toHaveBeenCalledWith('/auth/profile', updates);
      expect(result).toEqual(updatedUser);
    });
  });

  describe('requestPasswordReset', () => {
    it('should request password reset', async () => {
      const email = 'test@example.com';

      mockApiClient.post.mockResolvedValueOnce({
        success: true,
        data: null,
      });

      await authService.requestPasswordReset(email);

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/reset-password', {
        email,
      });
    });
  });

  describe('getCurrentUser', () => {
    it('should get current user from localStorage', async () => {
      const userData = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(userData));

      const result = await authService.getCurrentUser();

      expect(localStorageMock.getItem).toHaveBeenCalledWith(
        STORAGE_KEYS.USER_DATA
      );
      expect(result).toEqual(userData);
    });

    it('should return null when no user data is stored', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = await authService.getCurrentUser();

      expect(result).toBeNull();
    });

    it('should return null when stored data is invalid JSON', async () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');

      const result = await authService.getCurrentUser();

      expect(result).toBeNull();
    });
  });
});
