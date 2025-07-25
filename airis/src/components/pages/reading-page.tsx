'use client';

import { useState } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlayIcon,
  PauseIcon,
  BookmarkIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';

interface ReadingPageProps {
  bookId: string;
}

export function ReadingPage({ bookId }: ReadingPageProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isReading, setIsReading] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  // Mock data - will be replaced with real data from storage
  const book = {
    id: bookId,
    title: 'Sách mẫu',
    author: 'Tác giả mẫu',
    totalPages: 100,
    currentChapter: 'Chương 1: Giới thiệu',
  };

  const mockContent = `
    Đây là nội dung mẫu của trang ${currentPage}. 
    
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
    
    Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
    
    Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
  `;

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
              <button
                onClick={() => setIsReading(!isReading)}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isReading
                    ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200'
                    : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                }`}
              >
                {isReading ? (
                  <>
                    <PauseIcon className="h-4 w-4 mr-1" />
                    Dừng đọc
                  </>
                ) : (
                  <>
                    <PlayIcon className="h-4 w-4 mr-1" />
                    Đọc to
                  </>
                )}
              </button>
              
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

        {/* Reading Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto p-8">
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <div className="whitespace-pre-line leading-relaxed">
                {mockContent}
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
                Trang {currentPage} / {book.totalPages}
              </span>
              
              <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentPage / book.totalPages) * 100}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => setCurrentPage(Math.min(book.totalPages, currentPage + 1))}
              disabled={currentPage === book.totalPages}
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