import { Book, BookMetadata } from '@/types';
import { generateId } from '@/lib/utils';
import { createBookFromUpload } from '@/lib/transformers';

export class TextParser {
  async parseFile(file: File): Promise<Book> {
    try {
      const content = await this.readFileContent(file);

      // Extract metadata from filename and content
      const extractedData = this.extractMetadata(file, content);

      // Create book object
      const bookData = createBookFromUpload(
        extractedData.title || file.name.replace(/\.(txt|md)$/i, ''),
        extractedData.author || 'Unknown Author',
        content,
        'txt',
        {
          ...extractedData.metadata,
          fileSize: file.size,
          originalFileName: file.name,
        }
      );

      const book: Book = {
        id: generateId(),
        ...bookData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return book;
    } catch (error) {
      console.error('Text parsing error:', error);
      throw new Error(
        `Failed to parse text file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const content = event.target?.result as string;
        resolve(content);
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file content'));
      };

      // Try to detect encoding and read as text
      reader.readAsText(file, 'UTF-8');
    });
  }

  private extractMetadata(
    file: File,
    content: string
  ): {
    title?: string;
    author?: string;
    metadata: Partial<BookMetadata>;
  } {
    const lines = content.split('\n').slice(0, 20); // Check first 20 lines
    let title: string | undefined;
    let author: string | undefined;

    // Try to extract title and author from common patterns
    for (const line of lines) {
      const trimmedLine = line.trim();

      // Skip empty lines
      if (!trimmedLine) continue;

      // Check for title patterns
      if (!title && this.couldBeTitle(trimmedLine)) {
        title = trimmedLine;
        continue;
      }

      // Check for author patterns
      if (!author) {
        const authorMatch = this.extractAuthorFromLine(trimmedLine);
        if (authorMatch) {
          author = authorMatch;
          continue;
        }
      }

      // If we have both, stop looking
      if (title && author) break;
    }

    return {
      title: title || this.extractTitleFromFilename(file.name),
      author: author || undefined,
      metadata: {
        language: this.detectLanguage(content),
        description: this.extractDescription(content),
        wordCount: this.countWords(content),
        fileSize: 0, // Will be set later
      },
    };
  }

  private couldBeTitle(line: string): boolean {
    // A line could be a title if:
    // - It's not too long (< 100 chars)
    // - It doesn't start with common text indicators
    // - It's not all uppercase (unless short)
    // - It doesn't contain common sentence patterns

    if (line.length > 100) return false;
    if (line.length < 3) return false;

    // Skip lines that start with common non-title patterns
    const nonTitlePatterns = [
      /^(chapter|chương|phần|bài)\s+\d+/i,
      /^(by|tác giả|author):/i,
      /^(the|một|các|những)/i,
      /^\d+\./,
      /^-+/,
      /^#+/,
    ];

    for (const pattern of nonTitlePatterns) {
      if (pattern.test(line)) return false;
    }

    // Avoid all caps unless it's short
    if (line === line.toUpperCase() && line.length > 20) return false;

    return true;
  }

  private extractAuthorFromLine(line: string): string | null {
    // Common author patterns
    const authorPatterns = [
      /^(?:by|tác giả|author):\s*(.+)$/i,
      /^(.+)\s*-\s*tác giả$/i,
      /^tác giả:\s*(.+)$/i,
      /^written by\s*(.+)$/i,
    ];

    for (const pattern of authorPatterns) {
      const match = line.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  private extractTitleFromFilename(filename: string): string {
    return filename
      .replace(/\.(txt|md)$/i, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase())
      .trim();
  }

  private detectLanguage(content: string): string {
    const sample = content.substring(0, 1000).toLowerCase();

    // Vietnamese detection
    const vietnameseChars =
      /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/;
    const vietnameseWords =
      /\b(và|của|trong|với|cho|từ|đến|về|theo|như|khi|nếu|để|có|là|được|sẽ|đã|đang|các|những|này|đó|tôi|bạn|chúng|họ|không|cũng|rất|nhiều|lại|thì|hay|hoặc|nhưng|mà|nên|phải|chỉ|vì|nó|em|anh|chị)\b/g;

    const vietnameseCharCount = (sample.match(vietnameseChars) || []).length;
    const vietnameseWordCount = (sample.match(vietnameseWords) || []).length;

    if (vietnameseCharCount > 10 || vietnameseWordCount > 5) {
      return 'vi';
    }

    return 'en';
  }

  private extractDescription(content: string): string | undefined {
    const lines = content.split('\n');
    const firstParagraph = lines
      .slice(0, 10)
      .find((line) => line.trim().length > 50);

    if (firstParagraph && firstParagraph.length <= 500) {
      return firstParagraph.trim();
    }

    return undefined;
  }

  private countWords(content: string): number {
    return content
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }

  async extractSection(
    file: File,
    startLine: number,
    endLine: number
  ): Promise<string> {
    try {
      const content = await this.readFileContent(file);
      const lines = content.split('\n');

      const start = Math.max(0, startLine - 1);
      const end = Math.min(lines.length, endLine);

      return lines.slice(start, end).join('\n');
    } catch (error) {
      console.error('Failed to extract section:', error);
      throw new Error(
        `Failed to extract lines ${startLine}-${endLine}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async getLineCount(file: File): Promise<number> {
    try {
      const content = await this.readFileContent(file);
      return content.split('\n').length;
    } catch (error) {
      console.error('Failed to get line count:', error);
      throw new Error(
        `Failed to get line count: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  isValidTextFile(file: File): boolean {
    const validTypes = [
      'text/plain',
      'text/markdown',
      'application/x-markdown',
    ];

    const validExtensions = ['.txt', '.md', '.markdown'];

    return (
      validTypes.includes(file.type) ||
      validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
    );
  }

  // Markdown-specific methods
  async parseMarkdown(file: File): Promise<Book> {
    const content = await this.readFileContent(file);
    const extractedData = this.extractMarkdownMetadata(content);

    const bookData = createBookFromUpload(
      extractedData.title || file.name.replace(/\.md$/i, ''),
      extractedData.author || 'Unknown Author',
      content,
      'txt',
      {
        ...extractedData.metadata,
        fileSize: file.size,
        originalFileName: file.name,
        format: 'markdown',
      }
    );

    return {
      id: generateId(),
      ...bookData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private extractMarkdownMetadata(content: string): {
    title?: string;
    author?: string;
    metadata: Partial<BookMetadata>;
  } {
    const lines = content.split('\n');
    let title: string | undefined;
    let author: string | undefined;

    // Look for YAML frontmatter
    if (lines[0] === '---') {
      const frontmatterEnd = lines.findIndex(
        (line, index) => index > 0 && line === '---'
      );
      if (frontmatterEnd > 0) {
        const frontmatter = lines.slice(1, frontmatterEnd);
        for (const line of frontmatter) {
          const [key, ...valueParts] = line.split(':');
          const value = valueParts
            .join(':')
            .trim()
            .replace(/^["']|["']$/g, '');

          if (key.trim().toLowerCase() === 'title') {
            title = value;
          } else if (key.trim().toLowerCase() === 'author') {
            author = value;
          }
        }
      }
    }

    // Look for markdown headers if no frontmatter title
    if (!title) {
      const firstHeader = lines.find((line) => line.startsWith('# '));
      if (firstHeader) {
        title = firstHeader.replace(/^#+\s*/, '').trim();
      }
    }

    return {
      title,
      author,
      metadata: {
        language: this.detectLanguage(content),
        wordCount: this.countWords(content),
        fileSize: 0, // Will be set later
      },
    };
  }
}
