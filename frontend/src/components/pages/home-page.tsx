'use client';

import Link from 'next/link';
import {
  BookOpenIcon,
  DocumentTextIcon,
  MicrophoneIcon,
  PlusIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export function HomePage() {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Chào mừng đến với Voice Reading App
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Trải nghiệm đọc sách hoàn toàn mới với công nghệ giọng nói tiên tiến. 
          Điều khiển bằng giọng nói, nghe sách được đọc to, và ghi chú thông minh.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <QuickActionCard
          title="Thêm sách mới"
          description="Tải lên sách từ máy tính hoặc tìm sách trực tuyến"
          icon={PlusIcon}
          href="/library?action=add"
          color="blue"
        />
        <QuickActionCard
          title="Thư viện sách"
          description="Xem tất cả sách đã lưu và tiếp tục đọc"
          icon={BookOpenIcon}
          href="/library"
          color="green"
        />
        <QuickActionCard
          title="Ghi chú của tôi"
          description="Xem và quản lý tất cả ghi chú đã tạo"
          icon={DocumentTextIcon}
          href="/notes"
          color="purple"
        />
        <QuickActionCard
          title="Điều khiển giọng nói"
          description="Cài đặt và kiểm tra tính năng giọng nói"
          icon={MicrophoneIcon}
          href="/voice"
          color="red"
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Hoạt động gần đây
          </h2>
          <ClockIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        </div>
        
        <div className="space-y-3">
          <div className="text-gray-600 dark:text-gray-300 text-center py-8">
            Chưa có hoạt động nào. Hãy bắt đầu bằng cách thêm sách đầu tiên!
          </div>
        </div>
      </div>

      {/* Voice Commands Help */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
          💡 Mẹo sử dụng giọng nói
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
          <div>
            <strong>"Mở sách [tên sách]"</strong> - Mở một cuốn sách
          </div>
          <div>
            <strong>"Đọc to cho tôi nghe"</strong> - Bắt đầu đọc to
          </div>
          <div>
            <strong>"Tóm tắt chương này"</strong> - Tạo tóm tắt chương
          </div>
          <div>
            <strong>"Ghi chú: [nội dung]"</strong> - Tạo ghi chú mới
          </div>
        </div>
      </div>
    </div>
  );
}

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: 'blue' | 'green' | 'purple' | 'red';
}

function QuickActionCard({ title, description, icon: Icon, href, color }: QuickActionCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white',
    purple: 'bg-purple-500 text-white',
    red: 'bg-red-500 text-white',
  };

  return (
    <Link
      href={href}
      className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center space-x-3 mb-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
          {title}
        </h3>
      </div>
      <p className="text-gray-600 dark:text-gray-300 text-sm">
        {description}
      </p>
    </Link>
  );
}