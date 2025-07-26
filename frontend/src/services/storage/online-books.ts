import { Book } from '@/types';
import { generateId } from '@/lib/utils';
import { createBookFromUpload } from '@/lib/transformers';

// Online book source interfaces
export interface OnlineBookSource {
  id: string;
  name: string;
  baseUrl: string;
  searchBooks(query: string): Promise<OnlineBookResult[]>;
  getBookContent(bookId: string): Promise<string>;
  getBookMetadata(bookId: string): Promise<any>;
}

export interface OnlineBookResult {
  id: string;
  title: string;
  author: string;
  description?: string;
  language: string;
  format: 'pdf' | 'epub' | 'txt';
  url: string;
  coverImage?: string;
  source: string;
  downloadUrl?: string;
}

// Project Gutenberg source
export class ProjectGutenbergSource implements OnlineBookSource {
  id = 'gutenberg';
  name = 'Project Gutenberg';
  baseUrl = 'https://www.gutenberg.org';

  async searchBooks(query: string): Promise<OnlineBookResult[]> {
    try {
      // Using Gutenberg's search API
      const searchUrl = `https://gutendex.com/books/?search=${encodeURIComponent(query)}`;
      const response = await fetch(searchUrl);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      return data.results.map((book: any) => ({
        id: book.id.toString(),
        title: book.title,
        author: book.authors.map((a: any) => a.name).join(', ') || 'Unknown',
        description: book.subjects?.join(', '),
        language: book.languages[0] || 'en',
        format: this.getPreferredFormat(book.formats),
        url: `https://www.gutenberg.org/ebooks/${book.id}`,
        coverImage: `https://www.gutenberg.org/cache/epub/${book.id}/pg${book.id}.cover.medium.jpg`,
        source: this.id,
        downloadUrl: this.getDownloadUrl(book.formats),
      }));
    } catch (error) {
      console.error('Project Gutenberg search failed:', error);
      return [];
    }
  }

  async getBookContent(bookId: string): Promise<string> {
    try {
      // Try to get plain text version first
      const textUrl = `https://www.gutenberg.org/files/${bookId}/${bookId}-0.txt`;
      let response = await fetch(textUrl);
      
      if (!response.ok) {
        // Fallback to UTF-8 version
        const utf8Url = `https://www.gutenberg.org/files/${bookId}/${bookId}-8.txt`;
        response = await fetch(utf8Url);
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch book content: ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      console.error('Failed to get book content:', error);
      throw new Error('Failed to download book content');
    }
  }

  async getBookMetadata(bookId: string): Promise<any> {
    try {
      const response = await fetch(`https://gutendex.com/books/${bookId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get book metadata:', error);
      return {};
    }
  }

  private getPreferredFormat(formats: any): 'pdf' | 'epub' | 'txt' {
    if (formats['text/plain']) return 'txt';
    if (formats['application/epub+zip']) return 'epub';
    if (formats['application/pdf']) return 'pdf';
    return 'txt';
  }

  private getDownloadUrl(formats: any): string | undefined {
    return formats['text/plain'] || 
           formats['application/epub+zip'] || 
           formats['application/pdf'];
  }
}

// Vietnamese Wikisource
export class VietnameseWikisourceSource implements OnlineBookSource {
  id = 'vi-wikisource';
  name = 'Vietnamese Wikisource';
  baseUrl = 'https://vi.wikisource.org';

  async searchBooks(query: string): Promise<OnlineBookResult[]> {
    try {
      // Using Wikisource API
      const searchUrl = `https://vi.wikisource.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
      const response = await fetch(searchUrl);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      return data.query.search.map((result: any) => ({
        id: result.pageid.toString(),
        title: result.title,
        author: 'Various', // Wikisource doesn't always have clear author info
        description: result.snippet?.replace(/<[^>]*>/g, ''),
        language: 'vi',
        format: 'txt' as const,
        url: `https://vi.wikisource.org/wiki/${encodeURIComponent(result.title)}`,
        source: this.id,
      }));
    } catch (error) {
      console.error('Vietnamese Wikisource search failed:', error);
      return [];
    }
  }

  async getBookContent(bookId: string): Promise<string> {
    try {
      // Get page content using Wikisource API
      const contentUrl = `https://vi.wikisource.org/w/api.php?action=query&pageids=${bookId}&prop=extracts&exintro=false&explaintext=true&format=json&origin=*`;
      const response = await fetch(contentUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch content: ${response.statusText}`);
      }

      const data = await response.json();
      const page = data.query.pages[bookId];
      
      if (!page || !page.extract) {
        throw new Error('No content found');
      }

      return page.extract;
    } catch (error) {
      console.error('Failed to get Wikisource content:', error);
      throw new Error('Failed to download book content');
    }
  }

  async getBookMetadata(bookId: string): Promise<any> {
    try {
      const response = await fetch(`https://vi.wikisource.org/w/api.php?action=query&pageids=${bookId}&prop=info&format=json&origin=*`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.statusText}`);
      }

      const data = await response.json();
      return data.query.pages[bookId] || {};
    } catch (error) {
      console.error('Failed to get Wikisource metadata:', error);
      return {};
    }
  }
}

// Online Books Manager
export class OnlineBooksManager {
  private sources: OnlineBookSource[] = [
    new ProjectGutenbergSource(),
    new VietnameseWikisourceSource(),
  ];

  async searchAllSources(query: string): Promise<OnlineBookResult[]> {
    const searchPromises = this.sources.map(source => 
      source.searchBooks(query).catch(error => {
        console.error(`Search failed for ${source.name}:`, error);
        return [];
      })
    );

    const results = await Promise.all(searchPromises);
    return results.flat();
  }

  async searchSource(sourceId: string, query: string): Promise<OnlineBookResult[]> {
    const source = this.sources.find(s => s.id === sourceId);
    if (!source) {
      throw new Error(`Unknown source: ${sourceId}`);
    }

    return await source.searchBooks(query);
  }

  async downloadBook(bookResult: OnlineBookResult): Promise<Book> {
    const source = this.sources.find(s => s.id === bookResult.source);
    if (!source) {
      throw new Error(`Unknown source: ${bookResult.source}`);
    }

    try {
      // Get book content and metadata
      const [content, metadata] = await Promise.all([
        source.getBookContent(bookResult.id),
        source.getBookMetadata(bookResult.id),
      ]);

      // Create book object
      const bookData = createBookFromUpload(
        bookResult.title,
        bookResult.author,
        content,
        bookResult.format,
        {
          ...metadata,
          source: bookResult.source,
          originalUrl: bookResult.url,
          coverImage: bookResult.coverImage,
          description: bookResult.description,
          language: bookResult.language,
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
      console.error('Failed to download book:', error);
      throw new Error(`Failed to download book: ${error.message}`);
    }
  }

  getSources(): OnlineBookSource[] {
    return [...this.sources];
  }

  addSource(source: OnlineBookSource): void {
    this.sources.push(source);
  }

  removeSource(sourceId: string): void {
    this.sources = this.sources.filter(s => s.id !== sourceId);
  }
}

// Export singleton instance
export const onlineBooksManager = new OnlineBooksManager();