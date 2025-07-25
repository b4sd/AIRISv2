'use client';

import { useState } from 'react';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  BookOpenIcon,
  CloudIcon,
} from '@heroicons/react/24/outline';

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
  return (
    <div className="text-center py-12">
      <BookOpenIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Chưa có sách nào
      </h3>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Bắt đầu bằng cách thêm sách đầu tiên vào thư viện của bạn
      </p>
      <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
        <PlusIcon className="h-5 w-5 mr-2" />
        Thêm sách đầu tiên
      </button>
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