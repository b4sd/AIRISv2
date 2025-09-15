'use client';

import {
  ReadingEngine as IReadingEngine,
  Book,
  ReadingPosition,
} from '@/types';
import { textToSpeech } from '@/services/voice/text-to-speech';
import { storageService } from '@/services/storage';

export class ReadingEngineService implements IReadingEngine {
  private currentBook: Book | null = null;
  private currentPosition: ReadingPosition = {
    page: 1,
    chapter: '',
    characterOffset: 0,
    percentage: 0,
  };

  // Callbacks for UI updates
  private onPositionChange?: (position: ReadingPosition) => void;
  private onBookChange?: (book: Book | null) => void;
  private onReadingStateChange?: (
    isReading: boolean,
    isPaused: boolean
  ) => void;

  constructor() {
    // Set up TTS callbacks
    textToSpeech.onStateChanged((state) => {
      this.onReadingStateChange?.(state.isReading, state.isPaused);
    });

    textToSpeech.onPositionChanged((position, text) => {
      this.updateReadingPosition(position, text);
    });
  }

  public async loadBook(bookId: string): Promise<Book> {
    try {
      const book = await storageService.getBook(bookId);
      if (!book) {
        throw new Error(`Không tìm thấy sách với ID: ${bookId}`);
      }

      this.currentBook = book;
      this.currentPosition = { ...book.lastReadPosition };

      this.onBookChange?.(book);
      this.announceToScreenReader(
        `Đã mở sách: ${book.title} của tác giả ${book.author}`
      );

      return book;
    } catch (error) {
      console.error('Failed to load book:', error);
      throw new Error(
        `Không thể mở sách: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  public navigateToPage(pageNumber: number): void {
    if (!this.currentBook) {
      throw new Error('Chưa có sách nào được mở');
    }

    const totalPages = this.currentBook.content.totalPages;
    if (pageNumber < 1 || pageNumber > totalPages) {
      throw new Error(`Số trang không hợp lệ. Sách có ${totalPages} trang.`);
    }

    // Find the chapter containing this page
    const chapter = this.findChapterByPage(pageNumber);

    this.currentPosition = {
      page: pageNumber,
      chapter: chapter?.title || '',
      characterOffset: 0,
      percentage: Math.round((pageNumber / totalPages) * 100),
    };

    this.savePosition();
    this.onPositionChange?.(this.currentPosition);
    this.announceToScreenReader(`Đã chuyển đến trang ${pageNumber}`);
  }

  public navigateToChapter(chapterName: string): void {
    if (!this.currentBook) {
      throw new Error('Chưa có sách nào được mở');
    }

    const chapter = this.currentBook.content.chapters.find(
      (ch) =>
        ch.title.toLowerCase().includes(chapterName.toLowerCase()) ||
        ch.id === chapterName
    );

    if (!chapter) {
      throw new Error(`Không tìm thấy chương: ${chapterName}`);
    }

    this.currentPosition = {
      page: chapter.startPage,
      chapter: chapter.title,
      characterOffset: 0,
      percentage: Math.round(
        (chapter.startPage / this.currentBook.content.totalPages) * 100
      ),
    };

    this.savePosition();
    this.onPositionChange?.(this.currentPosition);
    this.announceToScreenReader(`Đã chuyển đến ${chapter.title}`);
  }

  public getCurrentPosition(): ReadingPosition {
    return { ...this.currentPosition };
  }

  public async startReading(): Promise<void> {
    if (!this.currentBook) {
      throw new Error('Chưa có sách nào được mở để đọc');
    }

    try {
      const content = this.getCurrentPageContent();
      if (!content.trim()) {
        throw new Error('Không có nội dung để đọc trên trang này');
      }

      await textToSpeech.readPage(content);
      this.announceToScreenReader('Bắt đầu đọc trang hiện tại');
    } catch (error) {
      console.error('Failed to start reading:', error);
      throw new Error(
        `Không thể bắt đầu đọc: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  public pauseReading(): void {
    textToSpeech.pause();
    this.announceToScreenReader('Đã tạm dừng đọc');
  }

  public resumeReading(): void {
    textToSpeech.resume();
    this.announceToScreenReader('Tiếp tục đọc');
  }

  public stopReading(): void {
    textToSpeech.stop();
    this.announceToScreenReader('Đã dừng đọc');
  }

  public adjustSpeed(speed: number): void {
    const clampedSpeed = Math.max(0.1, Math.min(3.0, speed));
    textToSpeech.setRate(clampedSpeed);
    this.announceToScreenReader(
      `Đã điều chỉnh tốc độ đọc: ${clampedSpeed.toFixed(1)}x`
    );
  }

  public adjustVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    textToSpeech.setVolume(clampedVolume);
    this.announceToScreenReader(
      `Đã điều chỉnh âm lượng: ${Math.round(clampedVolume * 100)}%`
    );
  }

  public changeVoice(): void {
    textToSpeech.nextVoice();
    // The TTS service will announce the voice change
  }

  // Navigation helpers
  public async nextPage(): Promise<void> {
    if (!this.currentBook) {
      throw new Error('Chưa có sách nào được mở');
    }

    const nextPage = this.currentPosition.page + 1;
    if (nextPage > this.currentBook.content.totalPages) {
      this.announceToScreenReader('Đã đến trang cuối của sách');
      return;
    }

    this.navigateToPage(nextPage);
  }

  public async previousPage(): Promise<void> {
    if (!this.currentBook) {
      throw new Error('Chưa có sách nào được mở');
    }

    const prevPage = this.currentPosition.page - 1;
    if (prevPage < 1) {
      this.announceToScreenReader('Đã ở trang đầu của sách');
      return;
    }

    this.navigateToPage(prevPage);
  }

  public async nextChapter(): Promise<void> {
    if (!this.currentBook) {
      throw new Error('Chưa có sách nào được mở');
    }

    const currentChapter = this.getCurrentChapter();
    if (!currentChapter) {
      throw new Error('Không xác định được chương hiện tại');
    }

    const chapters = this.currentBook.content.chapters;
    const currentIndex = chapters.findIndex(
      (ch) => ch.id === currentChapter.id
    );

    if (currentIndex === -1 || currentIndex >= chapters.length - 1) {
      this.announceToScreenReader('Đã ở chương cuối của sách');
      return;
    }

    const nextChapter = chapters[currentIndex + 1];
    this.navigateToChapter(nextChapter.title);
  }

  public async previousChapter(): Promise<void> {
    if (!this.currentBook) {
      throw new Error('Chưa có sách nào được mở');
    }

    const currentChapter = this.getCurrentChapter();
    if (!currentChapter) {
      throw new Error('Không xác định được chương hiện tại');
    }

    const chapters = this.currentBook.content.chapters;
    const currentIndex = chapters.findIndex(
      (ch) => ch.id === currentChapter.id
    );

    if (currentIndex <= 0) {
      this.announceToScreenReader('Đã ở chương đầu của sách');
      return;
    }

    const prevChapter = chapters[currentIndex - 1];
    this.navigateToChapter(prevChapter.title);
  }

  // Reading specific content
  public async readCurrentChapter(): Promise<void> {
    if (!this.currentBook) {
      throw new Error('Chưa có sách nào được mở');
    }

    const chapter = this.getCurrentChapter();
    if (!chapter) {
      throw new Error('Không tìm thấy chương hiện tại');
    }

    try {
      await textToSpeech.readChapter(chapter.content, chapter.title);
      this.announceToScreenReader(`Bắt đầu đọc ${chapter.title}`);
    } catch (error) {
      console.error('Failed to read chapter:', error);
      throw new Error(
        `Không thể đọc chương: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  public async readFromPosition(startPosition: number): Promise<void> {
    if (!this.currentBook) {
      throw new Error('Chưa có sách nào được mở');
    }

    const content = this.getCurrentPageContent();
    const remainingContent = content.substring(startPosition);

    if (!remainingContent.trim()) {
      throw new Error('Không có nội dung để đọc từ vị trí này');
    }

    try {
      await textToSpeech.speak(remainingContent);
    } catch (error) {
      console.error('Failed to read from position:', error);
      throw new Error(
        `Không thể đọc từ vị trí này: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // Content helpers
  private getCurrentPageContent(): string {
    if (!this.currentBook) return '';

    const chapter = this.getCurrentChapter();
    if (!chapter) return '';

    // For simplicity, we'll return the entire chapter content
    // In a real implementation, you'd extract the specific page content
    return chapter.content;
  }

  private getCurrentChapter() {
    if (!this.currentBook) return null;

    return this.currentBook.content.chapters.find(
      (chapter) =>
        this.currentPosition.page >= chapter.startPage &&
        this.currentPosition.page <= chapter.endPage
    );
  }

  private findChapterByPage(pageNumber: number) {
    if (!this.currentBook) return null;

    return this.currentBook.content.chapters.find(
      (chapter) =>
        pageNumber >= chapter.startPage && pageNumber <= chapter.endPage
    );
  }

  private updateReadingPosition(characterOffset: number, text: string): void {
    if (!this.currentBook) return;

    // Estimate page progress based on character position
    const progress = text.length > 0 ? characterOffset / text.length : 0;
    const pageProgress = Math.min(progress * 100, 100);

    this.currentPosition = {
      ...this.currentPosition,
      characterOffset,
      percentage: Math.round(
        ((this.currentPosition.page - 1) /
          this.currentBook.content.totalPages) *
          100 +
          pageProgress / this.currentBook.content.totalPages
      ),
    };

    this.onPositionChange?.(this.currentPosition);
  }

  private async savePosition(): Promise<void> {
    if (!this.currentBook) return;

    try {
      const updatedBook = {
        ...this.currentBook,
        lastReadPosition: this.currentPosition,
        updatedAt: new Date(),
      };

      await storageService.saveBook(updatedBook);
      this.currentBook = updatedBook;
    } catch (error) {
      console.error('Failed to save reading position:', error);
    }
  }

  // Event listeners
  public onPositionChanged(
    callback: (position: ReadingPosition) => void
  ): () => void {
    this.onPositionChange = callback;

    // ✅ return cleanup function
    return () => {
      if (this.onPositionChange === callback) {
        this.onPositionChange = undefined;
      }
    };
  }

  public onBookChanged(callback: (book: Book | null) => void): void {
    this.onBookChange = callback;
  }

  public onReadingStateChanged(
    callback: (isReading: boolean, isPaused: boolean) => void
  ): void {
    this.onReadingStateChange = callback;
  }

  // Utility methods
  public getCurrentBook(): Book | null {
    return this.currentBook;
  }

  public getReadingProgress(): number {
    return this.currentPosition.percentage;
  }

  public getTotalPages(): number {
    return this.currentBook?.content.totalPages || 0;
  }

  public getCurrentPageNumber(): number {
    return this.currentPosition.page;
  }

  public isReading(): boolean {
    return textToSpeech.getCurrentState().isReading;
  }

  public isPaused(): boolean {
    return textToSpeech.getCurrentState().isPaused;
  }

  private announceToScreenReader(message: string): void {
    if (typeof document === 'undefined') return;

    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  }

  /**
   * Start TTS from a specific character position on a given page.
   * @param page Page number (1-based)
   * @param charOffset Character offset within the page
   */
  /**
   * Start TTS from a specific character position on a given page.
   * Uses the same textToSpeech service so state stays in sync.
   * @param page Page number (1-based)
   * @param charOffset Character offset within the page
   */
  public async startTTSFromChar(
    page: number,
    charOffset: number
  ): Promise<void> {
    if (!this.currentBook) {
      throw new Error('Chưa có sách nào được mở');
    }

    const totalPages = this.currentBook.content.totalPages;
    if (page < 1 || page > totalPages) {
      throw new Error(`Số trang không hợp lệ. Sách có ${totalPages} trang.`);
    }

    const chapter = this.findChapterByPage(page);
    if (!chapter) {
      throw new Error('Không tìm thấy chương cho trang này');
    }

    // ⚠️ FIX: get *page* content instead of entire chapter
    const fullContent = this.getCurrentPageContent();
    if (charOffset < 0 || charOffset >= fullContent.length) {
      throw new Error('Vị trí ký tự không hợp lệ');
    }

    // Update reading position
    this.currentPosition = {
      page,
      chapter: chapter.title,
      characterOffset: charOffset,
      percentage: Math.round((page / totalPages) * 100),
    };

    await this.savePosition();
    this.onPositionChange?.(this.currentPosition);

    // Extract substring from offset
    const remainingContent = fullContent.substring(charOffset);
    if (!remainingContent.trim()) {
      this.announceToScreenReader('Không có nội dung để đọc từ vị trí này');
      return;
    }

    try {
      // ✅ Use the same TTS service for consistency
      await textToSpeech.speak(remainingContent);
      this.announceToScreenReader('Bắt đầu đọc từ vị trí đã chọn');
    } catch (error) {
      console.error('Failed to start TTS from char:', error);
      throw new Error(
        `Không thể bắt đầu đọc: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Start TTS from a specific character position on a given page.
   * @param page Page number (1-based)
   * @param charPosition Character offset within the page
   */

  // Cleanup
  public destroy(): void {
    textToSpeech.destroy();
    this.currentBook = null;
  }
}

// Export singleton instance
export const readingEngine = new ReadingEngineService();
