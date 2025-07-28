import { z } from 'zod';

// Reading Position Schema
export const ReadingPositionSchema = z.object({
  page: z.number().min(1),
  chapter: z.string(),
  characterOffset: z.number().min(0),
  percentage: z.number().min(0).max(100),
});

export type ReadingPosition = z.infer<typeof ReadingPositionSchema>;

// Chapter Schema
export const ChapterSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  startPage: z.number().min(1),
  endPage: z.number().min(1),
});

export type Chapter = z.infer<typeof ChapterSchema>;

// Book Content Schema
export const BookContentSchema = z.object({
  chapters: z.array(ChapterSchema),
  totalPages: z.number().min(1),
  format: z.enum(['pdf', 'epub', 'txt']),
});

export type BookContent = z.infer<typeof BookContentSchema>;

// Book Metadata Schema
export const BookMetadataSchema = z.object({
  isbn: z.string().optional(),
  publisher: z.string().optional(),
  publishedDate: z.string().optional(),
  language: z.string().default('vi'),
  genre: z.string().optional(),
  description: z.string().optional(),
  coverImage: z.string().optional(),
  fileSize: z.number().min(0),
  wordCount: z.number().min(0).optional(),
});

export type BookMetadata = z.infer<typeof BookMetadataSchema>;

// Book Schema
export const BookSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  author: z.string().min(1),
  content: BookContentSchema,
  metadata: BookMetadataSchema,
  lastReadPosition: ReadingPositionSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Book = z.infer<typeof BookSchema>;

// Book Upload Schema
export const BookUploadSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  file: z.instanceof(File),
  format: z.enum(['pdf', 'epub', 'txt']),
});

export type BookUpload = z.infer<typeof BookUploadSchema>;