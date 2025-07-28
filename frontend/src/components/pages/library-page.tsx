'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  BookOpenIcon,
  CloudIcon,
} from '@heroicons/react/24/outline';
import { Book } from '@/types';

export function LibraryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'local' | 'online'>('local');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Thư viện sách
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-300">
            Quản lý và đọc sách của bạn
          </p>
        </div>

        <button className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700">
          <PlusIcon className="mr-2 h-5 w-5" />
          Thêm sách
        </button>
      </div>

      {/* Search and Tabs */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm sách..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-gray-900 placeholder-gray-500 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
          />
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
          <button
            onClick={() => setActiveTab('local')}
            className={`flex items-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'local'
                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
            }`}
          >
            <BookOpenIcon className="mr-2 h-4 w-4" />
            Sách của tôi
          </button>
          <button
            onClick={() => setActiveTab('online')}
            className={`flex items-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'online'
                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
            }`}
          >
            <CloudIcon className="mr-2 h-4 w-4" />
            Sách trực tuyến
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-96">
        {activeTab === 'local' ? (
          <LocalBooksView searchQuery={searchQuery} />
        ) : (
          <OnlineBooksView searchQuery={searchQuery} />
        )}
      </div>
    </div>
  );
}

function LocalBooksView({ searchQuery }: { searchQuery: string }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBooks();
  }, [searchQuery]);

  const loadBooks = async () => {
    try {
      const { storageService } = await import('@/services/storage');
      const allBooks = searchQuery
        ? await storageService.searchBooks(searchQuery)
        : await storageService.getAllBooks();
      setBooks(allBooks);
    } catch (error) {
      console.error('Failed to load books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTestBook = async () => {
    try {
      const { storageService } = await import('@/services/storage');
      const { generateId } = await import('@/lib/utils');

      // Create a test book for TTS testing
      const testBook = {
        id: generateId(),
        title: 'Tập 1',
        author: 'Tác giả Test',
        content: {
          chapters: [
            {
              id: generateId(),
              title: 'Chương 1: Giới thiệu',
              content: `Đây là nội dung test để thử nghiệm tính năng đọc văn bản bằng giọng nói. 
            
Chúng ta có thể sử dụng các lệnh giọng nói như "Đọc to cho tôi nghe" để bắt đầu đọc. 

Ứng dụng này được thiết kế đặc biệt cho người khiếm thị, với đầy đủ tính năng hỗ trợ tiếp cận.

Bạn có thể nói "Tạm dừng đọc" để dừng lại, "Tiếp tục đọc" để tiếp tục, hoặc "Đọc nhanh hơn" để tăng tốc độ.

Hãy thử các lệnh giọng nói khác như "Thay đổi giọng đọc" để chọn giọng đọc khác, hoặc "Dừng đọc" để dừng hoàn toàn.`,
              startPage: 1,
              endPage: 1,
            },
          ],
          totalPages: 1,
          format: 'txt' as const,
        },
        metadata: {
          language: 'vi',
          fileSize: 500,
          wordCount: 80,
        },
        lastReadPosition: {
          page: 1,
          chapter: 'Chương 1: Giới thiệu',
          characterOffset: 0,
          percentage: 0,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await storageService.saveBook(testBook);

      // Reload books
      await loadBooks();
    } catch (error) {
      console.error('Failed to add test book:', error);
      alert(
        'Không thể thêm sách test: ' +
          (error instanceof Error ? error.message : String(error))
      );
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Đang tải sách...
        </p>
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="py-12 text-center">
        <BookOpenIcon className="mx-auto mb-4 h-16 w-16 text-gray-400" />
        <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
          {searchQuery ? 'Không tìm thấy sách nào' : 'Chưa có sách nào'}
        </h3>
        <p className="mb-6 text-gray-600 dark:text-gray-300">
          {searchQuery
            ? `Không có sách nào khớp với "${searchQuery}"`
            : 'Thêm sách test để thử nghiệm tính năng đọc giọng nói'}
        </p>
        {!searchQuery && (
          <button
            onClick={handleAddTestBook}
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            <PlusIcon className="mr-2 h-5 w-5" />
            Thêm sách test
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {books.map((book) => (
        <div
          key={book.id}
          className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="mb-4 flex items-start justify-between">
            <div className="flex-1">
              <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
                {book.title}
              </h3>
              <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">
                {book.author}
              </p>
              <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                <span>{book.content.totalPages} trang</span>
                <span>•</span>
                <span>{book.content.format.toUpperCase()}</span>
                <span>•</span>
                <span>{book.lastReadPosition.percentage}% đã đọc</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Link
              href={`/read/${book.id}`}
              className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-2 text-sm text-white transition-colors hover:bg-blue-700"
            >
              <BookOpenIcon className="mr-1 h-4 w-4" />
              Đọc sách
            </Link>

            <div className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(book.updatedAt).toLocaleDateString('vi-VN')}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function OnlineBooksView({ searchQuery }: { searchQuery: string }) {
  return (
    <div className="py-12 text-center">
      <CloudIcon className="mx-auto mb-4 h-16 w-16 text-gray-400" />
      <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
        Tìm kiếm sách trực tuyến
      </h3>
      <p className="mb-6 text-gray-600 dark:text-gray-300">
        Nhập từ khóa để tìm kiếm sách từ các nguồn trực tuyến
      </p>
      {searchQuery && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Đang tìm kiếm: "{searchQuery}"
        </div>
      )}
    </div>
  );
}
