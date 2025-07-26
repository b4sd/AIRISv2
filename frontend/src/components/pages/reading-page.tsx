'use client';

import { useState, useEffect } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  BookmarkIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';
import { TTSControls } from '@/components/reading/tts-controls';

interface ReadingPageProps {
  bookId: string;
}

export function ReadingPage({ bookId }: ReadingPageProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [showNotes, setShowNotes] = useState(false);
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBook();
  }, [bookId]);

  const loadBook = async () => {
    try {
      const { storageService } = await import('@/services/storage');
      const loadedBook = await storageService.getBook(bookId);
      
      if (loadedBook) {
        setBook(loadedBook);
        setCurrentPage(loadedBook.lastReadPosition.page);
      }
    } catch (error) {
      console.error('Failed to load book:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600 dark:text-gray-300">Đang tải sách...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <BookOpenIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Không tìm thấy sách
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Sách với ID "{bookId}" không tồn tại.
          </p>
        </div>
      </div>
    );
  }

  const currentChapter = book.content.chapters.find((ch: any) => 
    currentPage >= ch.startPage && currentPage <= ch.endPage
  );

  const content = currentChapter ? currentChapter.content : 'Không có nội dung để hiển thị.';

  return (
    <div className="flex h-full">
      {/* Main Reading Area */}
      <div className="flex-1 flex flex-col">
        {/* Book Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {book.title}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {book.author} • {book.currentChapter}
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <BookmarkIcon className="h-5 w-5" />
              </button>
              
              <button
                onClick={() => setShowNotes(!showNotes)}
                className={`p-2 rounded-lg transition-colors ${
                  showNotes
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <DocumentTextIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* TTS Controls */}
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <TTSControls bookId={bookId} />
        </div>

        {/* Reading Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto p-8">
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <div className="whitespace-pre-line leading-relaxed">
                {content}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="h-4 w-4 mr-1" />
              Trang trước
            </button>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Trang {currentPage} / {book.content.totalPages}
              </span>
              
              <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentPage / book.content.totalPages) * 100}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => setCurrentPage(Math.min(book.content.totalPages, currentPage + 1))}
              disabled={currentPage === book.content.totalPages}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Trang sau
              <ChevronRightIcon className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Notes Panel */}
      {showNotes && (
        <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Ghi chú
            </h3>
          </div>
          
          <div className="flex-1 p-4">
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <DocumentTextIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">
                Chưa có ghi chú nào cho trang này
              </p>
              <p className="text-xs mt-1">
                Nói "Ghi chú: [nội dung]" để tạo ghi chú
              </p>
            </div>
          </div>
          
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
              Thêm ghi chú
            </button>
          </div>
        </div>
      )}
    </div>
  );
}