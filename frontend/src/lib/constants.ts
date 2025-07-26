// Application constants
export const APP_NAME = 'Voice Reading App';
export const APP_VERSION = '1.0.0';

// Voice recognition constants
export const VOICE_LANGUAGES = {
  VIETNAMESE: 'vi-VN',
  ENGLISH: 'en-US',
} as const;

// Speech synthesis constants
export const DEFAULT_SPEECH_RATE = 1.0;
export const DEFAULT_SPEECH_VOLUME = 1.0;
export const MIN_SPEECH_RATE = 0.5;
export const MAX_SPEECH_RATE = 2.0;

// Storage constants
export const DB_NAME = 'VoiceReadingApp';
export const DB_VERSION = 1;

// File format constants
export const SUPPORTED_FORMATS = ['pdf', 'epub', 'txt'] as const;
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// AI service constants
export const SUMMARY_TYPES = ['page', 'chapter', 'book'] as const;
export const SUMMARY_LENGTHS = ['short', 'medium', 'long'] as const;
export const SUMMARY_STYLES = ['bullet', 'paragraph'] as const;
