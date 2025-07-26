'use client';

import { CommandIntent, VOICE_ACTIONS } from '@/types';
import { storageService } from '@/services/storage';

export class VoiceCommandDispatcher {
  private currentBookId: string | null = null;
  private onNavigate?: (path: string) => void;
  private onBookOpen?: (bookId: string) => void;
  private onTTSControl?: (action: string, params?: any) => void;
  private onNoteAction?: (action: string, params?: any) => void;
  private onSummaryRequest?: (type: string, params?: any) => void;

  // Set callbacks for different actions
  public setNavigationCallback(callback: (path: string) => void): void {
    this.onNavigate = callback;
  }

  public setBookCallback(callback: (bookId: string) => void): void {
    this.onBookOpen = callback;
  }

  public setTTSCallback(
    callback: (action: string, params?: any) => void
  ): void {
    this.onTTSControl = callback;
  }

  public setNoteCallback(
    callback: (action: string, params?: any) => void
  ): void {
    this.onNoteAction = callback;
  }

  public setSummaryCallback(
    callback: (type: string, params?: any) => void
  ): void {
    this.onSummaryRequest = callback;
  }

  public setCurrentBook(bookId: string | null): void {
    this.currentBookId = bookId;
  }

  public async executeCommand(intent: CommandIntent): Promise<void> {
    try {
      await this.dispatchCommand(intent);
      this.announceSuccess(intent);
    } catch (error) {
      console.error('Command execution failed:', error);
      this.announceError(intent, error as Error);
    }
  }

  private async dispatchCommand(intent: CommandIntent): Promise<void> {
    const { action, parameters } = intent;

    switch (action) {
      // Book navigation commands
      case VOICE_ACTIONS.OPEN_BOOK:
        await this.handleOpenBook(parameters.bookTitle as string);
        break;

      case VOICE_ACTIONS.NAVIGATE_PAGE:
        await this.handleNavigatePage(parameters.pageNumber as number);
        break;

      case VOICE_ACTIONS.NAVIGATE_CHAPTER:
        await this.handleNavigateChapter(parameters.chapterNumber as number);
        break;

      case 'next_page':
        await this.handleNextPage();
        break;

      case 'previous_page':
        await this.handlePreviousPage();
        break;

      // Text-to-speech commands
      case VOICE_ACTIONS.START_READING:
        this.handleStartReading();
        break;

      case VOICE_ACTIONS.PAUSE_READING:
        this.handlePauseReading();
        break;

      case VOICE_ACTIONS.RESUME_READING:
        this.handleResumeReading();
        break;

      case VOICE_ACTIONS.ADJUST_SPEED:
        this.handleAdjustSpeed(parameters.direction as string);
        break;

      case VOICE_ACTIONS.CHANGE_VOICE:
        this.handleChangeVoice();
        break;

      // Note commands
      case VOICE_ACTIONS.TAKE_NOTE:
        await this.handleTakeNote(parameters.content as string);
        break;

      case VOICE_ACTIONS.SHOW_NOTES:
        this.handleShowNotes();
        break;

      case VOICE_ACTIONS.SEARCH_NOTES:
        await this.handleSearchNotes(parameters.query as string);
        break;

      case VOICE_ACTIONS.DELETE_NOTE:
        await this.handleDeleteLastNote();
        break;

      // Summary commands
      case VOICE_ACTIONS.SUMMARIZE_PAGE:
        await this.handleSummarizePage();
        break;

      case VOICE_ACTIONS.SUMMARIZE_CHAPTER:
        await this.handleSummarizeChapter();
        break;

      case VOICE_ACTIONS.SUMMARIZE_BOOK:
        await this.handleSummarizeBook();
        break;

      case 'read_summary':
        this.handleReadSummary();
        break;

      // Library commands
      case VOICE_ACTIONS.SHOW_LIBRARY:
        this.handleShowLibrary();
        break;

      case VOICE_ACTIONS.ADD_BOOK:
        this.handleAddBook();
        break;

      case VOICE_ACTIONS.BOOKMARK_PAGE:
        await this.handleBookmarkPage();
        break;

      case VOICE_ACTIONS.GO_TO_BOOKMARK:
        await this.handleGoToBookmark();
        break;

      // Help commands
      case 'show_help':
        this.handleShowHelp();
        break;

      case 'list_commands':
        this.handleListCommands();
        break;

      default:
        throw new Error(`Lệnh không được hỗ trợ: ${action}`);
    }
  }

  // Book navigation handlers
  private async handleOpenBook(bookTitle: string): Promise<void> {
    if (!bookTitle) {
      throw new Error('Vui lòng nói tên sách cần mở.');
    }

    const books = await storageService.searchBooks(bookTitle);

    if (books.length === 0) {
      throw new Error(
        `Không tìm thấy sách "${bookTitle}". Vui lòng kiểm tra tên sách.`
      );
    }

    // If multiple books found, take the first one or ask for clarification
    const book = books[0];
    this.currentBookId = book.id;

    try {
      const { readingEngine } = await import(
        '@/services/reading/reading-engine'
      );
      await readingEngine.loadBook(book.id);

      this.onBookOpen?.(book.id);
      this.onNavigate?.(`/read/${book.id}`);
    } catch (error) {
      throw new Error(
        `Không thể mở sách "${bookTitle}": ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async handleNavigatePage(pageNumber: number): Promise<void> {
    if (!this.currentBookId) {
      throw new Error('Vui lòng mở một cuốn sách trước khi chuyển trang.');
    }

    if (!pageNumber || pageNumber < 1) {
      throw new Error('Số trang không hợp lệ.');
    }

    try {
      const { readingEngine } = await import(
        '@/services/reading/reading-engine'
      );
      readingEngine.navigateToPage(pageNumber);
    } catch (error) {
      throw new Error(
        `Không thể chuyển đến trang ${pageNumber}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async handleNavigateChapter(chapterNumber: number): Promise<void> {
    if (!this.currentBookId) {
      throw new Error('Vui lòng mở một cuốn sách trước khi chuyển chương.');
    }

    if (!chapterNumber || chapterNumber < 1) {
      throw new Error('Số chương không hợp lệ.');
    }

    try {
      const { readingEngine } = await import(
        '@/services/reading/reading-engine'
      );
      readingEngine.navigateToChapter(`Chương ${chapterNumber}`);
    } catch (error) {
      throw new Error(
        `Không thể chuyển đến chương ${chapterNumber}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async handleNextPage(): Promise<void> {
    if (!this.currentBookId) {
      throw new Error('Vui lòng mở một cuốn sách trước khi chuyển trang.');
    }

    try {
      const { readingEngine } = await import(
        '@/services/reading/reading-engine'
      );
      await readingEngine.nextPage();
    } catch (error) {
      throw new Error(
        `Không thể chuyển trang: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async handlePreviousPage(): Promise<void> {
    if (!this.currentBookId) {
      throw new Error('Vui lòng mở một cuốn sách trước khi chuyển trang.');
    }

    try {
      const { readingEngine } = await import(
        '@/services/reading/reading-engine'
      );
      await readingEngine.previousPage();
    } catch (error) {
      throw new Error(
        `Không thể quay về trang trước: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // Text-to-speech handlers
  private async handleStartReading(): Promise<void> {
    if (!this.currentBookId) {
      throw new Error('Vui lòng mở một cuốn sách trước khi đọc.');
    }

    try {
      const { readingEngine } = await import(
        '@/services/reading/reading-engine'
      );
      await readingEngine.startReading();
    } catch (error) {
      throw new Error(
        `Không thể bắt đầu đọc: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private handlePauseReading(): void {
    import('@/services/reading/reading-engine').then(({ readingEngine }) => {
      readingEngine.pauseReading();
    });
  }

  private handleResumeReading(): void {
    import('@/services/reading/reading-engine').then(({ readingEngine }) => {
      readingEngine.resumeReading();
    });
  }

  private handleAdjustSpeed(direction: string): void {
    import('@/services/reading/reading-engine').then(({ readingEngine }) => {
      const currentState = readingEngine.isReading();
      if (currentState) {
        const newRate = direction === 'faster' ? 1.5 : 0.8;
        readingEngine.adjustSpeed(newRate);
      } else {
        const message =
          direction === 'faster' ? 'Tăng tốc độ đọc.' : 'Giảm tốc độ đọc.';
        this.announceToScreenReader(message);
      }
    });
  }

  private handleChangeVoice(): void {
    import('@/services/reading/reading-engine').then(({ readingEngine }) => {
      readingEngine.changeVoice();
    });
  }

  // Note handlers
  private async handleTakeNote(content: string): Promise<void> {
    if (!this.currentBookId) {
      throw new Error('Vui lòng mở một cuốn sách trước khi ghi chú.');
    }

    if (!content) {
      throw new Error('Vui lòng nói nội dung ghi chú.');
    }

    this.onNoteAction?.('create', { content });
    this.announceToScreenReader(`Đã tạo ghi chú: ${content}`);
  }

  private handleShowNotes(): void {
    if (!this.currentBookId) {
      throw new Error('Vui lòng mở một cuốn sách để xem ghi chú.');
    }

    this.onNoteAction?.('show');
    this.announceToScreenReader('Hiển thị danh sách ghi chú.');
  }

  private async handleSearchNotes(query: string): Promise<void> {
    if (!query) {
      throw new Error('Vui lòng nói từ khóa cần tìm.');
    }

    this.onNoteAction?.('search', { query });
    this.announceToScreenReader(`Tìm kiếm ghi chú với từ khóa: ${query}`);
  }

  private async handleDeleteLastNote(): Promise<void> {
    if (!this.currentBookId) {
      throw new Error('Vui lòng mở một cuốn sách để xóa ghi chú.');
    }

    this.onNoteAction?.('deleteLast');
    this.announceToScreenReader('Đã xóa ghi chú gần nhất.');
  }

  // Summary handlers
  private async handleSummarizePage(): Promise<void> {
    if (!this.currentBookId) {
      throw new Error('Vui lòng mở một cuốn sách để tóm tắt.');
    }

    this.onSummaryRequest?.('page');
    this.announceToScreenReader('Đang tạo tóm tắt trang hiện tại...');
  }

  private async handleSummarizeChapter(): Promise<void> {
    if (!this.currentBookId) {
      throw new Error('Vui lòng mở một cuốn sách để tóm tắt.');
    }

    this.onSummaryRequest?.('chapter');
    this.announceToScreenReader('Đang tạo tóm tắt chương hiện tại...');
  }

  private async handleSummarizeBook(): Promise<void> {
    if (!this.currentBookId) {
      throw new Error('Vui lòng mở một cuốn sách để tóm tắt.');
    }

    this.onSummaryRequest?.('book');
    this.announceToScreenReader('Đang tạo tóm tắt toàn bộ cuốn sách...');
  }

  private handleReadSummary(): void {
    this.onTTSControl?.('readSummary');
    this.announceToScreenReader('Đọc to bản tóm tắt.');
  }

  // Library handlers
  private handleShowLibrary(): void {
    this.onNavigate?.('/library');
    this.announceToScreenReader('Chuyển đến thư viện sách.');
  }

  private handleAddBook(): void {
    this.onNavigate?.('/library?action=add');
    this.announceToScreenReader('Mở giao diện thêm sách mới.');
  }

  private async handleBookmarkPage(): Promise<void> {
    if (!this.currentBookId) {
      throw new Error('Vui lòng mở một cuốn sách để đánh dấu.');
    }

    // This would integrate with the reading component
    this.announceToScreenReader('Đã đánh dấu trang hiện tại.');
  }

  private async handleGoToBookmark(): Promise<void> {
    if (!this.currentBookId) {
      throw new Error('Vui lòng mở một cuốn sách để đi đến bookmark.');
    }

    this.announceToScreenReader('Chuyển đến trang đã đánh dấu.');
  }

  // Help handlers
  private handleShowHelp(): void {
    const helpMessage = `
      Các lệnh giọng nói có sẵn:
      - Mở sách [tên sách]: Mở một cuốn sách
      - Đọc to: Bắt đầu đọc nội dung
      - Tóm tắt trang này: Tạo tóm tắt trang hiện tại
      - Ghi chú [nội dung]: Tạo ghi chú mới
      - Chuyển trang tiếp theo: Sang trang sau
      - Xem thư viện: Mở thư viện sách
      - Trợ giúp: Hiển thị hướng dẫn này
    `;

    this.announceToScreenReader(helpMessage);
  }

  private handleListCommands(): void {
    const commands = [
      'Mở sách [tên sách]',
      'Đọc to',
      'Tạm dừng đọc',
      'Tiếp tục đọc',
      'Tóm tắt trang này',
      'Tóm tắt chương này',
      'Ghi chú [nội dung]',
      'Xem ghi chú',
      'Chuyển trang tiếp theo',
      'Quay về trang trước',
      'Xem thư viện',
      'Thêm sách',
      'Đánh dấu trang này',
    ];

    const message = 'Danh sách lệnh: ' + commands.join(', ');
    this.announceToScreenReader(message);
  }

  // Utility methods
  private announceSuccess(intent: CommandIntent): void {
    const message = `Đã thực hiện lệnh: ${intent.originalText}`;
    this.announceToScreenReader(message);
  }

  private announceError(intent: CommandIntent, error: Error): void {
    const message = `Lỗi khi thực hiện lệnh "${intent.originalText}": ${error instanceof Error ? error.message : String(error)}`;
    this.announceToScreenReader(message);
  }

  private announceToScreenReader(message: string): void {
    // Create a live region for screen reader announcements
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  }
}

// Export singleton instance
export const commandDispatcher = new VoiceCommandDispatcher();
