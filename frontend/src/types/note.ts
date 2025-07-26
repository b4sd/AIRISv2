import { z } from 'zod';
import { ReadingPositionSchema } from './book';

// Note Schema
export const NoteSchema = z.object({
  id: z.string(),
  bookId: z.string(),
  content: z.string().min(1),
  position: ReadingPositionSchema,
  timestamp: z.date(),
  tags: z.array(z.string()).default([]),
});

export type Note = z.infer<typeof NoteSchema>;

// Note Creation Schema
export const CreateNoteSchema = z.object({
  bookId: z.string(),
  content: z.string().min(1),
  position: ReadingPositionSchema,
  tags: z.array(z.string()).optional().default([]),
});

export type CreateNote = z.infer<typeof CreateNoteSchema>;

// Note Update Schema
export const UpdateNoteSchema = z.object({
  content: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
});

export type UpdateNote = z.infer<typeof UpdateNoteSchema>;

// Note Search Schema
export const NoteSearchSchema = z.object({
  bookId: z.string().optional(),
  query: z.string().optional(),
  tags: z.array(z.string()).optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
});

export type NoteSearch = z.infer<typeof NoteSearchSchema>;