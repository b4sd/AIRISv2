import { Book, Note, UserPreferences, StorageService, DEFAULT_PREFERENCES } from '@/types';
import { database } from './database';
import { generateId } from '@/lib/utils';
import { validateBook, validateNote, validateUserPreferences } from '@/lib/validation';

export class IndexedDBStorageService implements StorageService {
  private initialized = false;

  constructor() {
    // Don't initialize in constructor to avoid SSR issues
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized || typeof window === 'undefined') {
      return;
    }

    try {
      await database.initialize();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize storage service:', error);
      throw new Error('Storage service initialization failed');
    }
  }

  // Book operations
  async saveBook(book: Book): Promise<void> {
    await this.ensureInitialized();
    
    const validation = validateBook(book);
    if (!validation.success) {
      throw new Error(`Invalid book data: ${validation.error.message}`);
    }

    try {
      await database.saveBook(book);
    } catch (error) {
      console.error('Failed to save book:', error);
      throw new Error('Failed to save book to storage');
    }
  }

  async getBook(id: string): Promise<Book | null> {
    if (!id) {
      throw new Error('Book ID is required');
    }

    try {
      return await database.getBook(id);
    } catch (error) {
      console.error('Failed to get book:', error);
      throw new Error('Failed to retrieve book from storage');
    }
  }

  async getAllBooks(): Promise<Book[]> {
    try {
      return await database.getAllBooks();
    } catch (error) {
      console.error('Failed to get all books:', error);
      throw new Error('Failed to retrieve books from storage');
    }
  }

  async searchBooks(query: string): Promise<Book[]> {
    if (!query || query.trim().length === 0) {
      return this.getAllBooks();
    }

    try {
      return await database.searchBooks(query.trim());
    } catch (error) {
      console.error('Failed to search books:', error);
      throw new Error('Failed to search books in storage');
    }
  }

  async deleteBook(id: string): Promise<void> {
    if (!id) {
      throw new Error('Book ID is required');
    }

    try {
      await database.deleteBook(id);
    } catch (error) {
      console.error('Failed to delete book:', error);
      throw new Error('Failed to delete book from storage');
    }
  }

  // Note operations
  async saveNote(note: Note): Promise<void> {
    const validation = validateNote(note);
    if (!validation.success) {
      throw new Error(`Invalid note data: ${validation.error.message}`);
    }

    try {
      await database.saveNote(note);
    } catch (error) {
      console.error('Failed to save note:', error);
      throw new Error('Failed to save note to storage');
    }
  }

  async getNote(id: string): Promise<Note | null> {
    if (!id) {
      throw new Error('Note ID is required');
    }

    try {
      return await database.getNote(id);
    } catch (error) {
      console.error('Failed to get note:', error);
      throw new Error('Failed to retrieve note from storage');
    }
  }

  async getNotesByBook(bookId: string): Promise<Note[]> {
    if (!bookId) {
      throw new Error('Book ID is required');
    }

    try {
      return await database.getNotesByBook(bookId);
    } catch (error) {
      console.error('Failed to get notes by book:', error);
      throw new Error('Failed to retrieve notes from storage');
    }
  }

  async searchNotes(query: string, bookId?: string): Promise<Note[]> {
    if (!query || query.trim().length === 0) {
      return bookId ? this.getNotesByBook(bookId) : [];
    }

    try {
      return await database.searchNotes(query.trim(), bookId);
    } catch (error) {
      console.error('Failed to search notes:', error);
      throw new Error('Failed to search notes in storage');
    }
  }

  async deleteNote(id: string): Promise<void> {
    if (!id) {
      throw new Error('Note ID is required');
    }

    try {
      await database.deleteNote(id);
    } catch (error) {
      console.error('Failed to delete note:', error);
      throw new Error('Failed to delete note from storage');
    }
  }

  // Preferences operations
  async savePreferences(preferences: UserPreferences): Promise<void> {
    const validation = validateUserPreferences(preferences);
    if (!validation.success) {
      throw new Error(`Invalid preferences data: ${validation.error.message}`);
    }

    try {
      await database.savePreferences(preferences);
    } catch (error) {
      console.error('Failed to save preferences:', error);
      throw new Error('Failed to save preferences to storage');
    }
  }

  async getPreferences(): Promise<UserPreferences> {
    try {
      const preferences = await database.getPreferences();
      return preferences || DEFAULT_PREFERENCES;
    } catch (error) {
      console.error('Failed to get preferences:', error);
      return DEFAULT_PREFERENCES;
    }
  }

  // Bookmark operations
  async saveBookmark(
    bookId: string,
    name: string,
    position: any
  ): Promise<string> {
    if (!bookId || !name || !position) {
      throw new Error('Book ID, name, and position are required');
    }

    const bookmark = {
      id: generateId(),
      bookId,
      name: name.trim(),
      position,
      createdAt: new Date(),
    };

    try {
      await database.saveBookmark(bookmark);
      return bookmark.id;
    } catch (error) {
      console.error('Failed to save bookmark:', error);
      throw new Error('Failed to save bookmark to storage');
    }
  }

  async getBookmarks(bookId: string): Promise<any[]> {
    if (!bookId) {
      throw new Error('Book ID is required');
    }

    try {
      return await database.getBookmarksByBook(bookId);
    } catch (error) {
      console.error('Failed to get bookmarks:', error);
      throw new Error('Failed to retrieve bookmarks from storage');
    }
  }

  async deleteBookmark(id: string): Promise<void> {
    if (!id) {
      throw new Error('Bookmark ID is required');
    }

    try {
      await database.deleteBookmark(id);
    } catch (error) {
      console.error('Failed to delete bookmark:', error);
      throw new Error('Failed to delete bookmark from storage');
    }
  }

  // Summary caching
  async cacheSummary(
    bookId: string,
    contentHash: string,
    summary: any
  ): Promise<void> {
    if (!bookId || !contentHash || !summary) {
      throw new Error('Book ID, content hash, and summary are required');
    }

    try {
      await database.saveSummary(bookId, contentHash, summary);
    } catch (error) {
      console.error('Failed to cache summary:', error);
      // Don't throw error for caching failures
    }
  }

  async getCachedSummary(
    bookId: string,
    contentHash: string
  ): Promise<any | null> {
    if (!bookId || !contentHash) {
      return null;
    }

    try {
      return await database.getSummary(bookId, contentHash);
    } catch (error) {
      console.error('Failed to get cached summary:', error);
      return null;
    }
  }

  // Online books catalog
  async saveOnlineBookInfo(bookInfo: any): Promise<void> {
    try {
      await database.saveOnlineBookInfo(bookInfo);
    } catch (error) {
      console.error('Failed to save online book info:', error);
      throw new Error('Failed to save online book information');
    }
  }

  async getOnlineBooks(source?: string): Promise<any[]> {
    try {
      return await database.getOnlineBooks(source);
    } catch (error) {
      console.error('Failed to get online books:', error);
      return [];
    }
  }

  async searchOnlineBooks(query: string): Promise<any[]> {
    if (!query || query.trim().length === 0) {
      return this.getOnlineBooks();
    }

    try {
      return await database.searchOnlineBooks(query.trim());
    } catch (error) {
      console.error('Failed to search online books:', error);
      return [];
    }
  }

  // Storage management
  async clearCache(): Promise<void> {
    try {
      await database.clearCache();
    } catch (error) {
      console.error('Failed to clear cache:', error);
      throw new Error('Failed to clear storage cache');
    }
  }

  async getStorageInfo(): Promise<{
    usage: any;
    quota?: number;
    available?: number;
  }> {
    try {
      const usage = await database.getStorageUsage();
      
      // Get storage quota if available
      let quota, available;
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        quota = estimate.quota;
        available = estimate.quota ? estimate.quota - (estimate.usage || 0) : undefined;
      }

      return {
        usage,
        quota,
        available,
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      throw new Error('Failed to retrieve storage information');
    }
  }

  // Data export/import
  async exportData(): Promise<{
    books: Book[];
    notes: Note[];
    preferences: UserPreferences;
    exportedAt: Date;
  }> {
    try {
      const [books, notes, preferences] = await Promise.all([
        this.getAllBooks(),
        database.searchNotes(''), // Get all notes
        this.getPreferences(),
      ]);

      return {
        books,
        notes,
        preferences,
        exportedAt: new Date(),
      };
    } catch (error) {
      console.error('Failed to export data:', error);
      throw new Error('Failed to export storage data');
    }
  }

  async importData(data: {
    books?: Book[];
    notes?: Note[];
    preferences?: UserPreferences;
  }): Promise<void> {
    try {
      const promises: Promise<void>[] = [];

      if (data.books) {
        promises.push(
          ...data.books.map(book => this.saveBook(book))
        );
      }

      if (data.notes) {
        promises.push(
          ...data.notes.map(note => this.saveNote(note))
        );
      }

      if (data.preferences) {
        promises.push(this.savePreferences(data.preferences));
      }

      await Promise.all(promises);
    } catch (error) {
      console.error('Failed to import data:', error);
      throw new Error('Failed to import storage data');
    }
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    try {
      await database.getStorageUsage();
      return true;
    } catch (error) {
      console.error('Storage health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const storageService = new IndexedDBStorageService();