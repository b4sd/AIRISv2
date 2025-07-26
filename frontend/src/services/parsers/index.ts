// Export all parser services
export { BookParser, bookParser } from './book-parser';
export { PDFParser } from './pdf-parser';
export { EPUBParser } from './epub-parser';
export { TextParser } from './text-parser';

// Export parser utilities
export const ParserUtils = {
  // File format detection
  getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  },

  // MIME type validation
  isValidMimeType(mimeType: string, allowedTypes: string[]): boolean {
    return allowedTypes.includes(mimeType);
  },

  // File size formatting
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Content type detection
  detectContentType(content: string): 'text' | 'html' | 'markdown' {
    if (content.includes('<html') || content.includes('<!DOCTYPE')) {
      return 'html';
    }
    if (content.includes('# ') || content.includes('## ') || content.includes('```')) {
      return 'markdown';
    }
    return 'text';
  },

  // Language detection helpers
  detectVietnamese(text: string): boolean {
    const vietnameseChars = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/;
    const vietnameseWords = /\b(và|của|trong|với|cho|từ|đến|về|theo|như|khi|nếu|để|có|là|được|sẽ|đã|đang|các|những|này|đó|tôi|bạn|chúng|họ|không|cũng|rất|nhiều|lại|thì|hay|hoặc|nhưng|mà|nên|phải|chỉ|vì|nó|em|anh|chị)\b/g;
    
    const charMatches = (text.match(vietnameseChars) || []).length;
    const wordMatches = (text.match(vietnameseWords) || []).length;
    
    return charMatches > 5 || wordMatches > 3;
  },

  // Text cleaning utilities
  cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim();
  },

  // Chapter detection
  detectChapterBreaks(text: string): number[] {
    const chapterPatterns = [
      /^(Chapter|Chương|CHAPTER|CHƯƠNG)\s+\d+/gm,
      /^(Phần|PHẦN|Part|PART)\s+\d+/gm,
      /^(Bài|BÀI)\s+\d+/gm,
    ];

    const breaks: number[] = [0]; // Always start with position 0
    
    for (const pattern of chapterPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        breaks.push(match.index);
      }
    }

    return [...new Set(breaks)].sort((a, b) => a - b);
  },

  // Word counting
  countWords(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0)
      .length;
  },

  // Reading time estimation (words per minute)
  estimateReadingTime(text: string, wpm: number = 200): number {
    const wordCount = this.countWords(text);
    return Math.ceil(wordCount / wpm);
  },

  // Text complexity analysis
  analyzeComplexity(text: string): {
    averageWordsPerSentence: number;
    averageCharactersPerWord: number;
    complexity: 'easy' | 'medium' | 'hard';
  } {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    
    const avgWordsPerSentence = words.length / sentences.length;
    const avgCharsPerWord = text.replace(/\s/g, '').length / words.length;
    
    let complexity: 'easy' | 'medium' | 'hard' = 'medium';
    if (avgWordsPerSentence < 15 && avgCharsPerWord < 5) {
      complexity = 'easy';
    } else if (avgWordsPerSentence > 25 || avgCharsPerWord > 7) {
      complexity = 'hard';
    }

    return {
      averageWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
      averageCharactersPerWord: Math.round(avgCharsPerWord * 10) / 10,
      complexity,
    };
  },
};

// Parser error types
export class ParserError extends Error {
  constructor(
    message: string,
    public code: string,
    public format: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'ParserError';
  }
}

export class UnsupportedFormatError extends ParserError {
  constructor(format: string) {
    super(`Unsupported file format: ${format}`, 'UNSUPPORTED_FORMAT', format);
  }
}

export class FileSizeError extends ParserError {
  constructor(size: number, maxSize: number) {
    super(
      `File size ${size} bytes exceeds maximum allowed size of ${maxSize} bytes`,
      'FILE_TOO_LARGE',
      'unknown'
    );
  }
}

export class CorruptedFileError extends ParserError {
  constructor(format: string, originalError?: Error) {
    super(`File appears to be corrupted or invalid`, 'CORRUPTED_FILE', format, originalError);
  }
}

// Constants
export const SUPPORTED_FORMATS = ['pdf', 'epub', 'txt', 'md', 'markdown'] as const;
export const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'application/epub+zip',
  'text/plain',
  'text/markdown',
  'application/x-markdown',
] as const;

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const DEFAULT_READING_SPEED = 200; // words per minute