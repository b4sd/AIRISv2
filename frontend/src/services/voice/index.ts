// Export all voice services
export {
  SpeechRecognitionService,
  speechRecognition,
} from './speech-recognition';
export {
  VoiceCommandDispatcher,
  commandDispatcher,
} from './command-dispatcher';
export { TextToSpeechService, textToSpeech } from './text-to-speech';

// Voice service utilities
export const VoiceUtils = {
  // Check if speech recognition is supported
  isSpeechRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
  },

  // Check if speech synthesis is supported
  isSpeechSynthesisSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'speechSynthesis' in window;
  },

  // Get available voices for speech synthesis
  getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.isSpeechSynthesisSupported()) return [];
    return speechSynthesis.getVoices();
  },

  // Get Vietnamese voices specifically
  getVietnameseVoices(): SpeechSynthesisVoice[] {
    return this.getAvailableVoices().filter(
      (voice) => voice.lang.startsWith('vi') || voice.lang.includes('VN')
    );
  },

  // Request microphone permission
  async requestMicrophonePermission(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately as we just needed permission
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      return false;
    }
  },

  // Announce message to screen readers
  announceToScreenReader(
    message: string,
    priority: 'polite' | 'assertive' = 'polite'
  ): void {
    if (typeof document === 'undefined') return;

    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  },

  // Format confidence percentage
  formatConfidence(confidence: number): string {
    return `${Math.round(confidence * 100)}%`;
  },

  // Normalize Vietnamese text for better recognition
  normalizeVietnameseText(text: string): string {
    return (
      text
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')
        // Remove common filler words
        .replace(/\b(ừm|à|ờ|thì|này|đó|kia)\b/g, '')
        .trim()
    );
  },

  // Extract numbers from Vietnamese text
  extractVietnameseNumbers(text: string): number[] {
    const numbers: number[] = [];
    const vietnameseNumbers = {
      không: 0,
      một: 1,
      hai: 2,
      ba: 3,
      bốn: 4,
      năm: 5,
      sáu: 6,
      bảy: 7,
      tám: 8,
      chín: 9,
      mười: 10,
      'mười một': 11,
      'mười hai': 12,
      'mười ba': 13,
      'mười bốn': 14,
      'mười lăm': 15,
      'mười sáu': 16,
      'mười bảy': 17,
      'mười tám': 18,
      'mười chín': 19,
      'hai mười': 20,
    };

    // Extract digit numbers
    const digitMatches = text.match(/\d+/g);
    if (digitMatches) {
      numbers.push(...digitMatches.map(Number));
    }

    // Extract Vietnamese number words
    Object.entries(vietnameseNumbers).forEach(([word, value]) => {
      if (text.includes(word)) {
        numbers.push(value);
      }
    });

    return numbers;
  },

  // Check if browser supports Vietnamese speech recognition
  supportsVietnamese(): boolean {
    // This is a heuristic check - actual support may vary
    const userAgent = navigator.userAgent.toLowerCase();
    return (
      userAgent.includes('chrome') ||
      userAgent.includes('edge') ||
      userAgent.includes('safari')
    );
  },

  // Get browser-specific voice recognition tips
  getBrowserTips(): string {
    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes('chrome')) {
      return 'Chrome hỗ trợ tốt nhận dạng tiếng Việt. Đảm bảo kết nối internet ổn định.';
    } else if (userAgent.includes('edge')) {
      return 'Microsoft Edge hỗ trợ nhận dạng tiếng Việt. Kiểm tra cài đặt ngôn ngữ trong Windows.';
    } else if (userAgent.includes('safari')) {
      return 'Safari hỗ trợ nhận dạng giọng nói. Đảm bảo đã bật Siri trong cài đặt hệ thống.';
    } else if (userAgent.includes('firefox')) {
      return 'Firefox chưa hỗ trợ Web Speech API. Vui lòng sử dụng Chrome, Edge, hoặc Safari.';
    } else {
      return 'Để có trải nghiệm tốt nhất, vui lòng sử dụng Chrome, Edge, hoặc Safari.';
    }
  },
};

// Voice command patterns for Vietnamese
export const VIETNAMESE_COMMAND_PATTERNS = {
  // Book commands
  OPEN_BOOK: [/^(mở|đọc|xem)\s+(sách|cuốn)\s*(.+)$/i, /^(mở|đọc)\s*(.+)$/i],

  // Navigation commands
  NEXT_PAGE: [/^(trang|sang)\s+(tiếp theo|sau)$/i, /^(tiếp theo|next)$/i],

  PREVIOUS_PAGE: [/^(trang|về)\s+(trước|trước đó)$/i, /^(quay lại|back)$/i],

  // Reading commands
  START_READING: [
    /^(đọc|bắt đầu đọc)\s*(to|lớn|cho tôi nghe)?$/i,
    /^(đọc to)$/i,
  ],

  PAUSE_READING: [/^(dừng|tạm dừng|ngừng)\s*(đọc)?$/i, /^(pause|stop)$/i],

  // Note commands
  TAKE_NOTE: [/^(ghi chú|note|viết|lưu)\s*:?\s*(.+)$/i, /^(note)\s*(.+)$/i],

  // Summary commands
  SUMMARIZE: [/^(tóm tắt|tổng kết)\s*(trang|chương|sách)?$/i, /^(summary)$/i],
};

// Accessibility constants
export const ACCESSIBILITY_CONSTANTS = {
  // ARIA live region priorities
  LIVE_POLITE: 'polite',
  LIVE_ASSERTIVE: 'assertive',

  // Screen reader announcements
  VOICE_READY: 'Hệ thống nhận dạng giọng nói đã sẵn sàng',
  LISTENING_START: 'Bắt đầu nghe lệnh',
  LISTENING_STOP: 'Dừng nghe lệnh',
  COMMAND_RECOGNIZED: 'Đã nhận dạng lệnh',
  COMMAND_EXECUTED: 'Đã thực hiện lệnh',
  ERROR_OCCURRED: 'Đã xảy ra lỗi',

  // Keyboard shortcuts
  SHORTCUTS: {
    TOGGLE_LISTENING: 'Space',
    STOP_LISTENING: 'Escape',
    SHOW_HELP: 'Ctrl+H',
    FOCUS_MAIN: 'Ctrl+M',
  },
};
