/**
 * API Configuration for Voice Reading App
 * Shared between frontend and backend for consistency
 */

export const API_CONFIG = {
  // Base URLs
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",

  // Request timeouts (milliseconds)
  TIMEOUT: {
    DEFAULT: 10000, // 10 seconds
    UPLOAD: 60000, // 1 minute for file uploads
    AI: 30000, // 30 seconds for AI processing
    SYNC: 20000, // 20 seconds for sync operations
  },

  // Retry configuration
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY_MS: 1000,
    BACKOFF_MULTIPLIER: 2,
  },

  // Cache configuration
  CACHE: {
    AI_SUMMARY_TTL: 24 * 60 * 60 * 1000, // 24 hours
    BOOK_METADATA_TTL: 60 * 60 * 1000, // 1 hour
    USER_PREFERENCES_TTL: 30 * 60 * 1000, // 30 minutes
  },

  // Sync configuration
  SYNC: {
    INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
    BATCH_SIZE: 50, // Max items per sync batch
    CONFLICT_RESOLUTION: "timestamp", // "timestamp" | "manual"
  },

  // File upload limits
  UPLOAD: {
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    ALLOWED_FORMATS: ["pdf", "epub", "txt"],
    CHUNK_SIZE: 1024 * 1024, // 1MB chunks for large files
  },

  // Rate limiting (client-side)
  RATE_LIMIT: {
    AI_REQUESTS_PER_MINUTE: 10,
    SYNC_REQUESTS_PER_MINUTE: 6,
    UPLOAD_REQUESTS_PER_MINUTE: 3,
  },

  // Storage configuration
  STORAGE: {
    INDEXEDDB_NAME: "VoiceReadingApp",
    INDEXEDDB_VERSION: 1,
    MAX_LOCAL_STORAGE_MB: 500, // 500MB local storage limit
  },

  // Authentication
  AUTH: {
    TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // Refresh 5 minutes before expiry
    GUEST_MODE_ENABLED: true,
    AUTO_LOGIN_ENABLED: true,
  },

  // Voice processing
  VOICE: {
    RECOGNITION_TIMEOUT: 10000, // 10 seconds
    SYNTHESIS_RATE_MIN: 0.5,
    SYNTHESIS_RATE_MAX: 2.0,
    SYNTHESIS_RATE_DEFAULT: 1.0,
  },

  // AI processing
  AI: {
    SUMMARY_CACHE_SIZE: 100, // Max cached summaries
    MIN_TEXT_LENGTH: 100, // Minimum text length for summarization
    MAX_TEXT_LENGTH: 50000, // Maximum text length for summarization
  },
} as const;

// Environment-specific overrides
export const getApiConfig = () => {
  const env = process.env.NODE_ENV || "development";

  const envConfigs = {
    development: {
      BASE_URL: "http://localhost:8000",
      TIMEOUT: {
        ...API_CONFIG.TIMEOUT,
        DEFAULT: 30000, // Longer timeouts in development
      },
    },

    production: {
      BASE_URL:
        process.env.NEXT_PUBLIC_API_URL || "https://api.voicereading.app",
      TIMEOUT: API_CONFIG.TIMEOUT,
    },

    test: {
      BASE_URL: "http://localhost:8001",
      TIMEOUT: {
        ...API_CONFIG.TIMEOUT,
        DEFAULT: 5000, // Shorter timeouts in tests
      },
    },
  };

  return {
    ...API_CONFIG,
    ...envConfigs[env as keyof typeof envConfigs],
  };
};

// API Headers
export const getApiHeaders = (authToken?: string) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Client-Version": process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  return headers;
};

// Request ID generation for tracing
export const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Error handling configuration
export const ERROR_HANDLING = {
  SHOW_DETAILED_ERRORS: process.env.NODE_ENV === "development",
  LOG_ERRORS_TO_CONSOLE: process.env.NODE_ENV !== "production",
  REPORT_ERRORS_TO_SERVICE: process.env.NODE_ENV === "production",
} as const;
