// Export all reading services
export { ReadingEngineService, readingEngine } from './reading-engine';

// Reading utilities
export const ReadingUtils = {
  // Calculate reading time estimate
  estimateReadingTime(text: string, wordsPerMinute: number = 200): number {
    const wordCount = text.trim().split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  },

  // Extract reading statistics
  getReadingStats(text: string): {
    wordCount: number;
    characterCount: number;
    paragraphCount: number;
    estimatedTime: number;
  } {
    const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    const characterCount = text.length;
    const paragraphCount = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
    const estimatedTime = this.estimateReadingTime(text);

    return {
      wordCount,
      characterCount,
      paragraphCount,
      estimatedTime,
    };
  },

  // Format reading position for display
  formatReadingPosition(position: any): string {
    if (position.chapter) {
      return `${position.chapter}, Trang ${position.page} (${position.percentage}%)`;
    }
    return `Trang ${position.page} (${position.percentage}%)`;
  },

  // Calculate reading progress
  calculateProgress(currentPage: number, totalPages: number): number {
    return Math.round((currentPage / totalPages) * 100);
  },

  // Find optimal TTS settings for Vietnamese
  getOptimalVietnameseTTSSettings(): {
    rate: number;
    pitch: number;
    volume: number;
  } {
    return {
      rate: 0.9, // Slightly slower for better Vietnamese pronunciation
      pitch: 1.0,
      volume: 0.8,
    };
  },

  // Clean text for better TTS pronunciation
  cleanTextForTTS(text: string): string {
    return text
      // Handle Vietnamese abbreviations
      .replace(/\bTP\./g, 'Thành phố')
      .replace(/\bHCM\b/g, 'Hồ Chí Minh')
      .replace(/\bHN\b/g, 'Hà Nội')
      .replace(/\bVN\b/g, 'Việt Nam')
      
      // Handle numbers
      .replace(/\b(\d+)\s*%/g, '$1 phần trăm')
      .replace(/\b(\d+)\s*km/g, '$1 ki-lô-mét')
      .replace(/\b(\d+)\s*m\b/g, '$1 mét')
      
      // Handle common symbols
      .replace(/&/g, 'và')
      .replace(/@/g, 'a còng')
      .replace(/#/g, 'thăng')
      
      // Clean up spacing
      .replace(/\s+/g, ' ')
      .trim();
  },

  // Split long text into readable chunks
  splitIntoChunks(text: string, maxChunkSize: number = 500): string[] {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (currentChunk.length + trimmedSentence.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = trimmedSentence;
      } else {
        currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  },
};

// Reading constants
export const READING_CONSTANTS = {
  // Default reading speeds (words per minute)
  READING_SPEEDS: {
    SLOW: 150,
    NORMAL: 200,
    FAST: 250,
    VERY_FAST: 300,
  },

  // TTS rate mappings
  TTS_RATES: {
    VERY_SLOW: 0.5,
    SLOW: 0.7,
    NORMAL: 1.0,
    FAST: 1.3,
    VERY_FAST: 1.6,
  },

  // Page size estimates (characters per page)
  PAGE_SIZES: {
    PDF: 2000,
    EPUB: 1500,
    TXT: 1000,
  },

  // Vietnamese TTS voice preferences
  VIETNAMESE_VOICE_KEYWORDS: [
    'vi-VN',
    'vietnamese',
    'vietnam',
    'linh',
    'an',
    'minh',
  ],
};