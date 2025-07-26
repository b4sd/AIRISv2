// Export all storage-related services and utilities
import { database } from './database';
export { database };
export { storageService, IndexedDBStorageService } from './storage-service';
export {
  onlineBooksManager,
  OnlineBooksManager,
  ProjectGutenbergSource,
  VietnameseWikisourceSource,
} from './online-books';

export type { OnlineBookSource, OnlineBookResult } from './online-books';

// Storage utilities
export const StorageUtils = {
  // Check if storage is available
  isStorageAvailable(): boolean {
    try {
      return typeof window !== 'undefined' && 'indexedDB' in window;
    } catch {
      return false;
    }
  },

  // Get storage quota information
  async getStorageQuota(): Promise<{
    quota?: number;
    usage?: number;
    available?: number;
  }> {
    if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
      return {};
    }

    try {
      const estimate = await navigator.storage.estimate();
      return {
        quota: estimate.quota,
        usage: estimate.usage,
        available:
          estimate.quota && estimate.usage
            ? estimate.quota - estimate.usage
            : undefined,
      };
    } catch (error) {
      console.error('Failed to get storage quota:', error);
      return {};
    }
  },

  // Format storage size
  formatStorageSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Check if storage is nearly full
  isStorageNearlyFull(usage: number, quota: number, threshold = 0.9): boolean {
    return usage / quota > threshold;
  },

  // Clear old cached data
  async clearOldCache(olderThanDays = 30): Promise<void> {
    try {
      await database.initialize();

      // This would need to be implemented in the database class
      // For now, just clear all summaries cache
      await database.clearCache();
    } catch (error) {
      console.error('Failed to clear old cache:', error);
    }
  },
};

// Storage events
export class StorageEventEmitter extends EventTarget {
  emit(eventType: string, data?: any) {
    this.dispatchEvent(new CustomEvent(eventType, { detail: data }));
  }

  on(eventType: string, callback: (event: CustomEvent) => void) {
    this.addEventListener(eventType, callback as EventListener);
  }

  off(eventType: string, callback: (event: CustomEvent) => void) {
    this.removeEventListener(eventType, callback as EventListener);
  }
}

export const storageEvents = new StorageEventEmitter();

// Storage event types
export const STORAGE_EVENTS = {
  BOOK_ADDED: 'book-added',
  BOOK_UPDATED: 'book-updated',
  BOOK_DELETED: 'book-deleted',
  NOTE_ADDED: 'note-added',
  NOTE_UPDATED: 'note-updated',
  NOTE_DELETED: 'note-deleted',
  PREFERENCES_UPDATED: 'preferences-updated',
  STORAGE_QUOTA_WARNING: 'storage-quota-warning',
  STORAGE_ERROR: 'storage-error',
} as const;
