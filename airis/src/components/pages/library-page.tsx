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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Thư viện sách
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Quản lý và đọc sách của bạn
          </p>
        </div>
        
        <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <PlusIcon className="h-5 w-5 mr-2" />
          Thêm sách
        </button>
      </div>

      {/* Search and Tabs */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm sách..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('local')}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'local'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <BookOpenIcon className="h-4 w-4 mr-2" />
            Sách của tôi
          </button>
          <button
            onClick={() => setActiveTab('online')}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'online'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <CloudIcon className="h-4 w-4 mr-2" />
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
          chapters: [{
            id: generateId(),
            title: 'Chương 1: Giới thiệu',
            content: `Đây là nội dung test để thử nghiệm tính năng đọc văn bản bằng giọng nói. 
            
Chúng ta có thể sử dụng các lệnh giọng nói như "Đọc to cho tôi nghe" để bắt đầu đọc. 

Ứng dụng này được thiết kế đặc biệt cho người khiếm thị, với đầy đủ tính năng hỗ trợ tiếp cận.

Bạn có thể nói "Tạm dừng đọc" để dừng lại, "Tiếp tục đọc" để tiếp tục, hoặc "Đọc nhanh hơn" để tăng tốc độ.

Hãy thử các lệnh giọng nói khác như "Thay đổi giọng đọc" để chọn giọng đọc khác, hoặc "Dừng đọc" để dừng hoàn toàn.`,
            startPage: 1,
            endPage: 1,
          }],
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
      alert('Không thể thêm sách test: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 dark:text-gray-300 mt-2">Đang tải sách...</p>
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpenIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {searchQuery ? 'Không tìm thấy sách nào' : 'Chưa có sách nào'}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {searchQuery 
            ? `Không có sách nào khớp với "${searchQuery}"`
            : 'Thêm sách test để thử nghiệm tính năng đọc giọng nói'
          }
        </p>
        {!searchQuery && (
          <button 
            onClick={handleAddTestBook}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Thêm sách test
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {books.map((book) => (
        <div
          key={book.id}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {book.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                {book.author}
              </p>
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-2">
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
              className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              <BookOpenIcon className="h-4 w-4 mr-1" />
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
    <div className="text-center py-12">
      <CloudIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Tìm kiếm sách trực tuyến
      </h3>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
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