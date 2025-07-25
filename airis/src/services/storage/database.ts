import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Book, Note, UserPreferences, SummaryResponse } from '@/types';

// Database schema definition
interface VoiceReadingDB extends DBSchema {
  books: {
    key: string;
    value: Book;
    indexes: {
      'by-title': string;
      'by-author': string;
      'by-created': Date;
    };
  };
  notes: {
    key: string;
    value: Note;
    indexes: {
      'by-book': string;
      'by-timestamp': Date;
      'by-content': string;
    };
  };
  preferences: {
    key: string;
    value: UserPreferences;
  };
  summaries: {
    key: string;
    value: SummaryResponse & { bookId: string; contentHash: string };
    indexes: {
      'by-book': string;
      'by-hash': string;
      'by-generated': Date;
    };
  };
  bookmarks: {
    key: string;
    value: {
      id: string;
      bookId: string;
      name: string;
      position: {
        page: number;
        chapter: string;
        characterOffset: number;
        percentage: number;
      };
      createdAt: Date;
    };
    indexes: {
      'by-book': string;
      'by-created': Date;
    };
  };
  onlineBooks: {
    key: string;
    value: {
      id: string;
      title: string;
      author: string;
      source: string;
      url: string;
      format: string;
      language: string;
      description?: string;
      coverImage?: string;
      downloadedAt?: Date;
      lastAccessed?: Date;
    };
    indexes: {
      'by-source': string;
      'by-title': string;
      'by-author': string;
    };
  };
}

class DatabaseManager {
  private db: IDBPDatabase<VoiceReadingDB> | null = null;
  private readonly dbName = 'VoiceReadingApp';
  private readonly version = 1;

  async initialize(): Promise<void> {
    if (this.db) return;

    this.db = await openDB<VoiceReadingDB>(this.dbName, this.version, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log(`Upgrading database from version ${oldVersion} to ${newVersion}`);

        // Books store
        if (!db.objectStoreNames.contains('books')) {
          const booksStore = db.createObjectStore('books', { keyPath: 'id' });
          booksStore.createIndex('by-title', 'title');
          booksStore.createIndex('by-author', 'author');
          booksStore.createIndex('by-created', 'createdAt');
        }

        // Notes store
        if (!db.objectStoreNames.contains('notes')) {
          const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
          notesStore.createIndex('by-book', 'bookId');
          notesStore.createIndex('by-timestamp', 'timestamp');
          notesStore.createIndex('by-content', 'content');
        }

        // Preferences store
        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences', { keyPath: 'id' });
        }

        // Summaries store
        if (!db.objectStoreNames.contains('summaries')) {
          const summariesStore = db.createObjectStore('summaries', { keyPath: 'id' });
          summariesStore.createIndex('by-book', 'bookId');
          summariesStore.createIndex('by-hash', 'contentHash');
          summariesStore.createIndex('by-generated', 'generatedAt');
        }

        // Bookmarks store
        if (!db.objectStoreNames.contains('bookmarks')) {
          const bookmarksStore = db.createObjectStore('bookmarks', { keyPath: 'id' });
          bookmarksStore.createIndex('by-book', 'bookId');
          bookmarksStore.createIndex('by-created', 'createdAt');
        }

        // Online books catalog store
        if (!db.objectStoreNames.contains('onlineBooks')) {
          const onlineBooksStore = db.createObjectStore('onlineBooks', { keyPath: 'id' });
          onlineBooksStore.createIndex('by-source', 'source');
          onlineBooksStore.createIndex('by-title', 'title');
          onlineBooksStore.createIndex('by-author', 'author');
        }
      },
      blocked() {
        console.warn('Database upgrade blocked. Please close other tabs.');
      },
      blocking() {
        console.warn('Database is blocking a newer version. Closing connection.');
        this.close();
      },
    });

    console.log('Database initialized successfully');
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  private ensureDB(): IDBPDatabase<VoiceReadingDB> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  // Books operations
  async saveBook(book: Book): Promise<void> {
    const db = this.ensureDB();
    await db.put('books', book);
  }

  async getBook(id: string): Promise<Book | null> {
    const db = this.ensureDB();
    const book = await db.get('books', id);
    return book || null;
  }

  async getAllBooks(): Promise<Book[]> {
    const db = this.ensureDB();
    return await db.getAll('books');
  }

  async searchBooks(query: string): Promise<Book[]> {
    const db = this.ensureDB();
    const books = await db.getAll('books');
    const searchTerm = query.toLowerCase();
    
    return books.filter(book => 
      book.title.toLowerCase().includes(searchTerm) ||
      book.author.toLowerCase().includes(searchTerm)
    );
  }

  async deleteBook(id: string): Promise<void> {
    const db = this.ensureDB();
    const tx = db.transaction(['books', 'notes', 'summaries', 'bookmarks'], 'readwrite');
    
    // Delete book and related data
    await Promise.all([
      tx.objectStore('books').delete(id),
      this.deleteNotesByBook(id, tx),
      this.deleteSummariesByBook(id, tx),
      this.deleteBookmarksByBook(id, tx),
    ]);
    
    await tx.done;
  }

  // Notes operations
  async saveNote(note: Note): Promise<void> {
    const db = this.ensureDB();
    await db.put('notes', note);
  }

  async getNote(id: string): Promise<Note | null> {
    const db = this.ensureDB();
    const note = await db.get('notes', id);
    return note || null;
  }

  async getNotesByBook(bookId: string): Promise<Note[]> {
    const db = this.ensureDB();
    return await db.getAllFromIndex('notes', 'by-book', bookId);
  }

  async searchNotes(query: string, bookId?: string): Promise<Note[]> {
    const db = this.ensureDB();
    const notes = bookId 
      ? await db.getAllFromIndex('notes', 'by-book', bookId)
      : await db.getAll('notes');
    
    const searchTerm = query.toLowerCase();
    return notes.filter(note => 
      note.content.toLowerCase().includes(searchTerm) ||
      note.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  async deleteNote(id: string): Promise<void> {
    const db = this.ensureDB();
    await db.delete('notes', id);
  }

  private async deleteNotesByBook(bookId: string, tx?: any): Promise<void> {
    const db = this.ensureDB();
    const transaction = tx || db.transaction('notes', 'readwrite');
    const notes = await transaction.objectStore('notes').index('by-book').getAllKeys(bookId);
    
    await Promise.all(notes.map(noteId => 
      transaction.objectStore('notes').delete(noteId)
    ));
  }

  // Preferences operations
  async savePreferences(preferences: UserPreferences): Promise<void> {
    const db = this.ensureDB();
    await db.put('preferences', { id: 'user', ...preferences });
  }

  async getPreferences(): Promise<UserPreferences | null> {
    const db = this.ensureDB();
    const prefs = await db.get('preferences', 'user');
    return prefs || null;
  }

  // Summaries operations
  async saveSummary(
    bookId: string, 
    contentHash: string, 
    summary: SummaryResponse
  ): Promise<void> {
    const db = this.ensureDB();
    await db.put('summaries', {
      id: `${bookId}-${contentHash}`,
      bookId,
      contentHash,
      ...summary,
    });
  }

  async getSummary(bookId: string, contentHash: string): Promise<SummaryResponse | null> {
    const db = this.ensureDB();
    const summary = await db.get('summaries', `${bookId}-${contentHash}`);
    return summary || null;
  }

  private async deleteSummariesByBook(bookId: string, tx?: any): Promise<void> {
    const db = this.ensureDB();
    const transaction = tx || db.transaction('summaries', 'readwrite');
    const summaries = await transaction.objectStore('summaries').index('by-book').getAllKeys(bookId);
    
    await Promise.all(summaries.map(summaryId => 
      transaction.objectStore('summaries').delete(summaryId)
    ));
  }

  // Bookmarks operations
  async saveBookmark(bookmark: {
    id: string;
    bookId: string;
    name: string;
    position: any;
    createdAt: Date;
  }): Promise<void> {
    const db = this.ensureDB();
    await db.put('bookmarks', bookmark);
  }

  async getBookmarksByBook(bookId: string): Promise<any[]> {
    const db = this.ensureDB();
    return await db.getAllFromIndex('bookmarks', 'by-book', bookId);
  }

  async deleteBookmark(id: string): Promise<void> {
    const db = this.ensureDB();
    await db.delete('bookmarks', id);
  }

  private async deleteBookmarksByBook(bookId: string, tx?: any): Promise<void> {
    const db = this.ensureDB();
    const transaction = tx || db.transaction('bookmarks', 'readwrite');
    const bookmarks = await transaction.objectStore('bookmarks').index('by-book').getAllKeys(bookId);
    
    await Promise.all(bookmarks.map(bookmarkId => 
      transaction.objectStore('bookmarks').delete(bookmarkId)
    ));
  }

  // Online books catalog operations
  async saveOnlineBookInfo(bookInfo: any): Promise<void> {
    const db = this.ensureDB();
    await db.put('onlineBooks', bookInfo);
  }

  async getOnlineBooks(source?: string): Promise<any[]> {
    const db = this.ensureDB();
    if (source) {
      return await db.getAllFromIndex('onlineBooks', 'by-source', source);
    }
    return await db.getAll('onlineBooks');
  }

  async searchOnlineBooks(query: string): Promise<any[]> {
    const db = this.ensureDB();
    const books = await db.getAll('onlineBooks');
    const searchTerm = query.toLowerCase();
    
    return books.filter(book => 
      book.title.toLowerCase().includes(searchTerm) ||
      book.author.toLowerCase().includes(searchTerm)
    );
  }

  // Database maintenance
  async clearCache(): Promise<void> {
    const db = this.ensureDB();
    const tx = db.transaction(['summaries'], 'readwrite');
    await tx.objectStore('summaries').clear();
    await tx.done;
  }

  async getStorageUsage(): Promise<{
    books: number;
    notes: number;
    summaries: number;
    total: number;
  }> {
    const db = this.ensureDB();
    const [books, notes, summaries] = await Promise.all([
      db.count('books'),
      db.count('notes'),
      db.count('summaries'),
    ]);

    return {
      books,
      notes,
      summaries,
      total: books + notes + summaries,
    };
  }
}

// Singleton instance
export const database = new DatabaseManager();

// Initialize database on module load
if (typeof window !== 'undefined') {
  database.initialize().catch(console.error);
}