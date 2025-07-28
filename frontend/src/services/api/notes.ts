import { ApiClient } from './client';
import {
  NoteRequest,
  NoteResponse,
  ReadingPosition,
  ApiResponse,
} from './types';
import { API_ENDPOINTS } from './config';

export class NotesService {
  constructor(private apiClient: ApiClient) {}

  /**
   * Get all notes for a specific book
   */
  async getNotes(
    bookId: string,
    options?: {
      limit?: number;
      offset?: number;
      sortBy?: 'createdAt' | 'position' | 'updatedAt';
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<NoteResponse[]> {
    const params = new URLSearchParams();

    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    if (options?.sortBy) params.append('sortBy', options.sortBy);
    if (options?.sortOrder) params.append('sortOrder', options.sortOrder);

    const queryString = params.toString();
    const url = queryString
      ? `${API_ENDPOINTS.NOTES.LIST(bookId)}?${queryString}`
      : API_ENDPOINTS.NOTES.LIST(bookId);

    const response = await this.apiClient.get<NoteResponse[]>(url);
    return response.data || [];
  }

  /**
   * Create a new note
   */
  async createNote(
    bookId: string,
    noteData: {
      content: string;
      position: ReadingPosition;
      tags?: string[];
    }
  ): Promise<NoteResponse> {
    const requestData: NoteRequest = {
      bookId,
      content: noteData.content,
      position: {
        ...noteData.position,
        timestamp: new Date().toISOString(),
      },
      tags: noteData.tags || [],
    };

    const response = await this.apiClient.post<NoteResponse>(
      API_ENDPOINTS.NOTES.CREATE(bookId),
      requestData
    );

    return response.data!;
  }

  /**
   * Get a specific note by ID
   */
  async getNote(bookId: string, noteId: string): Promise<NoteResponse> {
    const response = await this.apiClient.get<NoteResponse>(
      API_ENDPOINTS.NOTES.GET(bookId, noteId)
    );
    return response.data!;
  }

  /**
   * Update an existing note
   */
  async updateNote(
    bookId: string,
    noteId: string,
    updates: {
      content?: string;
      tags?: string[];
    }
  ): Promise<NoteResponse> {
    const response = await this.apiClient.put<NoteResponse>(
      API_ENDPOINTS.NOTES.UPDATE(bookId, noteId),
      updates
    );
    return response.data!;
  }

  /**
   * Delete a note
   */
  async deleteNote(bookId: string, noteId: string): Promise<void> {
    await this.apiClient.delete(API_ENDPOINTS.NOTES.DELETE(bookId, noteId));
  }

  /**
   * Search notes within a book
   */
  async searchNotes(
    bookId: string,
    query: string,
    options?: {
      searchInTags?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<NoteResponse[]> {
    const params = new URLSearchParams();
    params.append('q', query);

    if (options?.searchInTags) params.append('searchInTags', 'true');
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const response = await this.apiClient.get<NoteResponse[]>(
      `${API_ENDPOINTS.NOTES.SEARCH(bookId)}?${params.toString()}`
    );
    return response.data || [];
  }

  /**
   * Get notes by position range (e.g., all notes in a chapter)
   */
  async getNotesByPosition(
    bookId: string,
    position: {
      chapter?: string;
      pageStart?: number;
      pageEnd?: number;
    }
  ): Promise<NoteResponse[]> {
    const params = new URLSearchParams();

    if (position.chapter) params.append('chapter', position.chapter);
    if (position.pageStart)
      params.append('pageStart', position.pageStart.toString());
    if (position.pageEnd) params.append('pageEnd', position.pageEnd.toString());

    const response = await this.apiClient.get<NoteResponse[]>(
      `${API_ENDPOINTS.NOTES.LIST(bookId)}?${params.toString()}`
    );
    return response.data || [];
  }

  /**
   * Get notes by tags
   */
  async getNotesByTags(
    bookId: string,
    tags: string[]
  ): Promise<NoteResponse[]> {
    const params = new URLSearchParams();
    tags.forEach((tag) => params.append('tags', tag));

    const response = await this.apiClient.get<NoteResponse[]>(
      `${API_ENDPOINTS.NOTES.LIST(bookId)}?${params.toString()}`
    );
    return response.data || [];
  }

  /**
   * Get all unique tags for a book's notes
   */
  async getNoteTags(bookId: string): Promise<string[]> {
    const response = await this.apiClient.get<{ tags: string[] }>(
      `${API_ENDPOINTS.NOTES.LIST(bookId)}/tags`
    );
    return response.data?.tags || [];
  }

  /**
   * Bulk create notes (useful for importing)
   */
  async bulkCreateNotes(
    bookId: string,
    notes: Array<{
      content: string;
      position: ReadingPosition;
      tags?: string[];
    }>
  ): Promise<NoteResponse[]> {
    const requestData = notes.map((note) => ({
      bookId,
      content: note.content,
      position: {
        ...note.position,
        timestamp: new Date().toISOString(),
      },
      tags: note.tags || [],
    }));

    const response = await this.apiClient.post<NoteResponse[]>(
      `${API_ENDPOINTS.NOTES.CREATE(bookId)}/bulk`,
      { notes: requestData }
    );

    return response.data || [];
  }

  /**
   * Export notes for a book
   */
  async exportNotes(
    bookId: string,
    format: 'json' | 'csv' | 'txt' = 'json'
  ): Promise<Blob> {
    const response = await this.apiClient.get(
      `${API_ENDPOINTS.NOTES.LIST(bookId)}/export?format=${format}`,
      {
        headers: {
          Accept:
            format === 'json'
              ? 'application/json'
              : format === 'csv'
                ? 'text/csv'
                : 'text/plain',
        },
      }
    );

    // Convert response to blob for download
    const blob = new Blob([JSON.stringify(response.data)], {
      type:
        format === 'json'
          ? 'application/json'
          : format === 'csv'
            ? 'text/csv'
            : 'text/plain',
    });

    return blob;
  }

  /**
   * Get note statistics for a book
   */
  async getNoteStats(bookId: string): Promise<{
    totalNotes: number;
    notesPerChapter: Record<string, number>;
    mostUsedTags: Array<{ tag: string; count: number }>;
    averageNoteLength: number;
    notesCreatedThisWeek: number;
  }> {
    const response = await this.apiClient.get(
      `${API_ENDPOINTS.NOTES.LIST(bookId)}/stats`
    );
    return response.data!;
  }

  /**
   * Create a voice note (with transcription)
   */
  async createVoiceNote(
    bookId: string,
    audioBlob: Blob,
    position: ReadingPosition
  ): Promise<NoteResponse> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice-note.webm');
    formData.append(
      'position',
      JSON.stringify({
        ...position,
        timestamp: new Date().toISOString(),
      })
    );
    formData.append('bookId', bookId);

    const response = await this.apiClient.post<NoteResponse>(
      `${API_ENDPOINTS.NOTES.CREATE(bookId)}/voice`,
      formData,
      {
        headers: {
          // Remove Content-Type to let browser set multipart boundary
        },
      }
    );

    return response.data!;
  }

  /**
   * Validate note content
   */
  validateNote(content: string): {
    isValid: boolean;
    error?: string;
  } {
    const maxLength = 10000; // 10k characters
    const minLength = 1;

    if (content.length < minLength) {
      return {
        isValid: false,
        error: 'Note content cannot be empty',
      };
    }

    if (content.length > maxLength) {
      return {
        isValid: false,
        error: `Note content must be less than ${maxLength} characters`,
      };
    }

    return { isValid: true };
  }

  /**
   * Format note content for display
   */
  formatNoteContent(content: string, maxLength?: number): string {
    if (maxLength && content.length > maxLength) {
      return content.substring(0, maxLength) + '...';
    }
    return content;
  }

  /**
   * Get note creation timestamp in user's timezone
   */
  formatNoteTimestamp(timestamp: string, locale: string = 'vi-VN'): string {
    return new Date(timestamp).toLocaleString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
