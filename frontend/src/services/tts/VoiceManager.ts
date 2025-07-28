/**
 * Voice Manager for Text-to-Speech
 * Handles voice discovery, selection, and management with Vietnamese support
 */

import { TTSVoice, TTSSettings } from './types';

export class VoiceManager {
  private voices: TTSVoice[] = [];
  private defaultSettings: TTSSettings = {
    rate: 1.0,
    pitch: 1.0,
    volume: 0.8,
    voice: '',
    language: 'vi-VN',
  };
  private isInitialized: boolean = false;

  constructor() {
    this.initializeVoices();
  }

  private async initializeVoices(): Promise<void> {
    // Wait for voices to be loaded
    if (speechSynthesis.getVoices().length === 0) {
      await new Promise<void>((resolve) => {
        const handleVoicesChanged = () => {
          speechSynthesis.removeEventListener(
            'voiceschanged',
            handleVoicesChanged
          );
          resolve();
        };
        speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);

        // Fallback timeout in case voiceschanged never fires
        setTimeout(resolve, 1000);
      });
    }

    this.loadVoices();
    this.setDefaultVietnameseVoice();
    this.isInitialized = true;
  }

  private loadVoices(): void {
    const systemVoices = speechSynthesis.getVoices();
    this.voices = systemVoices.map((voice) => ({
      id: voice.voiceURI,
      name: voice.name,
      lang: voice.lang,
      localService: voice.localService,
      default: voice.default,
    }));

    console.log(`Loaded ${this.voices.length} voices:`, this.voices);
  }

  private setDefaultVietnameseVoice(): void {
    // Priority order for Vietnamese voices
    const vietnameseVoice = this.findBestVietnameseVoice();
    if (vietnameseVoice) {
      this.defaultSettings.voice = vietnameseVoice.id;
      console.log('Default Vietnamese voice set:', vietnameseVoice.name);
    } else {
      console.warn('No Vietnamese voice found, using system default');
    }
  }

  private findBestVietnameseVoice(): TTSVoice | undefined {
    // Look for Vietnamese voices in order of preference
    const vietnameseVoices = this.voices.filter((voice) =>
      voice.lang.toLowerCase().startsWith('vi')
    );

    if (vietnameseVoices.length === 0) {
      return undefined;
    }

    // Prefer local voices over remote ones
    const localVietnameseVoices = vietnameseVoices.filter(
      (voice) => voice.localService
    );
    if (localVietnameseVoices.length > 0) {
      return localVietnameseVoices[0];
    }

    // Return the first Vietnamese voice found
    return vietnameseVoices[0];
  }

  async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initializeVoices();
    }
  }

  getAvailableVoices(): TTSVoice[] {
    return [...this.voices];
  }

  getVietnameseVoices(): TTSVoice[] {
    return this.voices.filter((voice) =>
      voice.lang.toLowerCase().startsWith('vi')
    );
  }

  getEnglishVoices(): TTSVoice[] {
    return this.voices.filter((voice) =>
      voice.lang.toLowerCase().startsWith('en')
    );
  }

  getVoicesByLanguage(languageCode: string): TTSVoice[] {
    return this.voices.filter((voice) =>
      voice.lang.toLowerCase().startsWith(languageCode.toLowerCase())
    );
  }

  getVoiceById(id: string): TTSVoice | undefined {
    return this.voices.find((voice) => voice.id === id);
  }

  getSystemVoiceById(id: string): SpeechSynthesisVoice | undefined {
    const systemVoices = speechSynthesis.getVoices();
    return systemVoices.find((voice) => voice.voiceURI === id);
  }

  getDefaultSettings(): TTSSettings {
    return { ...this.defaultSettings };
  }

  validateSettings(settings: Partial<TTSSettings>): TTSSettings {
    const validatedSettings: TTSSettings = {
      rate: this.validateRate(settings.rate ?? this.defaultSettings.rate),
      pitch: this.validatePitch(settings.pitch ?? this.defaultSettings.pitch),
      volume: this.validateVolume(
        settings.volume ?? this.defaultSettings.volume
      ),
      voice: this.validateVoice(settings.voice ?? this.defaultSettings.voice),
      language: settings.language ?? this.defaultSettings.language,
    };

    return validatedSettings;
  }

  private validateRate(rate: number): number {
    return Math.max(0.1, Math.min(10, rate));
  }

  private validatePitch(pitch: number): number {
    return Math.max(0, Math.min(2, pitch));
  }

  private validateVolume(volume: number): number {
    return Math.max(0, Math.min(1, volume));
  }

  private validateVoice(voiceId: string): string {
    // Check if the voice ID exists
    const voice = this.getVoiceById(voiceId);
    if (voice) {
      return voiceId;
    }

    // If not found, return default voice
    console.warn(`Voice ${voiceId} not found, using default`);
    return this.defaultSettings.voice;
  }

  // Get recommended settings for Vietnamese
  getVietnameseSettings(): TTSSettings {
    const vietnameseVoice = this.findBestVietnameseVoice();
    return {
      rate: 0.9, // Slightly slower for better Vietnamese pronunciation
      pitch: 1.0,
      volume: 0.8,
      voice: vietnameseVoice?.id || this.defaultSettings.voice,
      language: 'vi-VN',
    };
  }

  // Get recommended settings for English
  getEnglishSettings(): TTSSettings {
    const englishVoices = this.getEnglishVoices();
    const bestEnglishVoice =
      englishVoices.find((voice) => voice.localService) || englishVoices[0];

    return {
      rate: 1.0,
      pitch: 1.0,
      volume: 0.8,
      voice: bestEnglishVoice?.id || this.defaultSettings.voice,
      language: 'en-US',
    };
  }

  // Test voice functionality
  async testVoice(
    voiceId: string,
    testText: string = 'Xin chào, đây là kiểm tra giọng nói.'
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(testText);
      const voice = this.getSystemVoiceById(voiceId);

      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => resolve(true);
      utterance.onerror = () => resolve(false);

      // Set a timeout in case the voice doesn't respond
      const timeout = setTimeout(() => {
        speechSynthesis.cancel();
        resolve(false);
      }, 5000);

      utterance.onend = () => {
        clearTimeout(timeout);
        resolve(true);
      };

      utterance.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };

      speechSynthesis.speak(utterance);
    });
  }

  // Get voice information for display
  getVoiceInfo(
    voiceId: string
  ): { name: string; language: string; local: boolean } | null {
    const voice = this.getVoiceById(voiceId);
    if (!voice) return null;

    return {
      name: voice.name,
      language: voice.lang,
      local: voice.localService,
    };
  }

  // Check if Vietnamese voices are available
  hasVietnameseVoices(): boolean {
    return this.getVietnameseVoices().length > 0;
  }

  // Get voice quality score (prefer local, Vietnamese voices)
  getVoiceQualityScore(voice: TTSVoice): number {
    let score = 0;

    // Prefer local voices
    if (voice.localService) score += 10;

    // Prefer Vietnamese voices
    if (voice.lang.toLowerCase().startsWith('vi')) score += 20;

    // Prefer default voices
    if (voice.default) score += 5;

    return score;
  }

  // Get best available voice for a language
  getBestVoiceForLanguage(languageCode: string): TTSVoice | undefined {
    const voices = this.getVoicesByLanguage(languageCode);
    if (voices.length === 0) return undefined;

    // Sort by quality score
    voices.sort(
      (a, b) => this.getVoiceQualityScore(b) - this.getVoiceQualityScore(a)
    );

    return voices[0];
  }

  // Refresh voices (useful if system voices change)
  async refreshVoices(): Promise<void> {
    this.isInitialized = false;
    await this.initializeVoices();
  }

  // Get voice statistics for debugging
  getVoiceStatistics(): {
    total: number;
    vietnamese: number;
    english: number;
    local: number;
    remote: number;
  } {
    const vietnamese = this.getVietnameseVoices();
    const english = this.getEnglishVoices();
    const local = this.voices.filter((voice) => voice.localService);
    const remote = this.voices.filter((voice) => !voice.localService);

    return {
      total: this.voices.length,
      vietnamese: vietnamese.length,
      english: english.length,
      local: local.length,
      remote: remote.length,
    };
  }
}
