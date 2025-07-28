// Export all types from individual modules
export * from './book';
export * from './note';
export * from './voice';
export * from './preferences';
export * from './services';

// Common utility types
export type ID = string;
export type Timestamp = Date;

// API Response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Event types for the application
export interface AppEvent {
  type: string;
  payload?: any;
  timestamp: Date;
}

// Loading states
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Theme types
export type Theme = 'light' | 'dark' | 'system';

// Language types
export type Language = 'vi' | 'en';

// File types
export type FileFormat = 'pdf' | 'epub' | 'txt';

// Voice command result
export interface CommandResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}