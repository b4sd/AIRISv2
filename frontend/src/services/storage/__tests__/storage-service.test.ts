/**
 * @jest-environment jsdom
 */

import { IndexedDBStorageService } from '../storage-service';
import { Book, Note, DEFAULT_PREFERENCES } from '@/types';
import { generateId } from '@/lib/utils';

// Mock IndexedDB
const mockIDB = {
  open: jest.fn(),
  deleteDatabase: jest.fn(),
};

// Mock database
const mockDatabase = {
  initialize: jest.fn(),
  saveBook: jest.fn(),
  getBook: jest.fn(),
  getAllBooks: jest.fn(),
  searchBooks: jest.fn(),
  deleteBook: jest.fn(),
  saveNote: jest.fn(),
  getNote: jest.fn(),
  getNotesByBook: jest.fn(),
  searchNotes: jest.fn(),
  deleteNote: jest.fn(),
  savePreferences: jest.fn(),
  getPreferences: jest.fn(),
  getStorageUsage: jest.fn(),
};

jest.mock('../database', () => ({
  database: mockDatabase,
}));

describe('IndexedDBStorageService', () => {
  let storageService: IndexedDBStorageService;
  let mockBook: Book;
  let mockNote: Note;

  beforeEach(() => {
    jest.clearAllMocks();
    storageService = new IndexedDBStorageService();
    
    mockBook = {
      id: generateId(),
      title: 'Test Book',
      author: 'Test Author',
      content: {
        chapters: [{
          id: generateId(),
          title: 'Chapter 1',
          content: 'Test content',
          startPage: 1,
          endPage: 1,
        }],
        totalPages: 1,
        format: 'txt',
      },
      metadata: {
        language: 'vi',
        fileSize: 1000,
        wordCount: 100,
      },
      lastReadPosition: {
        page: 1,
        chapter: 'Chapter 1',
        characterOffset: 0,
        percentage: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockNote = {
      id: generateId(),
      bookId: mockBook.id,
      content: 'Test note content',
      position: mockBook.lastReadPosition,
      timestamp: new Date(),
      tags: ['test'],
    };
  });

  describe('Book operations', () => {
    it('should save a book successfully', async () => {
      mockDatabase.saveBook.mockResolvedValue(undefined);

      await expect(storageService.saveBook(mockBook)).resolves.toBeUndefined();
      expect(mockDatabase.saveBook).toHaveBeenCalledWith(mockBook);
    });

    it('should throw error for invalid book data', async () => {
      const invalidBook = { ...mockBook, title: '' };

      await expect(storageService.saveBook(invalidBook as Book))
        .rejects.toThrow('Invalid book data');
    });

    it('should get a book by ID', async () => {
      mockDatabase.getBook.mockResolvedValue(mockBook);

      const result = await storageService.getBook(mockBook.id);
      expect(result).toEqual(mockBook);
      expect(mockDatabase.getBook).toHaveBeenCalledWith(mockBook.id);
    });

    it('should return null for non-existent book', async () => {
      mockDatabase.getBook.mockResolvedValue(null);

      const result = await storageService.getBook('non-existent');
      expect(result).toBeNull();
    });

    it('should get all books', async () => {
      const books = [mockBook];
      mockDatabase.getAllBooks.mockResolvedValue(books);

      const result = await storageService.getAllBooks();
      expect(result).toEqual(books);
      expect(mockDatabase.getAllBooks).toHaveBeenCalled();
    });

    it('should search books', async () => {
      const books = [mockBook];
      mockDatabase.searchBooks.mockResolvedValue(books);

      const result = await storageService.searchBooks('test');
      expect(result).toEqual(books);
      expect(mockDatabase.searchBooks).toHaveBeenCalledWith('test');
    });

    it('should delete a book', async () => {
      mockDatabase.deleteBook.mockResolvedValue(undefined);

      await expect(storageService.deleteBook(mockBook.id)).resolves.toBeUndefined();
      expect(mockDatabase.deleteBook).toHaveBeenCalledWith(mockBook.id);
    });
  });

  describe('Note operations', () => {
    it('should save a note successfully', async () => {
      mockDatabase.saveNote.mockResolvedValue(undefined);

      await expect(storageService.saveNote(mockNote)).resolves.toBeUndefined();
      expect(mockDatabase.saveNote).toHaveBeenCalledWith(mockNote);
    });

    it('should throw error for invalid note data', async () => {
      const invalidNote = { ...mockNote, content: '' };

      await expect(storageService.saveNote(invalidNote as Note))
        .rejects.toThrow('Invalid note data');
    });

    it('should get notes by book ID', async () => {
      const notes = [mockNote];
      mockDatabase.getNotesByBook.mockResolvedValue(notes);

      const result = await storageService.getNotesByBook(mockBook.id);
      expect(result).toEqual(notes);
      expect(mockDatabase.getNotesByBook).toHaveBeenCalledWith(mockBook.id);
    });

    it('should search notes', async () => {
      const notes = [mockNote];
      mockDatabase.searchNotes.mockResolvedValue(notes);

      const result = await storageService.searchNotes('test', mockBook.id);
      expect(result).toEqual(notes);
      expect(mockDatabase.searchNotes).toHaveBeenCalledWith('test', mockBook.id);
    });

    it('should delete a note', async () => {
      mockDatabase.deleteNote.mockResolvedValue(undefined);

      await expect(storageService.deleteNote(mockNote.id)).resolves.toBeUndefined();
      expect(mockDatabase.deleteNote).toHaveBeenCalledWith(mockNote.id);
    });
  });

  describe('Preferences operations', () => {
    it('should save preferences', async () => {
      mockDatabase.savePreferences.mockResolvedValue(undefined);

      await expect(storageService.savePreferences(DEFAULT_PREFERENCES))
        .resolves.toBeUndefined();
      expect(mockDatabase.savePreferences).toHaveBeenCalledWith(DEFAULT_PREFERENCES);
    });

    it('should get preferences with defaults', async () => {
      mockDatabase.getPreferences.mockResolvedValue(null);

      const result = await storageService.getPreferences();
      expect(result).toEqual(DEFAULT_PREFERENCES);
    });

    it('should get saved preferences', async () => {
      const savedPrefs = { ...DEFAULT_PREFERENCES, lastUpdated: new Date() };
      mockDatabase.getPreferences.mockResolvedValue(savedPrefs);

      const result = await storageService.getPreferences();
      expect(result).toEqual(savedPrefs);
    });
  });

  describe('Storage management', () => {
    it('should get storage info', async () => {
      const mockUsage = { books: 5, notes: 10, summaries: 2, total: 17 };
      mockDatabase.getStorageUsage.mockResolvedValue(mockUsage);

      // Mock navigator.storage.estimate
      Object.defineProperty(navigator, 'storage', {
        value: {
          estimate: jest.fn().mockResolvedValue({
            quota: 1000000,
            usage: 500000,
          }),
        },
        configurable: true,
      });

      const result = await storageService.getStorageInfo();
      expect(result.usage).toEqual(mockUsage);
      expect(result.quota).toBe(1000000);
      expect(result.available).toBe(500000);
    });

    it('should check health status', async () => {
      mockDatabase.getStorageUsage.mockResolvedValue({});

      const result = await storageService.isHealthy();
      expect(result).toBe(true);
    });

    it('should return false for unhealthy storage', async () => {
      mockDatabase.getStorageUsage.mockRejectedValue(new Error('DB error'));

      const result = await storageService.isHealthy();
      expect(result).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockDatabase.saveBook.mockRejectedValue(new Error('DB error'));

      await expect(storageService.saveBook(mockBook))
        .rejects.toThrow('Failed to save book to storage');
    });

    it('should validate required parameters', async () => {
      await expect(storageService.getBook(''))
        .rejects.toThrow('Book ID is required');

      await expect(storageService.deleteNote(''))
        .rejects.toThrow('Note ID is required');
    });
  });
});