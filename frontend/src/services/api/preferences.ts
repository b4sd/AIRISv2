import { ApiClient } from './client';
import { UserPreferences, ApiResponse } from './types';
import { API_ENDPOINTS } from './config';

export class PreferencesService {
  constructor(private apiClient: ApiClient) {}

  /**
   * Get user preferences
   */
  async getPreferences(): Promise<UserPreferences> {
    const response = await this.apiClient.get<UserPreferences>(
      API_ENDPOINTS.PREFERENCES.GET
    );
    return response.data || this.getDefaultPreferences();
  }

  /**
   * Update user preferences
   */
  async updatePreferences(
    preferences: Partial<UserPreferences>
  ): Promise<UserPreferences> {
    const response = await this.apiClient.put<UserPreferences>(
      API_ENDPOINTS.PREFERENCES.UPDATE,
      preferences
    );
    return response.data!;
  }

  /**
   * Update voice settings
   */
  async updateVoiceSettings(
    voiceSettings: Partial<UserPreferences['voiceSettings']>
  ): Promise<UserPreferences> {
    const currentPreferences = await this.getPreferences();
    const updatedPreferences = {
      ...currentPreferences,
      voiceSettings: {
        ...currentPreferences.voiceSettings,
        ...voiceSettings,
      },
    };

    return this.updatePreferences(updatedPreferences);
  }

  /**
   * Update reading settings
   */
  async updateReadingSettings(
    readingSettings: Partial<UserPreferences['readingSettings']>
  ): Promise<UserPreferences> {
    const currentPreferences = await this.getPreferences();
    const updatedPreferences = {
      ...currentPreferences,
      readingSettings: {
        ...currentPreferences.readingSettings,
        ...readingSettings,
      },
    };

    return this.updatePreferences(updatedPreferences);
  }

  /**
   * Update AI settings
   */
  async updateAISettings(
    aiSettings: Partial<UserPreferences['aiSettings']>
  ): Promise<UserPreferences> {
    const currentPreferences = await this.getPreferences();
    const updatedPreferences = {
      ...currentPreferences,
      aiSettings: {
        ...currentPreferences.aiSettings,
        ...aiSettings,
      },
    };

    return this.updatePreferences(updatedPreferences);
  }

  /**
   * Reset preferences to defaults
   */
  async resetToDefaults(): Promise<UserPreferences> {
    const defaultPreferences = this.getDefaultPreferences();
    return this.updatePreferences(defaultPreferences);
  }

  /**
   * Export preferences for backup
   */
  async exportPreferences(): Promise<Blob> {
    const preferences = await this.getPreferences();
    const exportData = {
      preferences,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });

    return blob;
  }

  /**
   * Import preferences from backup
   */
  async importPreferences(file: File): Promise<UserPreferences> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          const importData = JSON.parse(content);

          if (!importData.preferences) {
            throw new Error('Invalid preferences file format');
          }

          const validatedPreferences = this.validatePreferences(
            importData.preferences
          );
          const updatedPreferences =
            await this.updatePreferences(validatedPreferences);
          resolve(updatedPreferences);
        } catch (error) {
          reject(
            new Error(
              'Failed to import preferences: ' + (error as Error).message
            )
          );
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read preferences file'));
      };

      reader.readAsText(file);
    });
  }

  /**
   * Get available Vietnamese voices
   */
  getAvailableVietnameseVoices(): Array<{
    name: string;
    lang: string;
    gender: 'male' | 'female' | 'unknown';
    quality: 'high' | 'medium' | 'low';
  }> {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return [];
    }

    const voices = window.speechSynthesis.getVoices();
    const vietnameseVoices = voices
      .filter((voice) => voice.lang.startsWith('vi'))
      .map((voice) => ({
        name: voice.name,
        lang: voice.lang,
        gender: this.detectVoiceGender(voice.name),
        quality: this.detectVoiceQuality(voice.name),
      }));

    return vietnameseVoices;
  }

  /**
   * Test voice settings
   */
  async testVoiceSettings(
    settings: UserPreferences['voiceSettings'],
    testText: string = 'Xin chào, đây là bài kiểm tra giọng nói.'
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(testText);
      utterance.lang = settings.recognitionLanguage;
      utterance.rate = settings.speechRate;
      utterance.volume = settings.volume;

      // Find the specified voice
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = voices.find(
        (voice) => voice.name === settings.speechVoice
      );
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = (event) =>
        reject(new Error('Voice test failed: ' + event.error));

      window.speechSynthesis.speak(utterance);
    });
  }

  /**
   * Get default preferences
   */
  getDefaultPreferences(): UserPreferences {
    return {
      voiceSettings: {
        recognitionLanguage: 'vi-VN',
        speechRate: 1.0,
        speechVoice: this.getDefaultVietnameseVoice(),
        volume: 0.8,
        nlpSensitivity: 0.7,
      },
      readingSettings: {
        fontSize: 16,
        theme: 'light',
        autoBookmark: true,
      },
      aiSettings: {
        summaryLength: 'medium',
        summaryStyle: 'paragraph',
        summaryLanguage: 'vi',
      },
    };
  }

  /**
   * Validate preferences object
   */
  validatePreferences(preferences: any): UserPreferences {
    const defaults = this.getDefaultPreferences();

    // Ensure all required properties exist with valid values
    const validated: UserPreferences = {
      voiceSettings: {
        recognitionLanguage:
          this.validateLanguage(
            preferences.voiceSettings?.recognitionLanguage
          ) || defaults.voiceSettings.recognitionLanguage,
        speechRate:
          this.validateSpeechRate(preferences.voiceSettings?.speechRate) ||
          defaults.voiceSettings.speechRate,
        speechVoice:
          preferences.voiceSettings?.speechVoice ||
          defaults.voiceSettings.speechVoice,
        volume:
          this.validateVolume(preferences.voiceSettings?.volume) ||
          defaults.voiceSettings.volume,
        nlpSensitivity:
          this.validateSensitivity(preferences.voiceSettings?.nlpSensitivity) ||
          defaults.voiceSettings.nlpSensitivity,
      },
      readingSettings: {
        fontSize:
          this.validateFontSize(preferences.readingSettings?.fontSize) ||
          defaults.readingSettings.fontSize,
        theme:
          this.validateTheme(preferences.readingSettings?.theme) ||
          defaults.readingSettings.theme,
        autoBookmark:
          typeof preferences.readingSettings?.autoBookmark === 'boolean'
            ? preferences.readingSettings.autoBookmark
            : defaults.readingSettings.autoBookmark,
      },
      aiSettings: {
        summaryLength:
          this.validateSummaryLength(preferences.aiSettings?.summaryLength) ||
          defaults.aiSettings.summaryLength,
        summaryStyle:
          this.validateSummaryStyle(preferences.aiSettings?.summaryStyle) ||
          defaults.aiSettings.summaryStyle,
        summaryLanguage:
          this.validateLanguage(preferences.aiSettings?.summaryLanguage) ||
          defaults.aiSettings.summaryLanguage,
      },
    };

    return validated;
  }

  /**
   * Get preferences for guest users (from localStorage)
   */
  getGuestPreferences(): UserPreferences {
    if (typeof window === 'undefined') {
      return this.getDefaultPreferences();
    }

    try {
      const stored = localStorage.getItem('voice_reading_guest_preferences');
      if (stored) {
        const parsed = JSON.parse(stored);
        return this.validatePreferences(parsed);
      }
    } catch (error) {
      console.error('Failed to load guest preferences:', error);
    }

    return this.getDefaultPreferences();
  }

  /**
   * Save preferences for guest users (to localStorage)
   */
  saveGuestPreferences(preferences: UserPreferences): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(
        'voice_reading_guest_preferences',
        JSON.stringify(preferences)
      );
    } catch (error) {
      console.error('Failed to save guest preferences:', error);
    }
  }

  /**
   * Migrate guest preferences to authenticated user
   */
  async migrateGuestPreferences(): Promise<UserPreferences> {
    const guestPreferences = this.getGuestPreferences();
    const updatedPreferences = await this.updatePreferences(guestPreferences);

    // Clear guest preferences after successful migration
    if (typeof window !== 'undefined') {
      localStorage.removeItem('voice_reading_guest_preferences');
    }

    return updatedPreferences;
  }

  // Validation helper methods
  private validateLanguage(lang: any): 'vi' | 'en' | null {
    const validLanguages = ['vi-VN', 'vi', 'en-US', 'en'];
    if (validLanguages.includes(lang)) {
      // Normalize to simple language codes
      return lang.startsWith('vi') ? 'vi' : 'en';
    }
    return null;
  }

  private validateSpeechRate(rate: any): number | null {
    const numRate = Number(rate);
    return !isNaN(numRate) && numRate >= 0.1 && numRate <= 3.0 ? numRate : null;
  }

  private validateVolume(volume: any): number | null {
    const numVolume = Number(volume);
    return !isNaN(numVolume) && numVolume >= 0 && numVolume <= 1
      ? numVolume
      : null;
  }

  private validateSensitivity(sensitivity: any): number | null {
    const numSensitivity = Number(sensitivity);
    return !isNaN(numSensitivity) && numSensitivity >= 0 && numSensitivity <= 1
      ? numSensitivity
      : null;
  }

  private validateFontSize(size: any): number | null {
    const numSize = Number(size);
    return !isNaN(numSize) && numSize >= 12 && numSize <= 24 ? numSize : null;
  }

  private validateTheme(theme: any): 'light' | 'dark' | null {
    return theme === 'light' || theme === 'dark' ? theme : null;
  }

  private validateSummaryLength(
    length: any
  ): 'short' | 'medium' | 'long' | null {
    return ['short', 'medium', 'long'].includes(length) ? length : null;
  }

  private validateSummaryStyle(style: any): 'bullet' | 'paragraph' | null {
    return ['bullet', 'paragraph'].includes(style) ? style : null;
  }

  private getDefaultVietnameseVoice(): string {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return '';
    }

    const voices = window.speechSynthesis.getVoices();
    const vietnameseVoice = voices.find((voice) => voice.lang.startsWith('vi'));
    return vietnameseVoice?.name || '';
  }

  private detectVoiceGender(voiceName: string): 'male' | 'female' | 'unknown' {
    const femaleKeywords = ['female', 'woman', 'girl', 'nữ', 'cô', 'chị'];
    const maleKeywords = ['male', 'man', 'boy', 'nam', 'anh', 'ông'];

    const lowerName = voiceName.toLowerCase();

    if (femaleKeywords.some((keyword) => lowerName.includes(keyword))) {
      return 'female';
    }

    if (maleKeywords.some((keyword) => lowerName.includes(keyword))) {
      return 'male';
    }

    return 'unknown';
  }

  private detectVoiceQuality(voiceName: string): 'high' | 'medium' | 'low' {
    const highQualityKeywords = ['premium', 'enhanced', 'neural', 'natural'];
    const lowQualityKeywords = ['basic', 'standard', 'compact'];

    const lowerName = voiceName.toLowerCase();

    if (highQualityKeywords.some((keyword) => lowerName.includes(keyword))) {
      return 'high';
    }

    if (lowQualityKeywords.some((keyword) => lowerName.includes(keyword))) {
      return 'low';
    }

    return 'medium';
  }
}
