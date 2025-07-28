import { ApiResponse, ApiError, QueuedRequest, ApiClientConfig } from './types';
import {
  API_CONFIG,
  HTTP_STATUS,
  ERROR_MESSAGES,
  DEFAULT_HEADERS,
  STORAGE_KEYS,
} from './config';

export class ApiClient {
  private config: ApiClientConfig;
  private offlineQueue: QueuedRequest[] = [];
  private isOnline: boolean = true;
  private requestIdCounter: number = 0;

  constructor(config: Partial<ApiClientConfig> = {}) {
    this.config = { ...API_CONFIG, ...config };
    this.initializeNetworkMonitoring();
    this.loadOfflineQueue();
  }

  /**
   * Make a GET request
   */
  async get<T = any>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>('GET', url, undefined, options);
  }

  /**
   * Make a POST request
   */
  async post<T = any>(
    url: string,
    data?: any,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>('POST', url, data, options);
  }

  /**
   * Make a PUT request
   */
  async put<T = any>(
    url: string,
    data?: any,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', url, data, options);
  }

  /**
   * Make a DELETE request
   */
  async delete<T = any>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', url, undefined, options);
  }

  /**
   * Upload a file with progress tracking
   */
  async uploadFile<T = any>(
    url: string,
    file: File,
    additionalData?: Record<string, any>,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(
          key,
          typeof value === 'string' ? value : JSON.stringify(value)
        );
      });
    }

    const headers = await this.getHeaders();
    delete headers['Content-Type']; // Let browser set multipart boundary

    return this.requestWithProgress<T>(
      'POST',
      url,
      formData,
      { headers },
      onProgress
    );
  }

  /**
   * Core request method with error handling and retry logic
   */
  private async request<T>(
    method: string,
    url: string,
    data?: any,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const requestId = this.generateRequestId();
    const fullUrl = this.buildUrl(url);
    const headers = await this.getHeaders(
      options.headers as Record<string, string>
    );

    const requestOptions: RequestInit = {
      method,
      headers,
      ...options,
    };

    if (data && method !== 'GET') {
      requestOptions.body =
        data instanceof FormData ? data : JSON.stringify(data);
    }

    // If offline and queue is enabled, add to queue
    if (!this.isOnline && this.config.enableOfflineQueue) {
      return this.queueRequest<T>(method, url, data, headers, requestId);
    }

    return this.executeRequest<T>(fullUrl, requestOptions, requestId);
  }

  /**
   * Execute HTTP request with retry logic
   */
  private async executeRequest<T>(
    url: string,
    options: RequestInit,
    requestId: string,
    retryCount: number = 0
  ): Promise<ApiResponse<T>> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.timeout
      );

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      return await this.handleResponse<T>(response, requestId);
    } catch (error) {
      return this.handleRequestError<T>(
        error,
        url,
        options,
        requestId,
        retryCount
      );
    }
  }

  /**
   * Execute request with progress tracking for file uploads
   */
  private async requestWithProgress<T>(
    method: string,
    url: string,
    data: FormData,
    options: RequestInit,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    const requestId = this.generateRequestId();
    const fullUrl = this.buildUrl(url);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', async () => {
        try {
          const response = new Response(xhr.response, {
            status: xhr.status,
            statusText: xhr.statusText,
            headers: new Headers(
              xhr
                .getAllResponseHeaders()
                .split('\r\n')
                .reduce(
                  (headers, line) => {
                    const [key, value] = line.split(': ');
                    if (key && value) headers[key] = value;
                    return headers;
                  },
                  {} as Record<string, string>
                )
            ),
          });

          const result = await this.handleResponse<T>(response, requestId);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      xhr.addEventListener('error', () => {
        reject(
          this.createApiError(
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
            ERROR_MESSAGES.NETWORK_ERROR
          )
        );
      });

      xhr.addEventListener('timeout', () => {
        reject(
          this.createApiError(
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
            ERROR_MESSAGES.TIMEOUT_ERROR
          )
        );
      });

      xhr.open(method, fullUrl);

      // Set headers
      Object.entries((options.headers as Record<string, string>) || {}).forEach(
        ([key, value]) => {
          if (key !== 'Content-Type') {
            // Let browser set Content-Type for FormData
            xhr.setRequestHeader(key, value);
          }
        }
      );

      xhr.timeout = this.config.timeout;
      xhr.send(data);
    });
  }

  /**
   * Handle HTTP response and parse data
   */
  private async handleResponse<T>(
    response: Response,
    requestId: string
  ): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');
    let data: any;

    try {
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
    } catch (error) {
      data = null;
    }

    if (!response.ok) {
      const apiError = this.createApiError(
        response.status,
        data?.message || data?.error || ERROR_MESSAGES.SERVER_ERROR,
        data
      );
      throw apiError;
    }

    return {
      success: true,
      data: data?.data || data,
      message: data?.message,
    };
  }

  /**
   * Handle request errors with retry logic
   */
  private async handleRequestError<T>(
    error: any,
    url: string,
    options: RequestInit,
    requestId: string,
    retryCount: number
  ): Promise<ApiResponse<T>> {
    // Handle abort errors (timeout)
    if (error.name === 'AbortError') {
      throw this.createApiError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_MESSAGES.TIMEOUT_ERROR
      );
    }

    // Handle network errors
    if (!navigator.onLine) {
      this.isOnline = false;
      throw this.createApiError(
        HTTP_STATUS.SERVICE_UNAVAILABLE,
        ERROR_MESSAGES.OFFLINE
      );
    }

    // Retry logic
    if (retryCount < this.config.retryAttempts) {
      const delay = this.config.retryDelay * Math.pow(2, retryCount); // Exponential backoff
      await this.sleep(delay);
      return this.executeRequest<T>(url, options, requestId, retryCount + 1);
    }

    // If it's an ApiError, re-throw it
    if (error.status) {
      throw error;
    }

    // Generic network error
    throw this.createApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_MESSAGES.NETWORK_ERROR
    );
  }

  /**
   * Queue request for offline processing
   */
  private async queueRequest<T>(
    method: string,
    url: string,
    data: any,
    headers: Record<string, string>,
    requestId: string
  ): Promise<ApiResponse<T>> {
    const queuedRequest: QueuedRequest = {
      id: requestId,
      method: method as any,
      url,
      data,
      headers,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: this.config.retryAttempts,
    };

    this.offlineQueue.push(queuedRequest);
    await this.saveOfflineQueue();

    // Return a pending response for offline requests
    return {
      success: true,
      data: null as T,
      message: 'Request queued for when online',
    };
  }

  /**
   * Process offline queue when back online
   */
  private async processOfflineQueue(): Promise<void> {
    if (!this.isOnline || this.offlineQueue.length === 0) return;

    const queue = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const request of queue) {
      try {
        await this.executeRequest(
          this.buildUrl(request.url),
          {
            method: request.method,
            headers: request.headers,
            body: request.data ? JSON.stringify(request.data) : undefined,
          },
          request.id
        );
      } catch (error) {
        // If request fails, add back to queue if retries available
        if (request.retryCount < request.maxRetries) {
          request.retryCount++;
          this.offlineQueue.push(request);
        }
      }
    }

    await this.saveOfflineQueue();
  }

  /**
   * Get headers for requests including authentication
   */
  private async getHeaders(
    additionalHeaders: Record<string, string> = {}
  ): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      ...DEFAULT_HEADERS,
      ...additionalHeaders,
    };

    // Add authentication token if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Build full URL from relative path
   */
  private buildUrl(path: string): string {
    return `${this.config.baseURL}${path}`;
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${++this.requestIdCounter}`;
  }

  /**
   * Create standardized API error
   */
  private createApiError(
    status: number,
    message: string,
    details?: any
  ): ApiError {
    return {
      status,
      message,
      details,
      code: `HTTP_${status}`,
    };
  }

  /**
   * Initialize network status monitoring
   */
  private initializeNetworkMonitoring(): void {
    if (typeof window === 'undefined') return;

    this.isOnline = navigator.onLine;

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processOfflineQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Load offline queue from storage
   */
  private async loadOfflineQueue(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const queueData = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      if (queueData) {
        this.offlineQueue = JSON.parse(queueData);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      this.offlineQueue = [];
    }
  }

  /**
   * Save offline queue to storage
   */
  private async saveOfflineQueue(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(
        STORAGE_KEYS.OFFLINE_QUEUE,
        JSON.stringify(this.offlineQueue)
      );
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  /**
   * Utility function for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get current network status
   */
  public getNetworkStatus(): { isOnline: boolean; queueLength: number } {
    return {
      isOnline: this.isOnline,
      queueLength: this.offlineQueue.length,
    };
  }

  /**
   * Clear offline queue
   */
  public clearOfflineQueue(): void {
    this.offlineQueue = [];
    this.saveOfflineQueue();
  }
}
