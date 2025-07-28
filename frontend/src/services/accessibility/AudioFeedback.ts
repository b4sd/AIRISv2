/**
 * Audio Feedback System for Visually Impaired Users
 * Provides sound indicators for success, error, and status states
 */

import { AudioFeedbackSettings } from '../tts/types';

export type FeedbackType = 'success' | 'error' | 'status' | 'navigation';

export interface AudioFeedbackSound {
  type: FeedbackType;
  frequency: number;
  duration: number;
  volume?: number;
}

export class AudioFeedback {
  private audioContext: AudioContext | null = null;
  private settings: AudioFeedbackSettings = {
    enabled: true,
    volume: 0.3,
    successSound: true,
    errorSound: true,
    statusSound: true,
  };

  constructor() {
    this.initializeAudioContext();
  }

  private initializeAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('AudioContext not supported:', error);
    }
  }

  private async ensureAudioContext(): Promise<void> {
    if (!this.audioContext) {
      this.initializeAudioContext();
    }

    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  // Success sounds
  async playCommandRecognized(): Promise<void> {
    if (!this.settings.enabled || !this.settings.successSound) return;
    await this.playTone(800, 200, 'success');
  }

  async playActionCompleted(): Promise<void> {
    if (!this.settings.enabled || !this.settings.successSound) return;
    await this.playDoubleTone(600, 800, 100, 'success');
  }

  async playTTSStarted(): Promise<void> {
    if (!this.settings.enabled || !this.settings.successSound) return;
    await this.playRisingTone(400, 800, 300, 'success');
  }

  async playNoteSaved(): Promise<void> {
    if (!this.settings.enabled || !this.settings.successSound) return;
    await this.playTone(1000, 150, 'success');
  }

  // Error sounds
  async playCommandFailed(): Promise<void> {
    if (!this.settings.enabled || !this.settings.errorSound) return;
    await this.playTone(200, 300, 'error');
  }

  async playMicrophoneError(): Promise<void> {
    if (!this.settings.enabled || !this.settings.errorSound) return;
    await this.playTripleTone(150, 100, 'error');
  }

  async playTTSError(): Promise<void> {
    if (!this.settings.enabled || !this.settings.errorSound) return;
    await this.playDescendingTone(600, 300, 400, 'error');
  }

  async playNetworkError(): Promise<void> {
    if (!this.settings.enabled || !this.settings.errorSound) return;
    await this.playDoubleTone(250, 250, 200, 'error');
  }

  // Status sounds
  async playListeningActive(): Promise<void> {
    if (!this.settings.enabled || !this.settings.statusSound) return;
    // Very quiet continuous tone - not implemented to avoid interference
  }

  async playProcessing(): Promise<void> {
    if (!this.settings.enabled || !this.settings.statusSound) return;
    await this.playPulsingTone(500, 100, 3, 'status');
  }

  async playLoading(): Promise<void> {
    if (!this.settings.enabled || !this.settings.statusSound) return;
    await this.playOscillatingTone(400, 600, 200, 'status');
  }

  // Navigation sounds
  async playPageTurn(): Promise<void> {
    if (!this.settings.enabled) return;
    await this.playWhiteNoise(150, 'navigation');
  }

  async playChapterChange(): Promise<void> {
    if (!this.settings.enabled) return;
    await this.playRisingTone(500, 700, 300, 'navigation');
  }

  async playMenuOpen(): Promise<void> {
    if (!this.settings.enabled) return;
    await this.playRisingTone(400, 800, 200, 'navigation');
  }

  async playMenuClose(): Promise<void> {
    if (!this.settings.enabled) return;
    await this.playDescendingTone(800, 400, 200, 'navigation');
  }

  // Core audio generation methods
  private async playTone(
    frequency: number,
    duration: number,
    type: FeedbackType
  ): Promise<void> {
    await this.ensureAudioContext();
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(
      frequency,
      this.audioContext.currentTime
    );
    oscillator.type = 'sine';

    const volume = this.getVolumeForType(type);
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + duration / 1000
    );

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration / 1000);
  }

  private async playDoubleTone(
    freq1: number,
    freq2: number,
    duration: number,
    type: FeedbackType
  ): Promise<void> {
    await this.playTone(freq1, duration, type);
    setTimeout(() => this.playTone(freq2, duration, type), duration + 50);
  }

  private async playTripleTone(
    frequency: number,
    duration: number,
    type: FeedbackType
  ): Promise<void> {
    await this.playTone(frequency, duration, type);
    setTimeout(() => this.playTone(frequency, duration, type), duration + 50);
    setTimeout(
      () => this.playTone(frequency, duration, type),
      (duration + 50) * 2
    );
  }

  private async playRisingTone(
    startFreq: number,
    endFreq: number,
    duration: number,
    type: FeedbackType
  ): Promise<void> {
    await this.ensureAudioContext();
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(
      startFreq,
      this.audioContext.currentTime
    );
    oscillator.frequency.exponentialRampToValueAtTime(
      endFreq,
      this.audioContext.currentTime + duration / 1000
    );
    oscillator.type = 'sine';

    const volume = this.getVolumeForType(type);
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + duration / 1000
    );

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration / 1000);
  }

  private async playDescendingTone(
    startFreq: number,
    endFreq: number,
    duration: number,
    type: FeedbackType
  ): Promise<void> {
    await this.ensureAudioContext();
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(
      startFreq,
      this.audioContext.currentTime
    );
    oscillator.frequency.exponentialRampToValueAtTime(
      endFreq,
      this.audioContext.currentTime + duration / 1000
    );
    oscillator.type = 'sine';

    const volume = this.getVolumeForType(type);
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + duration / 1000
    );

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration / 1000);
  }

  private async playPulsingTone(
    frequency: number,
    pulseDuration: number,
    pulseCount: number,
    type: FeedbackType
  ): Promise<void> {
    for (let i = 0; i < pulseCount; i++) {
      setTimeout(
        () => this.playTone(frequency, pulseDuration, type),
        i * (pulseDuration + 50)
      );
    }
  }

  private async playOscillatingTone(
    freq1: number,
    freq2: number,
    cycleDuration: number,
    type: FeedbackType
  ): Promise<void> {
    await this.playRisingTone(freq1, freq2, cycleDuration / 2, type);
    setTimeout(
      () => this.playDescendingTone(freq2, freq1, cycleDuration / 2, type),
      cycleDuration / 2
    );
  }

  private async playWhiteNoise(
    duration: number,
    type: FeedbackType
  ): Promise<void> {
    await this.ensureAudioContext();
    if (!this.audioContext) return;

    const bufferSize = this.audioContext.sampleRate * (duration / 1000);
    const buffer = this.audioContext.createBuffer(
      1,
      bufferSize,
      this.audioContext.sampleRate
    );
    const output = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();

    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    const volume = this.getVolumeForType(type) * 0.3; // White noise is quieter
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);

    source.start(this.audioContext.currentTime);
  }

  private getVolumeForType(type: FeedbackType): number {
    const baseVolume = this.settings.volume;
    switch (type) {
      case 'success':
        return baseVolume * 0.8;
      case 'error':
        return baseVolume * 0.6;
      case 'status':
        return baseVolume * 0.4;
      case 'navigation':
        return baseVolume * 0.5;
      default:
        return baseVolume;
    }
  }

  // Settings management
  updateSettings(newSettings: Partial<AudioFeedbackSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  getSettings(): AudioFeedbackSettings {
    return { ...this.settings };
  }

  setEnabled(enabled: boolean): void {
    this.settings.enabled = enabled;
  }

  setVolume(volume: number): void {
    this.settings.volume = Math.max(0, Math.min(1, volume));
  }

  // Test method for settings
  async testAudioFeedback(): Promise<void> {
    await this.playCommandRecognized();
    setTimeout(() => this.playActionCompleted(), 500);
    setTimeout(() => this.playTTSStarted(), 1000);
  }
}
