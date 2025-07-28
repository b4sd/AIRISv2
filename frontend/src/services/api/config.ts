import { ApiClientConfig } from './types';

// API Configuration
export const API_CONFIG: ApiClientConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  enableOfflineQueue: true,
  enableRequestInterception: true,
  enableResponseInterception: true,
};

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
  },

  // Books
  BOOKS: {
    LIST: '/books',
    UPLOAD: '/books/upload',
    GET: (id: string) => `/books/${id}`,
    DELETE: (id: string) => `/books/${id}`,
    CONTENT: (id: string) => `/books/${id}/content`,
    POSITION: (id: string) => `/books/${id}/position`,
  },

  // Notes
  NOTES: {
    LIST: (bookId: string) => `/books/${bookId}/notes`,
    CREATE: (bookId: string) => `/books/${bookId}/notes`,
    GET: (bookId: string, noteId: string) => `/books/${bookId}/notes/${noteId}`,
    UPDATE: (bookId: string, noteId: string) =>
      `/books/${bookId}/notes/${noteId}`,
    DELETE: (bookId: string, noteId: string) =>
      `/books/${bookId}/notes/${noteId}`,
    SEARCH: (bookId: string) => `/books/${bookId}/notes/search`,
  },

  // AI Services
  AI: {
    SUMMARIZE: '/ai/summarize',
    ANALYZE: '/ai/analyze',
    TRANSLATE: '/ai/translate',
  },

  // User Preferences
  PREFERENCES: {
    GET: '/preferences',
    UPDATE: '/preferences',
  },

  // Sync
  SYNC: {
    FULL: '/sync',
    INCREMENTAL: '/sync/incremental',
    STATUS: '/sync/status',
  },
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.',
  TIMEOUT_ERROR: 'Yêu cầu quá thời gian chờ. Vui lòng thử lại.',
  UNAUTHORIZED: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  FORBIDDEN: 'Bạn không có quyền truy cập tài nguyên này.',
  NOT_FOUND: 'Không tìm thấy tài nguyên yêu cầu.',
  SERVER_ERROR: 'Lỗi máy chủ. Vui lòng thử lại sau.',
  OFFLINE: 'Bạn đang offline. Yêu cầu sẽ được xử lý khi có kết nối.',
  VALIDATION_ERROR: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.',
  RATE_LIMIT: 'Quá nhiều yêu cầu. Vui lòng chờ một chút.',
} as const;

// Request Headers
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
  'X-Client-Version': '1.0.0',
  'X-Client-Platform': 'web',
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'voice_reading_access_token',
  REFRESH_TOKEN: 'voice_reading_refresh_token',
  USER_DATA: 'voice_reading_user_data',
  OFFLINE_QUEUE: 'voice_reading_offline_queue',
  SYNC_TIMESTAMP: 'voice_reading_sync_timestamp',
} as const;
