/**
 * TypeScript interfaces for Text-to-Speech functionality
 * Supports Vietnamese language and accessibility features
 */

export interface TTSVoice {
  id: string;
  name: string;
  lang: string;
  localService: boolean;
  default: boolean;
}

export interface TTSSettings {
  rate: number; // 0.1 to 10
  pitch: number; // 0 to 2
  volume: number; // 0 to 1
  voice: string; // voice ID
  language: string; // 'vi-VN' or 'en-US'
}

export interface ReadingPosition {
  page: number;
  chapter: string;
  characterOffset: number;
  percentage: number;
  timestamp: Date;
}

export interface ReadingState {
  isReading: boolean;
  isPaused: boolean;
  currentText: string;
  position: ReadingPosition;
  totalDuration: number;
  currentTime: number;
}

export interface TTSEvent {
  type: 'start' | 'end' | 'pause' | 'resume' | 'boundary' | 'error';
  data?: any;
  timestamp: Date;
}

export interface TTSKeyboardShortcuts {
  toggleReading: string; // Default: 'Ctrl+R'
  pauseReading: string; // Default: 'Ctrl+P'
  stopReading: string; // Default: 'Ctrl+S'
  increaseSpeed: string; // Default: 'Ctrl+ArrowUp'
  decreaseSpeed: string; // Default: 'Ctrl+ArrowDown'
  toggleVoiceRecognition: string; // Default: 'Ctrl+V'
}

export interface AudioFeedbackSettings {
  enabled: boolean;
  volume: number; // 0 to 1
  successSound: boolean;
  errorSound: boolean;
  statusSound: boolean;
}
