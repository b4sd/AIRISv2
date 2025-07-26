import { z } from 'zod';
import {
  BookSchema,
  NoteSchema,
  UserPreferencesSchema,
  CommandIntentSchema,
  SummaryRequestSchema,
} from '@/types';

// Validation helper functions
export function validateBook(data: unknown) {
  return BookSchema.safeParse(data);
}

export function validateNote(data: unknown) {
  return NoteSchema.safeParse(data);
}

export function validateUserPreferences(data: unknown) {
  return UserPreferencesSchema.safeParse(data);
}

export function validateCommandIntent(data: unknown) {
  return CommandIntentSchema.safeParse(data);
}

export function validateSummaryRequest(data: unknown) {
  return SummaryRequestSchema.safeParse(data);
}

// File validation
export const FileValidationSchema = z.object({
  name: z.string().min(1),
  size: z.number().min(1).max(50 * 1024 * 1024), // 50MB max
  type: z.string().refine(
    (type) => 
      type === 'application/pdf' || 
      type === 'application/epub+zip' || 
      type === 'text/plain',
    'Unsupported file type'
  ),
});

export function validateFile(file: File) {
  return FileValidationSchema.safeParse({
    name: file.name,
    size: file.size,
    type: file.type,
  });
}

// Voice command validation
export const VoiceCommandSchema = z.object({
  text: z.string().min(1),
  confidence: z.number().min(0).max(1),
  language: z.string().default('vi-VN'),
});

export function validateVoiceCommand(data: unknown) {
  return VoiceCommandSchema.safeParse(data);
}

// Reading position validation
export function validateReadingPosition(page: number, totalPages: number) {
  return page >= 1 && page <= totalPages;
}

// Text content validation
export function validateTextContent(text: string, minLength = 1, maxLength = 10000) {
  return text.length >= minLength && text.length <= maxLength;
}

// URL validation for external resources
export const UrlSchema = z.string().url();

export function validateUrl(url: string) {
  return UrlSchema.safeParse(url);
}

// Date range validation
export function validateDateRange(startDate: Date, endDate: Date) {
  return startDate <= endDate;
}

// Language code validation
export const LanguageCodeSchema = z.enum(['vi', 'en', 'vi-VN', 'en-US']);

export function validateLanguageCode(code: string) {
  return LanguageCodeSchema.safeParse(code);
}