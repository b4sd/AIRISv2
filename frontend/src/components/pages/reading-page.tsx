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
import { readingEngine } from '@/services/reading';

interface ReadingPageProps {
  bookId: string;
}

export function ReadingPage({ bookId }: ReadingPageProps) {
  const [book, setBook] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [charPosition, setCharPosition] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showNotes, setShowNotes] = useState(false);

  // Reset character position only when book changes (not on every page scroll)
  useEffect(() => {
    setCharPosition(0);
  }, [book?.content?.chapters]);

  useEffect(() => {
    const init = async () => {
      try {
        const loadedBook = await readingEngine.loadBook(bookId);
        if (loadedBook) {
          setBook(loadedBook);
          const pos = readingEngine.getCurrentPosition();
          setCurrentPage(pos.page);
        }
      } catch (err) {
        console.error('Failed to load book:', err);
      } finally {
        setLoading(false);
      }
    };

    init();

    let unsub: (() => void) | undefined;

    if (readingEngine.onPositionChanged) {
      unsub = readingEngine.onPositionChanged((pos) => {
        setCurrentPage(pos.page);
        setCharPosition(pos.characterOffset ?? 0);
      });
    }

    return () => {
      if (unsub) unsub();
    };
  }, [bookId]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600 dark:text-gray-300">Đang tải sách...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <BookOpenIcon className="mx-auto mb-4 h-16 w-16 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
            Không tìm thấy sách
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Sách với ID "{bookId}" không tồn tại.
          </p>
        </div>
      </div>
    );
  }

  const currentChapter = book.content.chapters.find(
    (ch: any) => currentPage >= ch.startPage && currentPage <= ch.endPage
  );
  const content = currentChapter
    ? currentChapter.content
    : 'Không có nội dung để hiển thị.';

  return (
    <div className="flex h-full flex-col">
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-4xl p-8">
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <div className="whitespace-pre-line leading-relaxed">{content}</div>
          </div>
        </div>
      </div>

      {/* Spotify-style bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-6 py-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          {/* Left: Book info */}
          <div className="hidden min-w-[180px] flex-col md:flex">
            <span className="truncate text-sm font-medium text-gray-900 dark:text-white">
              {book.title}
            </span>
            <span className="truncate text-xs text-gray-600 dark:text-gray-300">
              {book.author} • {book.currentChapter}
            </span>
          </div>

          {/* Center: TTS Controls */}
          <div className="flex flex-1 flex-col items-center space-y-2 px-4">
            <TTSControls
              bookId={bookId}
              currentPage={currentPage}
              totalPages={book.content.totalPages}
              contentLength={content.length}
            />

            {/* Page progress */}
            <div className="flex w-full max-w-xl items-center space-x-2">
              <span className="text-xs text-gray-500">{currentPage}</span>
              <input
                type="range"
                min={1}
                max={book.content.totalPages}
                value={currentPage}
                onChange={(e) => {
                  const page = Number(e.target.value);
                  setCurrentPage(page);
                  readingEngine.navigateToPage(page);
                }}
                className="w-full accent-blue-600"
              />
              <span className="text-xs text-gray-500">
                {book.content.totalPages}
              </span>
            </div>

            {/* Character seek */}
            <div className="flex w-full max-w-xl items-center space-x-2">
              <span className="text-xs text-gray-500">{charPosition}</span>
              <input
                type="range"
                min={0}
                max={content.length}
                value={charPosition}
                onChange={(e) => {
                  const newPos = parseInt(e.target.value, 10);
                  setCharPosition(newPos);
                  if (readingEngine.startTTSFromChar) {
                    readingEngine.startTTSFromChar(currentPage, newPos);
                  }
                }}
                className="w-full accent-blue-600"
              />
              <span className="text-xs text-gray-500">{content.length}</span>
            </div>
          </div>

          {/* Right: Notes toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowNotes(!showNotes)}
              className={`rounded-lg p-2 transition-colors ${
                showNotes
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <DocumentTextIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Notes Panel */}
      {showNotes && (
        <div className="fixed bottom-16 right-0 top-0 w-80 flex-col border-l border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-200 p-4 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Ghi chú
            </h3>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              <DocumentTextIcon className="mx-auto mb-3 h-12 w-12 opacity-50" />
              <p className="text-sm">Chưa có ghi chú nào cho trang này</p>
            </div>
          </div>
          <div className="border-t border-gray-200 p-4 dark:border-gray-700">
            <button className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700">
              <ChatBubbleLeftRightIcon className="mr-2 h-4 w-4" />
              Thêm ghi chú
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
