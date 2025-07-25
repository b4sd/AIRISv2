import { Book, BookParser as IBookParser } from '@/types';
import { PDFParser } from './pdf-parser';
import { EPUBParser } from './epub-parser';
import { TextParser } from './text-parser';
import { validateFile } from '@/lib/validation';

export class BookParser implements IBookParser {
  private pdfParser = new PDFParser();
  private epubParser = new EPUBParser();
  private textParser = new TextParser();

  async parseFile(file: File): Promise<Book> {
    // Validate file first
    const validation = validateFile(file);
    if (!validation.success) {
      throw new Error(`Invalid file: ${validation.error.message}`);
    }

    const format = this.detectFormat(file);
    
    try {
      switch (format) {
        case 'pdf':
          return await this.pdfParser.parseFile(file);
        case 'epub':
          return await this.epubParser.parseFile(file);
        case 'txt':
          return await this.textParser.parseFile(file);
        default:
          throw new Error(`Unsupported file format: ${format}`);
      }
    } catch (error) {
      console.error('Book parsing failed:', error);
      throw new Error(`Failed to parse ${format.toUpperCase()} file: ${error.message}`);
    }
  }

  async extractText(file: File): Promise<string> {
    const format = this.detectFormat(file);
    
    try {
      switch (format) {
        case 'pdf': {
          const book = await this.pdfParser.parseFile(file);
          return book.content.chapters.map(ch => ch.content).join('\n\n');
        }
        case 'epub': {
          const book = await this.epubParser.parseFile(file);
          return book.content.chapters.map(ch => ch.content).join('\n\n');
        }
        case 'txt': {
          const book = await this.textParser.parseFile(file);
          return book.content.chapters.map(ch => ch.content).join('\n\n');
        }
        default:
          throw new Error(`Unsupported file format: ${format}`);
      }
    } catch (error) {
      console.error('Text extraction failed:', error);
      throw new Error(`Failed to extract text from ${format.toUpperCase()} file: ${error.message}`);
    }
  }

  async extractMetadata(file: File): Promise<any> {
    const format = this.detectFormat(file);
    
    try {
      const book = await this.parseFile(file);
      return book.metadata;
    } catch (error) {
      console.error('Metadata extraction failed:', error);
      throw new Error(`Failed to extract metadata from ${format.toUpperCase()} file: ${error.message}`);
    }
  }

  detectFormat(file: File): string {
    // Check by MIME type first
    if (file.type === 'application/pdf') return 'pdf';
    if (file.type === 'application/epub+zip') return 'epub';
    if (file.type === 'text/plain' || file.type.startsWith('text/')) return 'txt';

    // Check by file extension
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.pdf')) return 'pdf';
    if (fileName.endsWith('.epub')) return 'epub';
    if (fileName.endsWith('.txt') || fileName.endsWith('.md') || fileName.endsWith('.markdown')) return 'txt';

    // Default to text for unknown types
    return 'txt';
  }

  isSupported(file: File): boolean {
    const format = this.detectFormat(file);
    return ['pdf', 'epub', 'txt'].includes(format);
  }

  getSupportedFormats(): string[] {
    return ['pdf', 'epub', 'txt', 'md', 'markdown'];
  }

  getSupportedMimeTypes(): string[] {
    return [
      'application/pdf',
      'application/epub+zip',
      'text/plain',
      'text/markdown',
      'application/x-markdown',
    ];
  }

  // Format-specific methods
  async getPageCount(file: File): Promise<number> {
    const format = this.detectFormat(file);
    
    switch (format) {
      case 'pdf':
        return await this.pdfParser.getPageCount(file);
      case 'epub':
        return await this.epubParser.getChapterCount(file);
      case 'txt':
        return await this.textParser.getLineCount(file);
      default:
        throw new Error(`Page count not supported for format: ${format}`);
    }
  }

  async extractPageContent(file: File, pageNumber: number): Promise<string> {
    const format = this.detectFormat(file);
    
    switch (format) {
      case 'pdf':
        return await this.pdfParser.extractPageContent(file, pageNumber);
      case 'epub':
        return await this.epubParser.extractChapterContent(file, pageNumber - 1);
      case 'txt':
        // For text files, treat each "page" as ~50 lines
        const linesPerPage = 50;
        const startLine = (pageNumber - 1) * linesPerPage + 1;
        const endLine = pageNumber * linesPerPage;
        return await this.textParser.extractSection(file, startLine, endLine);
      default:
        throw new Error(`Page content extraction not supported for format: ${format}`);
    }
  }

  async extractCover(file: File): Promise<string | null> {
    const format = this.detectFormat(file);
    
    switch (format) {
      case 'epub':
        return await this.epubParser.extractCover(file);
      case 'pdf':
        // PDF cover extraction would be implemented here
        return null;
      case 'txt':
        // Text files don't have covers
        return null;
      default:
        return null;
    }
  }

  // Validation methods
  validateFileSize(file: File, maxSizeMB: number = 50): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  }

  validateFileName(fileName: string): boolean {
    // Check for valid characters and reasonable length
    const validNamePattern = /^[a-zA-Z0-9\s\-_\.\(\)\[\]àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+$/;
    return fileName.length > 0 && 
           fileName.length <= 255 && 
           validNamePattern.test(fileName);
  }

  // Utility methods
  getFileInfo(file: File): {
    name: string;
    size: number;
    type: string;
    format: string;
    isSupported: boolean;
    estimatedPages?: number;
  } {
    const format = this.detectFormat(file);
    const isSupported = this.isSupported(file);
    
    // Rough page estimation based on file size and format
    let estimatedPages: number | undefined;
    if (isSupported) {
      switch (format) {
        case 'pdf':
          estimatedPages = Math.ceil(file.size / (50 * 1024)); // ~50KB per page
          break;
        case 'epub':
          estimatedPages = Math.ceil(file.size / (30 * 1024)); // ~30KB per page
          break;
        case 'txt':
          estimatedPages = Math.ceil(file.size / (2 * 1024)); // ~2KB per page
          break;
      }
    }

    return {
      name: file.name,
      size: file.size,
      type: file.type,
      format,
      isSupported,
      estimatedPages,
    };
  }

  // Error handling
  getParsingError(error: Error, file: File): string {
    const format = this.detectFormat(file);
    
    if (error.message.includes('Invalid PDF')) {
      return 'Tệp PDF bị hỏng hoặc không hợp lệ. Vui lòng thử tệp PDF khác.';
    }
    
    if (error.message.includes('EPUB')) {
      return 'Tệp EPUB bị hỏng hoặc không hợp lệ. Vui lòng thử tệp EPUB khác.';
    }
    
    if (error.message.includes('encoding')) {
      return 'Không thể đọc tệp văn bản. Vui lòng đảm bảo tệp sử dụng mã hóa UTF-8.';
    }
    
    if (error.message.includes('size')) {
      return 'Tệp quá lớn. Vui lòng chọn tệp nhỏ hơn 50MB.';
    }
    
    return `Không thể đọc tệp ${format.toUpperCase()}: ${error.message}`;
  }
}

// Export singleton instance
export const bookParser = new BookParser();