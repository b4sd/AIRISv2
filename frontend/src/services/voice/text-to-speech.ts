'use client';

import { SpeechSynthesisState } from '@/types';
import { text } from 'stream/consumers';
import { th } from 'zod/v4/locales';

export class TextToSpeechService {
  private synthesis: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isInitialized = false;
  private voices: SpeechSynthesisVoice[] = [];
  private currentVoiceIndex = 0;

  // State management
  private state: SpeechSynthesisState = {
    isReading: false,
    isPaused: false,
    currentText: '',
    currentPosition: 0,
    rate: 1.0,
    volume: 1.0,
    voice: '',
  };

  // Callbacks for UI updates
  private onStateChange?: (state: SpeechSynthesisState) => void;
  private onPositionChange?: (position: number, text: string) => void;
  private onError?: (error: string) => void;
  private onComplete?: () => void;
  private progressTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (typeof window === 'undefined') return;

    if (!('speechSynthesis' in window)) {
      console.error('Text-to-speech not supported in this browser');
      this.onError?.(
        'Trình duyệt không hỗ trợ đọc văn bản. Vui lòng sử dụng Chrome, Edge, hoặc Safari.'
      );
      return;
    }

    this.synthesis = window.speechSynthesis;
    this.loadVoices();
    this.isInitialized = true;

    // Listen for voice changes
    if (this.synthesis) {
      this.synthesis.addEventListener('voiceschanged', () => {
        this.loadVoices();
      });
    }

    // Announce TTS is ready
    this.announceToScreenReader('Hệ thống đọc văn bản đã sẵn sàng.');
  }

  private startProgressTimer(text: string): void {
    if (this.progressTimer) return;

    const words = text.split(/\s+/).length;
    const estimateDuration = (text.length / (this.state.rate * 10) * 1000);

    const startTime = Date.now();

    this.progressTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / estimateDuration, 1);
      const position = Math.floor(progress * text.length);

      this.updateState({ currentPosition: position });
      this.onPositionChange?.(position, text);

      // debug
      // console.log(`TTS progress: ${position}/${text.length} (${Math.round(progress * 100)}%)`);
    }, 200);
  }

  private stopProgressTimer(): void {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
  }

    

  private loadVoices(): void {
    if (!this.synthesis) return;

    this.voices = this.synthesis.getVoices();

    // Prioritize Vietnamese voices
    const vietnameseVoices = this.voices.filter(
      (voice) =>
        voice.lang.startsWith('vi') ||
        voice.lang.includes('VN') ||
        voice.name.toLowerCase().includes('vietnam')
    );

    const englishVoices = this.voices.filter(
      (voice) => voice.lang.startsWith('en') && !voice.lang.includes('VN')
    );

    // Reorder voices: Vietnamese first, then English, then others
    this.voices = [
      ...vietnameseVoices,
      ...englishVoices,
      ...this.voices.filter(
        (voice) =>
          !voice.lang.startsWith('vi') &&
          !voice.lang.includes('VN') &&
          !voice.lang.startsWith('en')
      ),
    ];

    // Set default voice
    if (this.voices.length > 0) {
      this.state.voice = this.voices[0].name;
      this.updateState({ voice: this.voices[0].name });
    }
  }

  public async speak(
    text: string,
    options?: {
      rate?: number;
      volume?: number;
      voice?: string;
      onBoundary?: (position: number) => void;
    }
  ): Promise<void> {
    if (!this.isInitialized || !this.synthesis) {
      throw new Error('Text-to-speech service not initialized');
    }

    if (!text.trim()) {
      throw new Error('Không có văn bản để đọc');
    }

    // Stop current speech if any
    this.stop();

    // Create new utterance
    this.currentUtterance = new SpeechSynthesisUtterance(text);

    // Set voice
    const voiceName = options?.voice || this.state.voice;
    const selectedVoice = this.voices.find((voice) => voice.name === voiceName);
    if (selectedVoice) {
      this.currentUtterance.voice = selectedVoice;
    }

    // Set speech parameters
    this.currentUtterance.rate = options?.rate || this.state.rate;
    this.currentUtterance.volume = options?.volume || this.state.volume;
    this.currentUtterance.pitch = 1.0;

    // Update state
    this.updateState({
      isReading: true,
      isPaused: false,
      currentText: text,
      currentPosition: 0,
      rate: this.currentUtterance.rate,
      volume: this.currentUtterance.volume,
    });

    // Set up event handlers
    this.currentUtterance.onstart = () => {
      // this.startProgressTimer(text);
      this.updateState({ isReading: true, isPaused: false });
      this.announceToScreenReader('Bắt đầu đọc văn bản.');
    };

    this.currentUtterance.onend = () => {
      // this.stopProgressTimer();
      this.updateState({
        isReading: false,
        isPaused: false,
        currentPosition: text.length,
      });
      this.announceToScreenReader('Đã đọc xong văn bản.');
      this.onComplete?.();
    };

    this.currentUtterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      this.updateState({ isReading: false, isPaused: false });

      let errorMessage = 'Đã xảy ra lỗi khi đọc văn bản.';
      switch ((event as any).error) {
        case 'network':
          errorMessage =
            'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.';
          break;
        case 'synthesis-failed':
          errorMessage = 'Không thể đọc văn bản. Vui lòng thử lại.';
          break;
        case 'language-not-supported':
          errorMessage =
            'Ngôn ngữ không được hỗ trợ. Vui lòng chọn giọng đọc khác.';
          break;
      }

      this.onError?.(errorMessage);
      this.announceToScreenReader(errorMessage);
    };

    this.currentUtterance.onpause = () => {
      // this.stopProgressTimer();
      this.updateState({ isPaused: true });
      this.announceToScreenReader('Đã tạm dừng đọc.');
    };

    this.currentUtterance.onresume = () => {
      // this.startProgressTimer(text);
      this.updateState({ isPaused: false });
      this.announceToScreenReader('Tiếp tục đọc.');
    };

    // Start speaking
    try {
      this.synthesis.speak(this.currentUtterance);
    } catch (error) {
      console.error('Failed to start speech synthesis:', error);
      this.onError?.('Không thể bắt đầu đọc văn bản. Vui lòng thử lại.');
    }
  }

  public pause(): void {
    if (!this.synthesis || !this.state.isReading) return;

    try {
      this.synthesis.pause();
    } catch (error) {
      console.error('Failed to pause speech:', error);
      this.onError?.('Không thể tạm dừng đọc.');
    }
  }

  public resume(): void {
    if (!this.synthesis || !this.state.isPaused) return;

    try {
      this.synthesis.resume();
    } catch (error) {
      console.error('Failed to resume speech:', error);
      this.onError?.('Không thể tiếp tục đọc.');
    }
  }

  public stop(): void {
    if (!this.synthesis) return;

    try {
      this.synthesis.cancel();
      this.updateState({
        isReading: false,
        isPaused: false,
        currentPosition: 0,
      });
    } catch (error) {
      console.error('Failed to stop speech:', error);
    }
  }

  public setRate(rate: number): void {
    const clampedRate = Math.max(0.1, Math.min(10, rate));
    this.updateState({ rate: clampedRate });

    // If currently speaking, we need to restart with new rate
    if (this.state.isReading && this.state.currentText) {
      const currentText = this.state.currentText;
      const currentPosition = this.state.currentPosition;

      // Extract remaining text from current position
      const remainingText = currentText.substring(currentPosition);
      if (remainingText.trim()) {
        this.speak(remainingText, { rate: clampedRate });
      }
    }
  }

  public setVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.updateState({ volume: clampedVolume });

    if (this.currentUtterance) {
      this.currentUtterance.volume = clampedVolume;
    }
  }

  public setVoice(voiceName: string): void {
    const voice = this.voices.find((v) => v.name === voiceName);
    if (voice) {
      this.updateState({ voice: voiceName });
      this.currentVoiceIndex = this.voices.indexOf(voice);
    }
  }

  public nextVoice(): void {
    if (this.voices.length === 0) return;

    this.currentVoiceIndex = (this.currentVoiceIndex + 1) % this.voices.length;
    const nextVoice = this.voices[this.currentVoiceIndex];
    this.setVoice(nextVoice.name);

    this.announceToScreenReader(`Đã chuyển sang giọng đọc: ${nextVoice.name}`);
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return [...this.voices];
  }

  public getVietnameseVoices(): SpeechSynthesisVoice[] {
    return this.voices.filter(
      (voice) =>
        voice.lang.startsWith('vi') ||
        voice.lang.includes('VN') ||
        voice.name.toLowerCase().includes('vietnam')
    );
  }

  public getCurrentState(): SpeechSynthesisState {
    return { ...this.state };
  }

  public isSupported(): boolean {
    return this.isInitialized && !!this.synthesis;
  }

  // Event listeners for UI integration
  public onStateChanged(callback: (state: SpeechSynthesisState) => void): void {
    this.onStateChange = callback;
  }

  public onPositionChanged(
    callback: (position: number, text: string) => void
  ): void {
    this.onPositionChange = callback;
  }

  public onErrorOccurred(callback: (error: string) => void): void {
    this.onError = callback;
  }

  public onSpeechComplete(callback: () => void): void {
    this.onComplete = callback;
  }

  // Utility methods
  public speakText(text: string): Promise<void> {
    return this.speak(text);
  }

  public speakWithHighlight(
    text: string,
    onWordHighlight?: (word: string, position: number) => void
  ): Promise<void> {
    return this.speak(text, {
      onBoundary: (position) => {
        // Extract current word
        const words = text.split(/\s+/);
        let currentPos = 0;
        for (const word of words) {
          if (currentPos <= position && position < currentPos + word.length) {
            onWordHighlight?.(word, currentPos);
            break;
          }
          currentPos += word.length + 1; // +1 for space
        }
      },
    });
  }

  // Reading controls for different content types
  public async readPage(pageContent: string): Promise<void> {
    const processedContent = this.preprocessText(pageContent);
    await this.speak(processedContent);
  }

  public async readChapter(
    chapterContent: string,
    chapterTitle?: string
  ): Promise<void> {
    let textToRead = chapterContent;

    if (chapterTitle) {
      textToRead = `${chapterTitle}. ${chapterContent}`;
    }

    const processedContent = this.preprocessText(textToRead);
    await this.speak(processedContent);
  }

  public async readSummary(summaryContent: string): Promise<void> {
    const introText = 'Đây là bản tóm tắt. ';
    const processedContent = this.preprocessText(introText + summaryContent);
    await this.speak(processedContent);
  }

  // Text preprocessing for better speech
  private preprocessText(text: string): string {
    return (
      text
        // Add pauses for better readability
        .replace(/\./g, '. ')
        .replace(/,/g, ', ')
        .replace(/;/g, '; ')
        .replace(/:/g, ': ')
        .replace(/\?/g, '? ')
        .replace(/!/g, '! ')
        // Handle Vietnamese specific punctuation
        .replace(/\.\.\./g, ' ba chấm ')
        .replace(/–/g, ' gạch ngang ')
        .replace(/—/g, ' gạch dài ')
        // Clean up extra spaces
        .replace(/\s+/g, ' ')
        .trim()
    );
  }

  private updateState(updates: Partial<SpeechSynthesisState>): void {
    this.state = { ...this.state, ...updates };
    this.onStateChange?.(this.state);
  }
  

  private announceToScreenReader(message: string): void {
    if (typeof document === 'undefined') return;

    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  }

  // Cleanup
  public destroy(): void {
    this.stop();
    this.synthesis = null;
    this.currentUtterance = null;
    this.isInitialized = false;
  }
}

// Export singleton instance
export const textToSpeech = new TextToSpeechService();
