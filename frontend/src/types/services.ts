import { z } from 'zod';
import { Book, ReadingPosition } from './book';
import { Note } from './note';

// Reading Engine Interface
export interface ReadingEngine {
  loadBook(bookId: string): Promise<Book>;
  navigateToPage(pageNumber: number): void;
  navigateToChapter(chapterName: string): void;
  getCurrentPosition(): ReadingPosition;
  startReading(): void;
  pauseReading(): void;
  adjustSpeed(speed: number): void;
}

// Notes Manager Interface
export interface NotesManager {
  createNote(content: string, position: ReadingPosition): Promise<Note>;
  getNotes(bookId: string): Promise<Note[]>;
  searchNotes(query: string): Promise<Note[]>;
  deleteNote(noteId: string): Promise<void>;
  syncNotes(): Promise<void>;
}

// Summarization Service Interface
export interface SummarizationService {
  summarizeText(
    text: string,
    type: 'page' | 'chapter' | 'book',
    language?: 'vi' | 'en'
  ): Promise<string>;
  generateKeyPoints(text: string): Promise<string[]>;
  isAvailable(): boolean;
}

// Summary Request Schema
export const SummaryRequestSchema = z.object({
  text: z.string().min(1),
  type: z.enum(['page', 'chapter', 'book']),
  language: z.enum(['vi', 'en']).default('vi'),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
  style: z.enum(['bullet', 'paragraph']).default('paragraph'),
});

export type SummaryRequest = z.infer<typeof SummaryRequestSchema>;

// Summary Response Schema
export const SummaryResponseSchema = z.object({
  summary: z.string(),
  keyPoints: z.array(z.string()).optional(),
  wordCount: z.number(),
  confidence: z.number().min(0).max(1),
  generatedAt: z.date(),
});

export type SummaryResponse = z.infer<typeof SummaryResponseSchema>;

// Book Parser Interface
export interface BookParser {
  parseFile(file: File): Promise<Book>;
  extractText(file: File): Promise<string>;
  extractMetadata(file: File): Promise<any>;
  detectFormat(file: File): string;
}

// Storage Service Interface
export interface StorageService {
  saveBook(book: Book): Promise<void>;
  getBook(id: string): Promise<Book | null>;
  getAllBooks(): Promise<Book[]>;
  deleteBook(id: string): Promise<void>;
  saveNote(note: Note): Promise<void>;
  getNote(id: string): Promise<Note | null>;
  getNotesByBook(bookId: string): Promise<Note[]>;
  deleteNote(id: string): Promise<void>;
  searchNotes(query: string): Promise<Note[]>;
}

// Error Types
export const ServiceErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.any().optional(),
  timestamp: z.date().default(() => new Date()),
});

export type ServiceError = z.infer<typeof ServiceErrorSchema>;

// Service Status
export const ServiceStatusSchema = z.object({
  isOnline: z.boolean(),
  lastCheck: z.date(),
  error: ServiceErrorSchema.optional(),
});

export type ServiceStatus = z.infer<typeof ServiceStatusSchema>;