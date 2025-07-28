/**
 * TTS Controller - Core Text-to-Speech functionality
 * Handles speech synthesis with Vietnamese support and accessibility features
 */

import { TTSSettings, TTSEvent, ReadingState } from './types';
import { VoiceManager } from './VoiceManager';
import { AudioFeedback } from '../accessibility/AudioFeedback';

export class TTSController {
  private synthesis: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voiceManager: VoiceManager;
  private audioFeedback: AudioFeedback;
  private settings: TTSSettings;
  private eventListeners: Map<string, ((event: TTSEvent) => void)[]> =
    new Map();
  private state: ReadingState = {
    isReading: false,
    isPaused: false,
    currentText: '',
    position: {
      page: 1,
      chapter: '',
      characterOffset: 0,
      percentage: 0,
      timestamp: new Date(),
    },
    totalDuration: 0,
    currentTime: 0,
  };

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.voiceManager = new VoiceManager();
    this.audioFeedback = new AudioFeedback();
    this.settings = this.voiceManager.getDefaultSettings();

    this.initializeController();
  }

  private async initializeController(): Promise<void> {
    await this.voiceManager.ensureInitialized();
    this.settings = this.voiceManager.getDefaultSettings();

    // Set up synthesis event handlers
    this.setupSynthesisEventHandlers();
  }

  private setupSynthesisEventHandlers(): void {
    // Handle browser tab visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state.isReading) {
        // Pause when tab becomes hidden to prevent issues
        this.pause();
      }
    });

    // Handle page unload
    window.addEventListener('beforeunload', () => {
      if (this.state.isReading) {
        this.stop();
      }
    });
  }

  // Event handling
  addEventListener(event: string, callback: (event: TTSEvent) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  removeEventListener(
    event: string,
    callback: (event: TTSEvent) => void
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: TTSEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in TTS event listener:', error);
        }
      });
    }
  }

  // Settings management
  async updateSettings(newSettings: Partial<TTSSettings>): Promise<void> {
    await this.voiceManager.ensureInitialized();
    this.settings = this.voiceManager.validateSettings({
      ...this.settings,
      ...newSettings,
    });
  }

  getSettings(): TTSSettings {
    return { ...this.settings };
  }

  // Reading control
  async speak(
    text: string,
    position?: Partial<ReadingState['position']>
  ): Promise<void> {
    if (!text || text.trim().length === 0) {
      await this.audioFeedback.playCommandFailed();
      throw new Error('No text provided for TTS');
    }

    // Stop any current speech
    if (this.state.isReading) {
      this.stop();
    }

    try {
      await this.voiceManager.ensureInitialized();

      this.currentUtterance = new SpeechSynthesisUtterance(text);
      this.setupUtterance(this.currentUtterance);

      // Update state
      this.state = {
        ...this.state,
        isReading: true,
        isPaused: false,
        currentText: text,
        position: {
          ...this.state.position,
          ...position,
          timestamp: new Date(),
        },
      };

      return new Promise((resolve, reject) => {
        if (!this.currentUtterance) {
          reject(new Error('No utterance created'));
          return;
        }

        this.currentUtterance.onstart = () => {
          this.emit({
            type: 'start',
            timestamp: new Date(),
          });
          this.audioFeedback.playTTSStarted();
        };

        this.currentUtterance.onend = () => {
          this.state.isReading = false;
          this.state.isPaused = false;
          this.emit({
            type: 'end',
            timestamp: new Date(),
          });
          this.audioFeedback.playActionCompleted();
          resolve();
        };

        this.currentUtterance.onerror = (event) => {
          this.state.isReading = false;
          this.state.isPaused = false;
          this.emit({
            type: 'error',
            data: event.error,
            timestamp: new Date(),
          });
          this.audioFeedback.playTTSError();
          reject(new Error(`TTS Error: ${event.error}`));
        };

        this.currentUtterance.onpause = () => {
          this.state.isPaused = true;
          this.emit({
            type: 'pause',
            timestamp: new Date(),
          });
        };

        this.currentUtterance.onresume = () => {
          this.state.isPaused = false;
          this.emit({
            type: 'resume',
            timestamp: new Date(),
          });
        };

        // Start speaking
        this.synthesis.speak(this.currentUtterance);
      });
    } catch (error) {
      await this.audioFeedback.playTTSError();
      throw error;
    }
  }

  pause(): void {
    if (this.state.isReading && !this.state.isPaused) {
      this.synthesis.pause();
      // Note: onpause event will update state and emit event
    }
  }

  resume(): void {
    if (this.state.isReading && this.state.isPaused) {
      this.synthesis.resume();
      // Note: onresume event will update state and emit event
    }
  }

  stop(): void {
    if (this.state.isReading) {
      this.synthesis.cancel();
      this.state.isReading = false;
      this.state.isPaused = false;
      this.currentUtterance = null;
      this.emit({
        type: 'end',
        timestamp: new Date(),
      });
    }
  }

  // Voice control methods
  async changeVoice(voiceId: string): Promise<void> {
    const voice = this.voiceManager.getVoiceById(voiceId);
    if (voice) {
      await this.updateSettings({ voice: voiceId });
      await this.audioFeedback.playActionCompleted();
    } else {
      await this.audioFeedback.playCommandFailed();
      throw new Error(`Voice not found: ${voiceId}`);
    }
  }

  async adjustRate(rate: number): Promise<void> {
    await this.updateSettings({ rate });
    await this.audioFeedback.playActionCompleted();
  }

  async adjustVolume(volume: number): Promise<void> {
    await this.updateSettings({ volume });
    await this.audioFeedback.playActionCompleted();
  }

  async adjustPitch(pitch: number): Promise<void> {
    await this.updateSettings({ pitch });
    await this.audioFeedback.playActionCompleted();
  }

  // Convenience methods for rate adjustment
  async increaseRate(step: number = 0.1): Promise<void> {
    const newRate = Math.min(10, this.settings.rate + step);
    await this.adjustRate(newRate);
  }

  async decreaseRate(step: number = 0.1): Promise<void> {
    const newRate = Math.max(0.1, this.settings.rate - step);
    await this.adjustRate(newRate);
  }

  // State getters
  getState(): ReadingState {
    return { ...this.state };
  }

  isReading(): boolean {
    return this.state.isReading;
  }

  isPaused(): boolean {
    return this.state.isPaused;
  }

  getCurrentText(): string {
    return this.state.currentText;
  }

  getCurrentPosition(): ReadingState['position'] {
    return { ...this.state.position };
  }

  // Voice information
  getAvailableVoices(): any[] {
    return this.voiceManager.getAvailableVoices();
  }

  getVietnameseVoices(): any[] {
    return this.voiceManager.getVietnameseVoices();
  }

  getCurrentVoiceInfo(): {
    name: string;
    language: string;
    local: boolean;
  } | null {
    return this.voiceManager.getVoiceInfo(this.settings.voice);
  }

  // Test functionality
  async testCurrentVoice(): Promise<boolean> {
    const testText = this.settings.language.startsWith('vi')
      ? 'Xin chào, đây là kiểm tra giọng nói tiếng Việt.'
      : 'Hello, this is a voice test.';

    try {
      await this.speak(testText);
      return true;
    } catch (error) {
      console.error('Voice test failed:', error);
      return false;
    }
  }

  // Private methods
  private setupUtterance(utterance: SpeechSynthesisUtterance): void {
    // Apply current settings
    utterance.rate = this.settings.rate;
    utterance.pitch = this.settings.pitch;
    utterance.volume = this.settings.volume;
    utterance.lang = this.settings.language;

    // Set voice if available
    const systemVoice = this.voiceManager.getSystemVoiceById(
      this.settings.voice
    );
    if (systemVoice) {
      utterance.voice = systemVoice;
    }

    // Add boundary event for position tracking
    utterance.onboundary = (event) => {
      this.emit({
        type: 'boundary',
        data: {
          charIndex: event.charIndex,
          charLength: event.charLength,
          name: event.name,
        },
        timestamp: new Date(),
      });

      // Update reading position based on character progress
      if (event.charIndex !== undefined) {
        const percentage =
          (event.charIndex / this.state.currentText.length) * 100;
        this.state.position = {
          ...this.state.position,
          characterOffset: event.charIndex,
          percentage: Math.min(100, percentage),
          timestamp: new Date(),
        };
      }
    };
  }

  // Cleanup method
  destroy(): void {
    this.stop();
    this.eventListeners.clear();
  }

  // Get TTS capabilities
  getCapabilities(): {
    hasVietnameseVoices: boolean;
    voiceCount: number;
    supportsSSML: boolean;
    maxRate: number;
    minRate: number;
  } {
    return {
      hasVietnameseVoices: this.voiceManager.hasVietnameseVoices(),
      voiceCount: this.voiceManager.getAvailableVoices().length,
      supportsSSML: false, // Web Speech API doesn't support SSML
      maxRate: 10,
      minRate: 0.1,
    };
  }

  // Get voice statistics for debugging
  getVoiceStatistics(): any {
    return this.voiceManager.getVoiceStatistics();
  }
}
