// Main API service exports
export { ApiClient } from './client';
export { AuthService } from './auth';
export { BooksService } from './books';
export { NotesService } from './notes';
export { AIService } from './ai';
export { SyncService } from './sync';
export { PreferencesService } from './preferences';

// Type exports
export type {
  ApiResponse,
  ApiError,
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
  BookUploadRequest,
  BookResponse,
  ReadingPosition,
  NoteRequest,
  NoteResponse,
  SummarizationRequest,
  SummarizationResponse,
  UserPreferences,
  SyncRequest,
  SyncResponse,
  DataConflict,
  QueuedRequest,
  ApiClientConfig,
} from './types';

// Configuration exports
export {
  API_CONFIG,
  API_ENDPOINTS,
  HTTP_STATUS,
  ERROR_MESSAGES,
  DEFAULT_HEADERS,
  STORAGE_KEYS,
} from './config';

// Main API service class that combines all services
import { ApiClient } from './client';
import { STORAGE_KEYS } from './config';
import { AuthService } from './auth';
import { BooksService } from './books';
import { NotesService } from './notes';
import { AIService } from './ai';
import { SyncService } from './sync';
import { PreferencesService } from './preferences';
import { ApiClientConfig } from './types';

export class VoiceReadingAPI {
  public client: ApiClient;
  public auth: AuthService;
  public books: BooksService;
  public notes: NotesService;
  public ai: AIService;
  public sync: SyncService;
  public preferences: PreferencesService;

  constructor(config?: Partial<ApiClientConfig>) {
    this.client = new ApiClient(config);
    this.auth = new AuthService(this.client);
    this.books = new BooksService(this.client);
    this.notes = new NotesService(this.client);
    this.ai = new AIService(this.client);
    this.sync = new SyncService(this.client);
    this.preferences = new PreferencesService(this.client);
  }

  /**
   * Initialize the API client and check authentication status
   */
  async initialize(): Promise<{
    isAuthenticated: boolean;
    user?: any;
    networkStatus: {
      isOnline: boolean;
      queueLength: number;
    };
  }> {
    const networkStatus = this.client.getNetworkStatus();

    try {
      const isAuthenticated = await this.auth.isAuthenticated();
      let user = null;

      if (isAuthenticated) {
        user = await this.auth.getCurrentUser();
      }

      return {
        isAuthenticated,
        user,
        networkStatus,
      };
    } catch (error) {
      console.error('Failed to initialize API:', error);
      return {
        isAuthenticated: false,
        networkStatus,
      };
    }
  }

  /**
   * Get API health status
   */
  async getHealthStatus(): Promise<{
    api: boolean;
    database: boolean;
    ai: boolean;
    storage: boolean;
  }> {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      return {
        api: false,
        database: false,
        ai: false,
        storage: false,
      };
    }
  }

  /**
   * Clear all cached data and reset client
   */
  async clearCache(): Promise<void> {
    this.client.clearOfflineQueue();

    if (typeof window !== 'undefined') {
      // Clear all voice reading related localStorage items
      Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });

      // Clear guest preferences
      localStorage.removeItem('voice_reading_guest_preferences');
      localStorage.removeItem('voice_reading_last_sync');
    }
  }

  /**
   * Get API usage statistics
   */
  async getUsageStats(): Promise<{
    requests: {
      total: number;
      today: number;
      thisWeek: number;
    };
    storage: {
      used: number;
      limit: number;
      percentage: number;
    };
    ai: {
      requestsUsed: number;
      requestsLimit: number;
      percentage: number;
    };
  }> {
    const response = await this.client.get('/usage/stats');
    return response.data;
  }
}

// Create a default instance
export const api = new VoiceReadingAPI();

// Export individual service instances for convenience
export const authService = api.auth;
export const booksService = api.books;
export const notesService = api.notes;
export const aiService = api.ai;
export const syncService = api.sync;
export const preferencesService = api.preferences;
