import { ApiClient } from './client';
import {
  BookUploadRequest,
  BookResponse,
  ReadingPosition,
  ApiResponse,
} from './types';
import { API_ENDPOINTS } from './config';

export class BooksService {
  constructor(private apiClient: ApiClient) {}

  /**
   * Get user's book library with optional filtering
   */
  async getBooks(filters?: {
    search?: string;
    format?: string;
    limit?: number;
    offset?: number;
  }): Promise<BookResponse[]> {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.format) params.append('format', filters.format);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const queryString = params.toString();
    const url = queryString
      ? `${API_ENDPOINTS.BOOKS.LIST}?${queryString}`
      : API_ENDPOINTS.BOOKS.LIST;

    const response = await this.apiClient.get<BookResponse[]>(url);
    return response.data || [];
  }

  /**
   * Get a specific book by ID
   */
  async getBook(bookId: string): Promise<BookResponse> {
    const response = await this.apiClient.get<BookResponse>(
      API_ENDPOINTS.BOOKS.GET(bookId)
    );
    return response.data!;
  }

  /**
   * Upload a new book file
   */
  async uploadBook(
    file: File,
    metadata: {
      title: string;
      author: string;
    },
    onProgress?: (progress: number) => void
  ): Promise<BookResponse> {
    const uploadData = {
      title: metadata.title,
      author: metadata.author,
      format: this.getFileFormat(file.name),
    };

    const response = await this.apiClient.uploadFile<BookResponse>(
      API_ENDPOINTS.BOOKS.UPLOAD,
      file,
      uploadData,
      onProgress
    );

    return response.data!;
  }

  /**
   * Delete a book
   */
  async deleteBook(bookId: string): Promise<void> {
    await this.apiClient.delete(API_ENDPOINTS.BOOKS.DELETE(bookId));
  }

  /**
   * Get book content for reading
   */
  async getBookContent(bookId: string): Promise<{
    content: string;
    chapters: Array<{
      id: string;
      title: string;
      startPage: number;
      endPage: number;
    }>;
    totalPages: number;
  }> {
    const response = await this.apiClient.get(
      API_ENDPOINTS.BOOKS.CONTENT(bookId)
    );
    return response.data!;
  }

  /**
   * Update reading position for a book
   */
  async updateReadingPosition(
    bookId: string,
    position: ReadingPosition
  ): Promise<void> {
    await this.apiClient.post(API_ENDPOINTS.BOOKS.POSITION(bookId), {
      position: {
        page: position.page,
        chapter: position.chapter,
        characterOffset: position.characterOffset,
        percentage: position.percentage,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Get reading position for a book
   */
  async getReadingPosition(bookId: string): Promise<ReadingPosition | null> {
    try {
      const response = await this.apiClient.get<{ position: ReadingPosition }>(
        API_ENDPOINTS.BOOKS.POSITION(bookId)
      );
      return response.data?.position || null;
    } catch (error: any) {
      // Return null if position not found
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Search books by title, author, or content
   */
  async searchBooks(
    query: string,
    options?: {
      searchInContent?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<BookResponse[]> {
    const params = new URLSearchParams();
    params.append('q', query);

    if (options?.searchInContent) params.append('searchInContent', 'true');
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const response = await this.apiClient.get<BookResponse[]>(
      `${API_ENDPOINTS.BOOKS.LIST}?${params.toString()}`
    );
    return response.data || [];
  }

  /**
   * Get book statistics
   */
  async getBookStats(bookId: string): Promise<{
    totalPages: number;
    readPages: number;
    readingProgress: number;
    timeSpent: number;
    lastReadAt: string;
  }> {
    const response = await this.apiClient.get(
      `${API_ENDPOINTS.BOOKS.GET(bookId)}/stats`
    );
    return response.data!;
  }

  /**
   * Update book metadata
   */
  async updateBookMetadata(
    bookId: string,
    metadata: {
      title?: string;
      author?: string;
      tags?: string[];
    }
  ): Promise<BookResponse> {
    const response = await this.apiClient.put<BookResponse>(
      API_ENDPOINTS.BOOKS.GET(bookId),
      metadata
    );
    return response.data!;
  }

  /**
   * Get supported file formats
   */
  getSupportedFormats(): string[] {
    return ['pdf', 'epub', 'txt'];
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File): {
    isValid: boolean;
    error?: string;
  } {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const supportedFormats = this.getSupportedFormats();
    const fileFormat = this.getFileFormat(file.name);

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size must be less than 50MB',
      };
    }

    if (!supportedFormats.includes(fileFormat)) {
      return {
        isValid: false,
        error: `Unsupported file format. Supported formats: ${supportedFormats.join(', ')}`,
      };
    }

    return { isValid: true };
  }

  /**
   * Extract file format from filename
   */
  private getFileFormat(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    return extension || '';
  }

  /**
   * Generate book thumbnail URL
   */
  getThumbnailUrl(
    bookId: string,
    size: 'small' | 'medium' | 'large' = 'medium'
  ): string {
    return `${API_ENDPOINTS.BOOKS.GET(bookId)}/thumbnail?size=${size}`;
  }

  /**
   * Get book download URL
   */
  getDownloadUrl(bookId: string): string {
    return `${API_ENDPOINTS.BOOKS.GET(bookId)}/download`;
  }
}
