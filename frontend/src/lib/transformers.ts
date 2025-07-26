import { Book, Note, ReadingPosition, UserPreferences, DEFAULT_PREFERENCES } from '@/types';
import { generateId } from './utils';

// Book transformers
export function createBookFromUpload(
  title: string,
  author: string,
  content: string,
  format: 'pdf' | 'epub' | 'txt',
  metadata: any = {}
): Omit<Book, 'id' | 'createdAt' | 'updatedAt'> {
  const chapters = extractChaptersFromContent(content, format);
  const totalPages = calculateTotalPages(content, format);

  return {
    title: title.trim(),
    author: author.trim(),
    content: {
      chapters,
      totalPages,
      format,
    },
    metadata: {
      language: 'vi',
      fileSize: content.length,
      wordCount: countWords(content),
      ...metadata,
    },
    lastReadPosition: {
      page: 1,
      chapter: chapters[0]?.title || '',
      characterOffset: 0,
      percentage: 0,
    },
  };
}

export function updateBookPosition(book: Book, position: ReadingPosition): Book {
  return {
    ...book,
    lastReadPosition: position,
    updatedAt: new Date(),
  };
}

// Note transformers
export function createNoteFromContent(
  bookId: string,
  content: string,
  position: ReadingPosition,
  tags: string[] = []
): Omit<Note, 'id'> {
  return {
    bookId,
    content: content.trim(),
    position,
    timestamp: new Date(),
    tags: tags.map(tag => tag.trim().toLowerCase()),
  };
}

export function updateNoteContent(note: Note, content: string, tags?: string[]): Note {
  return {
    ...note,
    content: content.trim(),
    tags: tags ? tags.map(tag => tag.trim().toLowerCase()) : note.tags,
    timestamp: new Date(),
  };
}

// Reading position transformers
export function calculateReadingPercentage(
  currentPage: number,
  totalPages: number,
  characterOffset: number = 0,
  pageLength: number = 1000
): number {
  const pageProgress = (currentPage - 1) / totalPages;
  const offsetProgress = characterOffset / (pageLength * totalPages);
  return Math.min(Math.round((pageProgress + offsetProgress) * 100), 100);
}

export function createReadingPosition(
  page: number,
  chapter: string,
  characterOffset: number = 0,
  totalPages: number = 1
): ReadingPosition {
  return {
    page: Math.max(1, Math.min(page, totalPages)),
    chapter,
    characterOffset: Math.max(0, characterOffset),
    percentage: calculateReadingPercentage(page, totalPages, characterOffset),
  };
}

// User preferences transformers
export function mergePreferences(
  current: Partial<UserPreferences>,
  updates: Partial<UserPreferences>
): UserPreferences {
  return {
    voiceSettings: {
      ...DEFAULT_PREFERENCES.voiceSettings,
      ...current.voiceSettings,
      ...updates.voiceSettings,
    },
    readingSettings: {
      ...DEFAULT_PREFERENCES.readingSettings,
      ...current.readingSettings,
      ...updates.readingSettings,
    },
    aiSettings: {
      ...DEFAULT_PREFERENCES.aiSettings,
      ...current.aiSettings,
      ...updates.aiSettings,
    },
    lastUpdated: new Date(),
  };
}

// Content processing helpers
function extractChaptersFromContent(content: string, format: string) {
  // Simple chapter extraction - can be enhanced based on format
  const chapters = [];
  const lines = content.split('\n');
  let currentChapter = {
    id: generateId(),
    title: 'Chapter 1',
    content: '',
    startPage: 1,
    endPage: 1,
  };

  let chapterCount = 1;
  let pageCount = 1;
  let linesPerPage = format === 'pdf' ? 50 : 40;
  let currentLines = 0;

  for (const line of lines) {
    // Simple chapter detection
    if (line.match(/^(Chapter|Chương|CHAPTER)\s+\d+/i)) {
      if (currentChapter.content) {
        currentChapter.endPage = pageCount;
        chapters.push(currentChapter);
      }
      
      chapterCount++;
      currentChapter = {
        id: generateId(),
        title: line.trim() || `Chapter ${chapterCount}`,
        content: '',
        startPage: pageCount,
        endPage: pageCount,
      };
      currentLines = 0;
    } else {
      currentChapter.content += line + '\n';
      currentLines++;
      
      if (currentLines >= linesPerPage) {
        pageCount++;
        currentLines = 0;
      }
    }
  }

  // Add the last chapter
  if (currentChapter.content) {
    currentChapter.endPage = pageCount;
    chapters.push(currentChapter);
  }

  return chapters.length > 0 ? chapters : [{
    id: generateId(),
    title: 'Full Content',
    content,
    startPage: 1,
    endPage: calculateTotalPages(content, format),
  }];
}

function calculateTotalPages(content: string, format: string): number {
  const linesPerPage = format === 'pdf' ? 50 : 40;
  const totalLines = content.split('\n').length;
  return Math.max(1, Math.ceil(totalLines / linesPerPage));
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

// Search and filter transformers
export function normalizeSearchQuery(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');
}

export function extractSearchTerms(query: string): string[] {
  return normalizeSearchQuery(query)
    .split(' ')
    .filter(term => term.length > 2);
}

// Time formatting
export function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  
  return formatTimestamp(date);
}