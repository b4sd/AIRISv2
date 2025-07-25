import * as pdfjsLib from 'pdfjs-dist';
import { Book, BookMetadata } from '@/types';
import { generateId } from '@/lib/utils';
import { createBookFromUpload } from '@/lib/transformers';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export class PDFParser {
  async parseFile(file: File): Promise<Book> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      // Extract metadata
      const metadata = await this.extractMetadata(pdf);
      
      // Extract text content
      const content = await this.extractText(pdf);
      
      // Create book object
      const bookData = createBookFromUpload(
        metadata.title || file.name.replace('.pdf', ''),
        metadata.author || 'Unknown Author',
        content,
        'pdf',
        {
          ...metadata,
          fileSize: file.size,
          originalFileName: file.name,
          totalPages: pdf.numPages,
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
      console.error('PDF parsing error:', error);
      throw new Error(`Failed to parse PDF: ${error.message}`);
    }
  }

  private async extractText(pdf: any): Promise<string> {
    const textPages: string[] = [];
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ')
          .trim();
        
        if (pageText) {
          textPages.push(`--- Trang ${pageNum} ---\n${pageText}\n`);
        }
      } catch (error) {
        console.warn(`Failed to extract text from page ${pageNum}:`, error);
        textPages.push(`--- Trang ${pageNum} ---\n[Không thể đọc nội dung trang]\n`);
      }
    }
    
    return textPages.join('\n');
  }

  private async extractMetadata(pdf: any): Promise<Partial<BookMetadata>> {
    try {
      const metadata = await pdf.getMetadata();
      const info = metadata.info;
      
      return {
        title: info.Title || undefined,
        author: info.Author || undefined,
        publisher: info.Producer || undefined,
        publishedDate: info.CreationDate ? new Date(info.CreationDate).toISOString() : undefined,
        description: info.Subject || undefined,
        language: this.detectLanguage(info.Title, info.Subject),
      };
    } catch (error) {
      console.warn('Failed to extract PDF metadata:', error);
      return {};
    }
  }

  private detectLanguage(title?: string, subject?: string): string {
    const text = `${title || ''} ${subject || ''}`.toLowerCase();
    
    // Simple Vietnamese detection
    const vietnameseChars = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/;
    const vietnameseWords = /\b(và|của|trong|với|cho|từ|đến|về|theo|như|khi|nếu|để|có|là|được|sẽ|đã|đang|các|những|này|đó|tôi|bạn|chúng|họ)\b/;
    
    if (vietnameseChars.test(text) || vietnameseWords.test(text)) {
      return 'vi';
    }
    
    return 'en';
  }

  async extractPageContent(file: File, pageNumber: number): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      if (pageNumber < 1 || pageNumber > pdf.numPages) {
        throw new Error(`Page ${pageNumber} does not exist. PDF has ${pdf.numPages} pages.`);
      }
      
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      
      return textContent.items
        .map((item: any) => item.str)
        .join(' ')
        .trim();
    } catch (error) {
      console.error('Failed to extract page content:', error);
      throw new Error(`Failed to extract page ${pageNumber}: ${error.message}`);
    }
  }

  async getPageCount(file: File): Promise<number> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      return pdf.numPages;
    } catch (error) {
      console.error('Failed to get page count:', error);
      throw new Error(`Failed to get page count: ${error.message}`);
    }
  }

  async extractImages(file: File): Promise<string[]> {
    // This would extract images from PDF for cover detection
    // For now, return empty array
    return [];
  }

  isValidPDF(file: File): boolean {
    return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  }
}