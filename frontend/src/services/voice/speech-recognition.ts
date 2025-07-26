'use client';

import { VoiceController, CommandIntent } from '@/types';

export class SpeechRecognitionService implements VoiceController {
  private recognition: any | null = null;
  private isInitialized = false;
  public isListening = false;
  public confidence = 0;
  public language = 'vi-VN';

  // Callbacks for UI updates
  private onStateChange?: (state: {
    isListening: boolean;
    confidence: number;
    error?: string;
  }) => void;
  private onCommand?: (command: string, intent?: CommandIntent) => void;
  private onError?: (error: string) => void;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (typeof window === 'undefined') return;

    // Check if speech recognition is supported
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error('Speech recognition not supported in this browser');
      this.onError?.(
        'Trình duyệt không hỗ trợ nhận dạng giọng nói. Vui lòng sử dụng Chrome, Edge, hoặc Safari.'
      );
      return;
    }

    this.recognition = new SpeechRecognition();
    this.setupRecognition();
    this.isInitialized = true;

    // Announce that voice recognition is ready
    this.announceToScreenReader(
      'Hệ thống nhận dạng giọng nói đã sẵn sàng. Nhấn phím Space để bắt đầu nghe.'
    );
  }

  private setupRecognition(): void {
    if (!this.recognition) return;

    // Configure recognition settings
    this.recognition.continuous = false; // Stop after one command
    this.recognition.interimResults = true; // Show interim results
    this.recognition.lang = this.language;
    this.recognition.maxAlternatives = 3; // Get multiple alternatives

    // Event handlers
    this.recognition.onstart = () => {
      this.isListening = true;
      this.confidence = 0;
      this.onStateChange?.({ isListening: true, confidence: 0 });
      this.announceToScreenReader('Đang nghe. Hãy nói lệnh của bạn.');
    };

    this.recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += transcript;
          this.confidence = result[0].confidence;
        } else {
          interimTranscript += transcript;
        }
      }

      // Update UI with interim results
      if (interimTranscript) {
        this.onStateChange?.({
          isListening: true,
          confidence: this.confidence,
        });
      }

      // Process final result
      if (finalTranscript) {
        this.processCommand(finalTranscript.trim());
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      this.isListening = false;

      let errorMessage = 'Đã xảy ra lỗi khi nhận dạng giọng nói.';

      switch (event.error) {
        case 'no-speech':
          errorMessage = 'Không nghe thấy giọng nói. Vui lòng thử lại.';
          break;
        case 'audio-capture':
          errorMessage =
            'Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.';
          break;
        case 'not-allowed':
          errorMessage =
            'Quyền truy cập microphone bị từ chối. Vui lòng cho phép truy cập microphone.';
          break;
        case 'network':
          errorMessage =
            'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.';
          break;
        case 'language-not-supported':
          errorMessage =
            'Ngôn ngữ tiếng Việt không được hỗ trợ trên thiết bị này.';
          break;
      }

      this.onStateChange?.({
        isListening: false,
        confidence: 0,
        error: errorMessage,
      });
      this.onError?.(errorMessage);
      this.announceToScreenReader(errorMessage);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.onStateChange?.({ isListening: false, confidence: this.confidence });

      if (this.confidence > 0) {
        this.announceToScreenReader(
          `Đã nhận dạng lệnh với độ tin cậy ${Math.round(this.confidence * 100)}%.`
        );
      }
    };
  }

  public startListening(): void {
    if (!this.isInitialized || !this.recognition) {
      this.onError?.('Hệ thống nhận dạng giọng nói chưa sẵn sàng.');
      return;
    }

    if (this.isListening) {
      this.stopListening();
      return;
    }

    try {
      this.recognition.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      this.onError?.(
        'Không thể bắt đầu nhận dạng giọng nói. Vui lòng thử lại.'
      );
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  public async processCommand(command: string): Promise<void> {
    if (!command.trim()) return;

    try {
      // Parse the natural language command
      const intent = await this.parseNaturalLanguage(command);

      // Announce the recognized command
      this.announceToScreenReader(`Đã nhận dạng lệnh: ${command}`);

      // Notify listeners
      this.onCommand?.(command, intent);
    } catch (error) {
      console.error('Failed to process command:', error);
      this.onError?.('Không thể xử lý lệnh. Vui lòng thử lại.');
    }
  }

  public async parseNaturalLanguage(text: string): Promise<CommandIntent> {
    const normalizedText = text.toLowerCase().trim();

    // Define Vietnamese command patterns
    const patterns = [
      // Navigation commands
      {
        pattern: /^(mở|đọc|xem)\s+(sách|cuốn)\s*(.+)$/i,
        action: 'open_book',
        extract: 3,
      },
      {
        pattern: /^(chuyển|đi|tới)\s+(trang|trang số)\s*(\d+)$/i,
        action: 'navigate_page',
        extract: 3,
      },
      {
        pattern: /^(chuyển|đi|tới)\s+(chương|chương số)\s*(\d+)$/i,
        action: 'navigate_chapter',
        extract: 3,
      },
      { pattern: /^(trang|sang)\s+(tiếp theo|sau)$/i, action: 'next_page' },
      { pattern: /^(trang|về)\s+(trước|trước đó)$/i, action: 'previous_page' },

      // Reading commands
      {
        pattern: /^(đọc|bắt đầu đọc)\s*(to|lớn|cho tôi nghe)?$/i,
        action: 'start_reading',
      },
      { pattern: /^(dừng|tạm dừng|ngừng)\s*(đọc)?$/i, action: 'pause_reading' },
      { pattern: /^(tiếp tục|đọc tiếp)$/i, action: 'resume_reading' },
      {
        pattern: /^(đọc|nói)\s*(nhanh|chậm)\s*(hơn|lên|xuống)?$/i,
        action: 'adjust_speed',
      },
      { pattern: /^(thay đổi|đổi)\s*(giọng|voice)$/i, action: 'change_voice' },

      // Note commands
      {
        pattern: /^(ghi chú|note|viết|lưu)\s*:?\s*(.+)$/i,
        action: 'take_note',
        extract: 2,
      },
      {
        pattern: /^(xem|hiện|hiển thị)\s*(ghi chú|note)$/i,
        action: 'show_notes',
      },
      {
        pattern: /^(tìm|tìm kiếm)\s*(ghi chú|note)\s*(.+)$/i,
        action: 'search_notes',
        extract: 3,
      },
      {
        pattern: /^(xóa|xoá)\s*(ghi chú|note)\s*(cuối|gần nhất)$/i,
        action: 'delete_last_note',
      },

      // Summary commands
      {
        pattern: /^(tóm tắt|tổng kết)\s*(trang|trang này)$/i,
        action: 'summarize_page',
      },
      {
        pattern: /^(tóm tắt|tổng kết)\s*(chương|chương này)$/i,
        action: 'summarize_chapter',
      },
      {
        pattern: /^(tóm tắt|tổng kết)\s*(sách|cuốn sách|toàn bộ)$/i,
        action: 'summarize_book',
      },
      {
        pattern: /^(đọc|nghe)\s*(tóm tắt|bản tóm tắt)$/i,
        action: 'read_summary',
      },

      // Library commands
      {
        pattern: /^(xem|hiện|hiển thị)\s*(thư viện|sách)$/i,
        action: 'show_library',
      },
      { pattern: /^(thêm|tải|upload)\s*(sách|tệp)$/i, action: 'add_book' },
      {
        pattern: /^(đánh dấu|bookmark)\s*(trang|trang này)$/i,
        action: 'bookmark_page',
      },
      {
        pattern: /^(đi|tới|chuyển)\s*(bookmark|đánh dấu)$/i,
        action: 'go_to_bookmark',
      },

      // Help commands
      { pattern: /^(trợ giúp|help|hướng dẫn)$/i, action: 'show_help' },
      { pattern: /^(lệnh|commands|danh sách lệnh)$/i, action: 'list_commands' },
    ];

    // Try to match patterns
    for (const { pattern, action, extract } of patterns) {
      const match = normalizedText.match(pattern);
      if (match) {
        const parameters: Record<string, any> = {};

        if (extract && match[extract]) {
          switch (action) {
            case 'open_book':
              parameters.bookTitle = match[extract].trim();
              break;
            case 'navigate_page':
              parameters.pageNumber = parseInt(match[extract]);
              break;
            case 'navigate_chapter':
              parameters.chapterNumber = parseInt(match[extract]);
              break;
            case 'take_note':
              parameters.content = match[extract].trim();
              break;
            case 'search_notes':
              parameters.query = match[extract].trim();
              break;
            case 'adjust_speed':
              parameters.direction = match[1].includes('nhanh')
                ? 'faster'
                : 'slower';
              break;
          }
        }

        return {
          action,
          parameters,
          confidence: 0.9, // High confidence for pattern matches
          originalText: text,
        };
      }
    }

    // If no pattern matches, return a generic intent
    return {
      action: 'unknown',
      parameters: { text: normalizedText },
      confidence: 0.1,
      originalText: text,
    };
  }

  // Event listeners for UI integration
  public onStateChanged(
    callback: (state: {
      isListening: boolean;
      confidence: number;
      error?: string;
    }) => void
  ): void {
    this.onStateChange = callback;
  }

  public onCommandReceived(
    callback: (command: string, intent?: CommandIntent) => void
  ): void {
    this.onCommand = callback;
  }

  public onErrorOccurred(callback: (error: string) => void): void {
    this.onError = callback;
  }

  // Accessibility helpers
  private announceToScreenReader(message: string): void {
    // Create a live region for screen reader announcements
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only'; // Screen reader only
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  // Keyboard shortcuts for accessibility
  public setupKeyboardShortcuts(): void {
    if (typeof window === 'undefined') return;

    document.addEventListener('keydown', (event) => {
      // Space bar to toggle listening (when not in input fields)
      if (event.code === 'Space' && !this.isInputFocused()) {
        event.preventDefault();
        this.startListening();
      }

      // Escape to stop listening
      if (event.code === 'Escape' && this.isListening) {
        event.preventDefault();
        this.stopListening();
      }

      // Ctrl+H for help
      if (event.ctrlKey && event.code === 'KeyH') {
        event.preventDefault();
        this.announceToScreenReader(
          'Các lệnh giọng nói có sẵn: Mở sách, Đọc to, Tóm tắt, Ghi chú, Chuyển trang. Nhấn Space để bắt đầu nghe.'
        );
      }
    });
  }

  private isInputFocused(): boolean {
    const activeElement = document.activeElement;
    return (
      activeElement?.tagName === 'INPUT' ||
      activeElement?.tagName === 'TEXTAREA' ||
      activeElement?.getAttribute('contenteditable') === 'true'
    );
  }

  // Cleanup
  public destroy(): void {
    if (this.recognition) {
      this.recognition.abort();
      this.recognition = null;
    }
    this.isInitialized = false;
  }
}

// Export singleton instance
export const speechRecognition = new SpeechRecognitionService();
