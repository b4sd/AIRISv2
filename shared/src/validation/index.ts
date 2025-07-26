import { z } from "zod";

// User validation schemas
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  preferences: z.object({
    language: z.enum(["vi", "en"]),
    theme: z.enum(["light", "dark", "system"]),
    voice: z.object({
      rate: z.number().min(0.1).max(3),
      volume: z.number().min(0).max(1),
      pitch: z.number().min(0).max(2),
      voiceId: z.string().optional(),
    }),
    ai: z.object({
      summaryLength: z.enum(["short", "medium", "long"]),
      summaryStyle: z.enum(["bullet", "paragraph"]),
    }),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Book validation schemas
export const bookSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string().min(1, "Title is required"),
  author: z.string().optional(),
  format: z.enum(["pdf", "epub", "txt"]),
  fileUrl: z.string().url(),
  fileSize: z.number().positive().optional(),
  textContent: z.string().optional(),
  metadata: z.object({
    isbn: z.string().optional(),
    publisher: z.string().optional(),
    publishedDate: z.string().optional(),
    language: z.string(),
    pageCount: z.number().positive().optional(),
    description: z.string().optional(),
    coverImage: z.string().url().optional(),
    source: z.string().optional(),
    originalUrl: z.string().url().optional(),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const bookUploadSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().optional(),
  language: z.string().default("vi"),
});

// Note validation schemas
export const noteSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  bookId: z.string().uuid(),
  content: z.string().min(1, "Note content is required"),
  position: z
    .object({
      bookId: z.string().uuid(),
      chapter: z.number().optional(),
      page: z.number().optional(),
      position: z.number(),
      percentage: z.number().min(0).max(100),
      timestamp: z.date(),
    })
    .optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createNoteSchema = z.object({
  bookId: z.string().uuid(),
  content: z.string().min(1, "Note content is required"),
  position: z
    .object({
      chapter: z.number().optional(),
      page: z.number().optional(),
      position: z.number(),
      percentage: z.number().min(0).max(100),
    })
    .optional(),
});

// Reading position validation
export const readingPositionSchema = z.object({
  bookId: z.string().uuid(),
  chapter: z.number().optional(),
  page: z.number().optional(),
  position: z.number(),
  percentage: z.number().min(0).max(100),
  timestamp: z.date(),
});

// AI validation schemas
export const summaryOptionsSchema = z.object({
  language: z.enum(["vi", "en"]).default("vi"),
  length: z.enum(["short", "medium", "long"]).default("medium"),
  style: z.enum(["bullet", "paragraph"]).default("paragraph"),
});

export const summarizeRequestSchema = z.object({
  content: z.string().min(1, "Content is required"),
  options: summaryOptionsSchema.optional(),
});

// API response validation
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      details: z.any().optional(),
    })
    .optional(),
  meta: z
    .object({
      page: z.number().optional(),
      limit: z.number().optional(),
      total: z.number().optional(),
    })
    .optional(),
});

// Export types inferred from schemas
export type UserInput = z.infer<typeof userSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type BookInput = z.infer<typeof bookSchema>;
export type BookUploadInput = z.infer<typeof bookUploadSchema>;
export type NoteInput = z.infer<typeof noteSchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type ReadingPositionInput = z.infer<typeof readingPositionSchema>;
export type SummaryOptionsInput = z.infer<typeof summaryOptionsSchema>;
export type SummarizeRequestInput = z.infer<typeof summarizeRequestSchema>;
export type ApiResponseInput = z.infer<typeof apiResponseSchema>;
