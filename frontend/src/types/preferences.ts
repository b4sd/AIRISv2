import { z } from 'zod';

// Voice Settings Schema
export const VoiceSettingsSchema = z.object({
  recognitionLanguage: z.string().default('vi-VN'),
  speechRate: z.number().min(0.1).max(10).default(1.0),
  speechVoice: z.string().optional(),
  volume: z.number().min(0).max(1).default(1.0),
  nlpSensitivity: z.number().min(0).max(1).default(0.7),
});

export type VoiceSettings = z.infer<typeof VoiceSettingsSchema>;

// Reading Settings Schema
export const ReadingSettingsSchema = z.object({
  fontSize: z.number().min(12).max(32).default(16),
  theme: z.enum(['light', 'dark']).default('light'),
  autoBookmark: z.boolean().default(true),
  lineHeight: z.number().min(1).max(3).default(1.5),
  fontFamily: z.string().default('system-ui'),
});

export type ReadingSettings = z.infer<typeof ReadingSettingsSchema>;

// AI Settings Schema
export const AISettingsSchema = z.object({
  summaryLength: z.enum(['short', 'medium', 'long']).default('medium'),
  summaryStyle: z.enum(['bullet', 'paragraph']).default('paragraph'),
  summaryLanguage: z.enum(['vi', 'en']).default('vi'),
  enableAutoSummary: z.boolean().default(false),
  maxTokens: z.number().min(100).max(4000).default(1000),
});

export type AISettings = z.infer<typeof AISettingsSchema>;

// User Preferences Schema
export const UserPreferencesSchema = z.object({
  voiceSettings: VoiceSettingsSchema,
  readingSettings: ReadingSettingsSchema,
  aiSettings: AISettingsSchema,
  lastUpdated: z.date().default(() => new Date()),
});

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

// Default preferences
export const DEFAULT_PREFERENCES: UserPreferences = {
  voiceSettings: {
    recognitionLanguage: 'vi-VN',
    speechRate: 1.0,
    volume: 1.0,
    nlpSensitivity: 0.7,
  },
  readingSettings: {
    fontSize: 16,
    theme: 'light',
    autoBookmark: true,
    lineHeight: 1.5,
    fontFamily: 'system-ui',
  },
  aiSettings: {
    summaryLength: 'medium',
    summaryStyle: 'paragraph',
    summaryLanguage: 'vi',
    enableAutoSummary: false,
    maxTokens: 1000,
  },
  lastUpdated: new Date(),
};