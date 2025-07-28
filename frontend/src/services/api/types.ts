// API Types and Interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: any;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// Book API Types
export interface BookUploadRequest {
  title: string;
  author: string;
  file: File;
  format: 'pdf' | 'epub' | 'txt';
}

export interface BookResponse {
  id: string;
  title: string;
  author: string;
  format: string;
  size: number;
  uploadedAt: string;
  lastReadPosition?: ReadingPosition;
}

export interface ReadingPosition {
  page: number;
  chapter: string;
  characterOffset: number;
  percentage: number;
  timestamp: string;
}

// Notes API Types
export interface NoteRequest {
  bookId: string;
  content: string;
  position: ReadingPosition;
  tags?: string[];
}

export interface NoteResponse {
  id: string;
  bookId: string;
  content: string;
  position: ReadingPosition;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// AI Service Types
export interface SummarizationRequest {
  text: string;
  type: 'page' | 'chapter' | 'book';
  language?: 'vi' | 'en';
  length?: 'short' | 'medium' | 'long';
  style?: 'bullet' | 'paragraph';
}

export interface SummarizationResponse {
  summary: string;
  keyPoints?: string[];
  language: string;
  processingTime: number;
}

// Preferences API Types
export interface UserPreferences {
  voiceSettings: {
    recognitionLanguage: string;
    speechRate: number;
    speechVoice: string;
    volume: number;
    nlpSensitivity: number;
  };
  readingSettings: {
    fontSize: number;
    theme: 'light' | 'dark';
    autoBookmark: boolean;
  };
  aiSettings: {
    summaryLength: 'short' | 'medium' | 'long';
    summaryStyle: 'bullet' | 'paragraph';
    summaryLanguage: 'vi' | 'en';
  };
}

// Sync Types
export interface SyncRequest {
  lastSyncTimestamp?: string;
  data: {
    books?: any[];
    notes?: any[];
    preferences?: UserPreferences;
    readingPositions?: any[];
  };
}

export interface SyncResponse {
  timestamp: string;
  conflicts?: DataConflict[];
  data: {
    books?: any[];
    notes?: any[];
    preferences?: UserPreferences;
    readingPositions?: any[];
  };
}

export interface DataConflict {
  type: 'book' | 'note' | 'preference' | 'position';
  id: string;
  localData: any;
  cloudData: any;
  localTimestamp: string;
  cloudTimestamp: string;
}

// Request Queue Types
export interface QueuedRequest {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  data?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  enableOfflineQueue: boolean;
  enableRequestInterception: boolean;
  enableResponseInterception: boolean;
}
