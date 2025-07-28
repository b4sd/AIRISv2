import { ApiClient } from '../client';
import { HTTP_STATUS, ERROR_MESSAGES } from '../config';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

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

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

describe('ApiClient', () => {
  let apiClient: ApiClient;

  beforeEach(() => {
    apiClient = new ApiClient({
      baseURL: 'http://localhost:3001/api',
      timeout: 5000,
      retryAttempts: 2,
    });

    mockFetch.mockClear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  describe('GET requests', () => {
    it('should make successful GET request', async () => {
      const mockResponse = {
        success: true,
        data: { id: 1, name: 'Test' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response);

      const result = await apiClient.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Accept: 'application/json',
          }),
        })
      );

      expect(result).toEqual({
        success: true,
        data: { id: 1, name: 'Test' },
      });
    });

    it('should include authorization header when token is available', async () => {
      localStorageMock.getItem.mockReturnValue('test-token');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: {} }),
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response);

      await apiClient.get('/protected');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/protected',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });
  });

  describe('POST requests', () => {
    it('should make successful POST request with data', async () => {
      const requestData = { name: 'Test', value: 123 };
      const mockResponse = {
        success: true,
        data: { id: 1, ...requestData },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response);

      const result = await apiClient.post('/create', requestData);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/create',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestData),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result).toEqual({
        success: true,
        data: { id: 1, ...requestData },
      });
    });
  });

  describe('Error handling', () => {
    it('should handle HTTP error responses', async () => {
      const errorResponse = {
        error: 'Not found',
        message: 'Resource not found',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => errorResponse,
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response);

      await expect(apiClient.get('/not-found')).rejects.toMatchObject({
        status: 404,
        message: 'Resource not found',
      });
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiClient.get('/test')).rejects.toMatchObject({
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        message: ERROR_MESSAGES.NETWORK_ERROR,
      });
    });

    it('should handle timeout errors', async () => {
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  status: 200,
                  json: async () => ({}),
                } as Response),
              10000
            ); // Longer than timeout
          })
      );

      await expect(apiClient.get('/slow')).rejects.toMatchObject({
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        message: ERROR_MESSAGES.TIMEOUT_ERROR,
      });
    });
  });

  describe('Retry logic', () => {
    it('should retry failed requests', async () => {
      // First call fails, second succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: {} }),
          headers: new Headers({ 'content-type': 'application/json' }),
        } as Response);

      const result = await apiClient.get('/retry-test');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.success).toBe(true);
    });

    it('should fail after max retries', async () => {
      mockFetch.mockRejectedValue(new Error('Persistent error'));

      await expect(apiClient.get('/always-fails')).rejects.toMatchObject({
        message: ERROR_MESSAGES.NETWORK_ERROR,
      });

      expect(mockFetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('Offline queue', () => {
    beforeEach(() => {
      // Mock navigator.onLine to be false
      Object.defineProperty(navigator, 'onLine', {
        value: false,
      });
    });

    it('should queue requests when offline', async () => {
      const result = await apiClient.post('/offline-test', { data: 'test' });

      expect(result).toEqual({
        success: true,
        data: null,
        message: 'Request queued for when online',
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should save queue to localStorage', async () => {
      await apiClient.post('/queue-test', { data: 'test' });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'voice_reading_offline_queue',
        expect.stringContaining('queue-test')
      );
    });
  });

  describe('File upload', () => {
    it('should upload file with progress tracking', async () => {
      const mockFile = new File(['test content'], 'test.txt', {
        type: 'text/plain',
      });
      const mockProgress = jest.fn();

      // Mock XMLHttpRequest
      const mockXHR = {
        upload: { addEventListener: jest.fn() },
        addEventListener: jest.fn(),
        open: jest.fn(),
        setRequestHeader: jest.fn(),
        send: jest.fn(),
        status: 200,
        response: JSON.stringify({ success: true, data: { id: 1 } }),
        getAllResponseHeaders: jest.fn().mockReturnValue(''),
      };

      global.XMLHttpRequest = jest.fn(() => mockXHR) as any;

      // Simulate successful upload
      setTimeout(() => {
        const loadHandler = mockXHR.addEventListener.mock.calls.find(
          (call) => call[0] === 'load'
        )[1];
        loadHandler();
      }, 0);

      const result = await apiClient.uploadFile(
        '/upload',
        mockFile,
        {},
        mockProgress
      );

      expect(mockXHR.open).toHaveBeenCalledWith(
        'POST',
        'http://localhost:3001/api/upload'
      );
      expect(mockXHR.send).toHaveBeenCalled();
    });
  });

  describe('Network status', () => {
    it('should return current network status', () => {
      const status = apiClient.getNetworkStatus();

      expect(status).toEqual({
        isOnline: false, // Set to false in offline queue test
        queueLength: expect.any(Number),
      });
    });

    it('should clear offline queue', () => {
      apiClient.clearOfflineQueue();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'voice_reading_offline_queue'
      );
    });
  });
});
