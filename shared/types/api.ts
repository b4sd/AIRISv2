/**
 * Shared TypeScript interfaces for Voice Reading App
 * Used by both frontend and backend to ensure API consistency
 */

// ============================================================================
// Core Data Models
// ============================================================================

export interface Book {
  id: string;
  userId?: string; // Optional for guest mode
  title: string;
  author: string;
  format: "pdf" | "epub" | "txt";
  fileUrl?: string; // Backend URL, optional for local-only books
  textContent?: string; // Full text content for search/AI
  metadata: BookMetadata;
  lastReadPosition?: ReadingPosition;
  createdAt: Date;
  updatedAt: Date;
  // Sync metadata
  syncStatus?: "local" | "synced" | "pending" | "conflict";
  lastSyncAt?: Date;
}

export interface BookMetadata {
  pageCount: number;
  chapterCount: number;
  language: string;
  fileSize: number;
  isbn?: string;
  publisher?: string;
  publishedDate?: Date;
  tags: string[];
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
  startPage: number;
  endPage: number;
  wordCount: number;
}

export interface Note {
  id: string;
  bookId: string;
  userId?: string; // Optional for guest mode
  content: string;
  position: ReadingPosition;
  timestamp: Date;
  tags: string[];
  // Sync metadata
  syncStatus?: "local" | "synced" | "pending" | "conflict";
  lastSyncAt?: Date;
}

export interface ReadingPosition {
  page: number;
  chapter: string;
  characterOffset: number;
  percentage: number;
  timestamp: Date;
}

export interface UserPreferences {
  voiceSettings: {
    recognitionLanguage: string; // Default: 'vi-VN'
    speechRate: number;
    speechVoice: string;
    volume: number;
    nlpSensitivity: number;
  };
  readingSettings: {
    fontSize: number;
    theme: "light" | "dark";
    autoBookmark: boolean;
    autoSync: boolean;
  };
  aiSettings: {
    summaryLength: "short" | "medium" | "long";
    summaryStyle: "bullet" | "paragraph";
    summaryLanguage: "vi" | "en";
  };
  syncSettings: {
    enabled: boolean;
    autoSync: boolean;
    syncInterval: number; // minutes
    conflictResolution: "local" | "remote" | "manual";
  };
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  requestId: string;
}

export interface SyncRequest {
  lastSyncAt?: Date;
  data: {
    books?: Book[];
    notes?: Note[];
    readingPositions?: ReadingPosition[];
    preferences?: UserPreferences;
  };
}

export interface SyncResponse {
  conflicts: DataConflict[];
  updated: {
    books: Book[];
    notes: Note[];
    readingPositions: ReadingPosition[];
    preferences?: UserPreferences;
  };
  deleted: {
    bookIds: string[];
    noteIds: string[];
  };
  lastSyncAt: Date;
}

export interface DataConflict {
  type: "book" | "note" | "position" | "preferences";
  id: string;
  localData: any;
  remoteData: any;
  localTimestamp: Date;
  remoteTimestamp: Date;
}

// ============================================================================
// AI Service Types
// ============================================================================

export interface SummaryRequest {
  content: string;
  type: "page" | "chapter" | "book";
  language: "vi" | "en";
  length: "short" | "medium" | "long";
  style: "bullet" | "paragraph";
}

export interface SummaryResponse {
  summary: string;
  keyPoints: string[];
  language: string;
  cached: boolean;
  processingTime: number;
}

// ============================================================================
// Authentication Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends AuthRequest {
  name?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface TokenResponse {
  accessToken: string;
  expiresIn: number;
}

// ============================================================================
// Voice Command Types
// ============================================================================

export interface CommandIntent {
  action: string;
  parameters: Record<string, any>;
  confidence: number;
  originalText: string;
  language: string;
}

export interface VoiceCommand {
  text: string;
  intent: CommandIntent;
  timestamp: Date;
  success: boolean;
  error?: string;
}

// ============================================================================
// Storage Types
// ============================================================================

export interface StorageStats {
  totalBooks: number;
  totalNotes: number;
  localStorageUsed: number; // bytes
  cloudStorageUsed?: number; // bytes
  lastSyncAt?: Date;
  syncStatus: "offline" | "syncing" | "synced" | "error";
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt?: Date;
  pendingOperations: number;
  conflicts: number;
  error?: string;
}

// ============================================================================
// API Endpoints Configuration
// ============================================================================

export const API_ENDPOINTS = {
  // Authentication
  auth: {
    register: "/api/v1/auth/register",
    login: "/api/v1/auth/login",
    refresh: "/api/v1/auth/refresh",
    logout: "/api/v1/auth/logout",
    resetPassword: "/api/v1/auth/reset-password",
  },

  // User management
  users: {
    profile: "/api/v1/users/profile",
    preferences: "/api/v1/users/preferences",
    delete: "/api/v1/users/account",
  },

  // Books
  books: {
    list: "/api/v1/books",
    upload: "/api/v1/books/upload",
    get: (id: string) => `/api/v1/books/${id}`,
    update: (id: string) => `/api/v1/books/${id}`,
    delete: (id: string) => `/api/v1/books/${id}`,
  },

  // Notes
  notes: {
    list: (bookId: string) => `/api/v1/books/${bookId}/notes`,
    create: (bookId: string) => `/api/v1/books/${bookId}/notes`,
    update: (bookId: string, noteId: string) =>
      `/api/v1/books/${bookId}/notes/${noteId}`,
    delete: (bookId: string, noteId: string) =>
      `/api/v1/books/${bookId}/notes/${noteId}`,
    search: "/api/v1/notes/search",
  },

  // Sync
  sync: {
    full: "/api/v1/sync/full",
    incremental: "/api/v1/sync/incremental",
    readingPosition: "/api/v1/sync/reading-position",
    preferences: "/api/v1/sync/preferences",
    conflicts: "/api/v1/sync/conflicts",
  },

  // AI Services
  ai: {
    summarize: "/api/v1/ai/summarize",
    keyPoints: "/api/v1/ai/key-points",
    cached: (hash: string) => `/api/v1/ai/cached/${hash}`,
  },

  // Files
  files: {
    upload: "/api/v1/files/upload",
    get: (id: string) => `/api/v1/files/${id}`,
    delete: (id: string) => `/api/v1/files/${id}`,
  },
} as const;

// ============================================================================
// Error Codes
// ============================================================================

export const ERROR_CODES = {
  // Authentication errors
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  UNAUTHORIZED: "UNAUTHORIZED",

  // Validation errors
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",

  // Resource errors
  NOT_FOUND: "NOT_FOUND",
  ALREADY_EXISTS: "ALREADY_EXISTS",

  // Sync errors
  SYNC_CONFLICT: "SYNC_CONFLICT",
  SYNC_FAILED: "SYNC_FAILED",
  OFFLINE: "OFFLINE",

  // AI service errors
  AI_SERVICE_UNAVAILABLE: "AI_SERVICE_UNAVAILABLE",
  AI_QUOTA_EXCEEDED: "AI_QUOTA_EXCEEDED",

  // File errors
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  UNSUPPORTED_FORMAT: "UNSUPPORTED_FORMAT",
  UPLOAD_FAILED: "UPLOAD_FAILED",

  // Server errors
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
} as const;
