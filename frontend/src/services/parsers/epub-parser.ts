import ePub from 'epubjs';
import { Book, BookMetadata, Chapter } from '@/types';
import { generateId } from '@/lib/utils';
import { createBookFromUpload } from '@/lib/transformers';

export class EPUBParser {
  async parseFile(file: File): Promise<Book> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const book = ePub(arrayBuffer);

      // Load the book
      await book.ready;

      // Extract metadata
      const metadata = await this.extractMetadata(book);

      // Extract content and chapters
      const { content, chapters } = await this.extractContent(book);

      // Extract title and author separately
      const epubMetadata = (book as any).package.metadata;
      const title = epubMetadata.title || file.name.replace('.epub', '');
      const author = this.extractAuthor(epubMetadata);

      // Create book object
      const bookData = createBookFromUpload(title, author, content, 'epub', {
        ...metadata,
        fileSize: file.size,
        originalFileName: file.name,
      });

      // Override chapters with EPUB structure
      bookData.content.chapters = chapters;

      const bookObject: Book = {
        id: generateId(),
        ...bookData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return bookObject;
    } catch (error) {
      console.error('EPUB parsing error:', error);
      throw new Error(
        `Failed to parse EPUB: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async extractMetadata(book: any): Promise<Partial<BookMetadata>> {
    try {
      const metadata = book.package.metadata;

      return {
        publisher: metadata.publisher || undefined,
        publishedDate: metadata.pubdate || undefined,
        description: metadata.description || undefined,
        language:
          metadata.language ||
          this.detectLanguage(metadata.title, metadata.description),
        isbn: this.extractISBN(metadata),
        fileSize: 0, // Will be set by the caller
      };
    } catch (error) {
      console.warn('Failed to extract EPUB metadata:', error);
      return {};
    }
  }

  private extractAuthor(metadata: any): string {
    if (metadata.creator) {
      if (typeof metadata.creator === 'string') {
        return metadata.creator;
      }
      if (Array.isArray(metadata.creator)) {
        return metadata.creator.join(', ');
      }
      if (metadata.creator.name) {
        return metadata.creator.name;
      }
    }
    return 'Unknown Author';
  }

  private extractISBN(metadata: any): string | undefined {
    if (metadata.identifier) {
      if (typeof metadata.identifier === 'string') {
        return metadata.identifier.includes('isbn')
          ? metadata.identifier
          : undefined;
      }
      if (Array.isArray(metadata.identifier)) {
        const isbn = metadata.identifier.find((id: any) =>
          typeof id === 'string' ? id.includes('isbn') : id.scheme === 'ISBN'
        );
        return isbn
          ? typeof isbn === 'string'
            ? isbn
            : isbn.value
          : undefined;
      }
    }
    return undefined;
  }

  private async extractContent(
    book: any
  ): Promise<{ content: string; chapters: Chapter[] }> {
    const chapters: Chapter[] = [];
    const contentParts: string[] = [];
    let pageCounter = 1;

    try {
      // Get spine items (chapters)
      const spine = (book.spine as any).spineItems;

      for (let i = 0; i < spine.length; i++) {
        const spineItem = spine[i];

        try {
          // Load chapter content
          const doc = await spineItem.load(book.load.bind(book));
          const chapterText = this.extractTextFromHTML(doc);

          if (chapterText.trim()) {
            const chapterTitle = this.extractChapterTitle(doc, i + 1);
            const startPage = pageCounter;
            const estimatedPages = Math.max(
              1,
              Math.ceil(chapterText.length / 2000)
            ); // ~2000 chars per page
            const endPage = startPage + estimatedPages - 1;

            chapters.push({
              id: generateId(),
              title: chapterTitle,
              content: chapterText,
              startPage,
              endPage,
            });

            contentParts.push(`--- ${chapterTitle} ---\n${chapterText}\n`);
            pageCounter = endPage + 1;
          }
        } catch (error) {
          console.warn(`Failed to load chapter ${i + 1}:`, error);
          chapters.push({
            id: generateId(),
            title: `Chapter ${i + 1}`,
            content: '[Không thể đọc nội dung chương]',
            startPage: pageCounter,
            endPage: pageCounter,
          });
          pageCounter++;
        }
      }
    } catch (error) {
      console.error('Failed to extract EPUB content:', error);
      throw new Error('Failed to extract book content');
    }

    return {
      content: contentParts.join('\n'),
      chapters:
        chapters.length > 0
          ? chapters
          : [
              {
                id: generateId(),
                title: 'Full Content',
                content: contentParts.join('\n'),
                startPage: 1,
                endPage: Math.max(1, pageCounter - 1),
              },
            ],
    };
  }

  private extractTextFromHTML(doc: Document): string {
    // Remove script and style elements
    const scripts = doc.querySelectorAll('script, style');
    scripts.forEach((el) => el.remove());

    // Get text content
    const textContent = doc.body?.textContent || doc.textContent || '';

    // Clean up whitespace
    return textContent
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
  }

  private extractChapterTitle(doc: Document, chapterNumber: number): string {
    // Try to find chapter title in various ways
    const titleSelectors = [
      'h1',
      'h2',
      'h3',
      '.chapter-title',
      '.title',
      '[class*="title"]',
      '[class*="chapter"]',
    ];

    for (const selector of titleSelectors) {
      const element = doc.querySelector(selector);
      if (element && element.textContent?.trim()) {
        return element.textContent.trim();
      }
    }

    // Fallback to generic chapter name
    return `Chương ${chapterNumber}`;
  }

  private detectLanguage(title?: string, description?: string): string {
    const text = `${title || ''} ${description || ''}`.toLowerCase();

    // Simple Vietnamese detection
    const vietnameseChars =
      /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/;
    const vietnameseWords =
      /\b(và|của|trong|với|cho|từ|đến|về|theo|như|khi|nếu|để|có|là|được|sẽ|đã|đang|các|những|này|đó|tôi|bạn|chúng|họ)\b/;

    if (vietnameseChars.test(text) || vietnameseWords.test(text)) {
      return 'vi';
    }

    return 'en';
  }

  async extractChapterContent(
    file: File,
    chapterIndex: number
  ): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const book = ePub(arrayBuffer);
      await book.ready;

      const spine = (book.spine as any).spineItems;
      if (chapterIndex < 0 || chapterIndex >= spine.length) {
        throw new Error(
          `Chapter ${chapterIndex} does not exist. EPUB has ${spine.length} chapters.`
        );
      }

      const spineItem = spine[chapterIndex];
      const doc = await spineItem.load(book.load.bind(book));

      return this.extractTextFromHTML(doc);
    } catch (error) {
      console.error('Failed to extract chapter content:', error);
      throw new Error(
        `Failed to extract chapter ${chapterIndex}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async getChapterCount(file: File): Promise<number> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const book = ePub(arrayBuffer);
      await book.ready;

      return (book.spine as any).spineItems.length;
    } catch (error) {
      console.error('Failed to get chapter count:', error);
      throw new Error(
        `Failed to get chapter count: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async extractCover(file: File): Promise<string | null> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const book = ePub(arrayBuffer);
      await book.ready;

      const cover = await book.coverUrl();
      return cover || null;
    } catch (error) {
      console.warn('Failed to extract cover:', error);
      return null;
    }
  }

  isValidEPUB(file: File): boolean {
    return (
      file.type === 'application/epub+zip' ||
      file.name.toLowerCase().endsWith('.epub')
    );
  }
}
