import { z } from 'zod';

// Command Intent Schema
export const CommandIntentSchema = z.object({
  action: z.string(),
  parameters: z.record(z.string(), z.any()),
  confidence: z.number().min(0).max(1),
  originalText: z.string(),
});

export type CommandIntent = z.infer<typeof CommandIntentSchema>;

// Voice Controller Interface
export interface VoiceController {
  startListening(): void;
  stopListening(): void;
  processCommand(command: string): Promise<void>;
  parseNaturalLanguage(text: string): Promise<CommandIntent>;
  isListening: boolean;
  confidence: number;
  language: string;
}

// Natural Language Processor Interface
export interface NaturalLanguageProcessor {
  parseVietnameseCommand(text: string): Promise<CommandIntent>;
  extractBookTitle(text: string): string | null;
  extractPageNumber(text: string): number | null;
  extractChapterReference(text: string): string | null;
  identifyAction(text: string): string;
  getConfidenceScore(text: string, intent: CommandIntent): number;
}

// Voice Recognition State Schema
export const VoiceRecognitionStateSchema = z.object({
  isListening: z.boolean(),
  isProcessing: z.boolean(),
  lastCommand: z.string().optional(),
  lastIntent: CommandIntentSchema.optional(),
  error: z.string().optional(),
  confidence: z.number().min(0).max(1).default(0),
});

export type VoiceRecognitionState = z.infer<typeof VoiceRecognitionStateSchema>;

// Speech Synthesis State Schema
export const SpeechSynthesisStateSchema = z.object({
  isReading: z.boolean(),
  isPaused: z.boolean(),
  currentText: z.string().optional(),
  currentPosition: z.number().default(0),
  rate: z.number().min(0.1).max(10).default(1),
  volume: z.number().min(0).max(1).default(1),
  voice: z.string().optional(),
});

export type SpeechSynthesisState = z.infer<typeof SpeechSynthesisStateSchema>;

// Voice Command Actions
export const VOICE_ACTIONS = {
  OPEN_BOOK: 'open_book',
  NAVIGATE_PAGE: 'navigate_page',
  NAVIGATE_CHAPTER: 'navigate_chapter',
  START_READING: 'start_reading',
  PAUSE_READING: 'pause_reading',
  RESUME_READING: 'resume_reading',
  ADJUST_SPEED: 'adjust_speed',
  CHANGE_VOICE: 'change_voice',
  TAKE_NOTE: 'take_note',
  SHOW_NOTES: 'show_notes',
  SEARCH_NOTES: 'search_notes',
  DELETE_NOTE: 'delete_note',
  SUMMARIZE_PAGE: 'summarize_page',
  SUMMARIZE_CHAPTER: 'summarize_chapter',
  SUMMARIZE_BOOK: 'summarize_book',
  SHOW_LIBRARY: 'show_library',
  ADD_BOOK: 'add_book',
  BOOKMARK_PAGE: 'bookmark_page',
  GO_TO_BOOKMARK: 'go_to_bookmark',
} as const;

export type VoiceAction = (typeof VOICE_ACTIONS)[keyof typeof VOICE_ACTIONS];
