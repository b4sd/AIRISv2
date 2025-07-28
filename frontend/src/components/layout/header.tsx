'use client';

import { useTheme } from '@/components/providers/theme-provider';
import { useVoice } from '@/components/providers/voice-provider';
import {
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  MicrophoneIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

export function Header() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { recognition, startListening, stopListening, isSupported } = useVoice();

  const themeOptions = [
    { value: 'light', icon: SunIcon, label: 'Sáng' },
    { value: 'dark', icon: MoonIcon, label: 'Tối' },
    { value: 'system', icon: ComputerDesktopIcon, label: 'Hệ thống' },
  ] as const;

  const handleVoiceToggle = () => {
    if (recognition.isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
      {/* Left side - Voice controls */}
      <div className="flex items-center space-x-4">
        {/* Voice activation button */}
        <button
          onClick={handleVoiceToggle}
          disabled={!isSupported}
          className={cn(
            'flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500',
            recognition.isListening
              ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800'
              : recognition.isProcessing
              ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200'
              : isSupported
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed',
            !isSupported && 'opacity-50'
          )}
          aria-label={
            recognition.isListening 
              ? 'Dừng nghe lệnh giọng nói' 
              : 'Bắt đầu nghe lệnh giọng nói'
          }
          title={
            !isSupported 
              ? 'Trình duyệt không hỗ trợ nhận dạng giọng nói'
              : recognition.isListening 
              ? 'Nhấn để dừng nghe (hoặc phím Escape)'
              : 'Nhấn để bắt đầu nghe (hoặc phím Space)'
          }
        >
          <MicrophoneIcon className="h-4 w-4" aria-hidden="true" />
          <span>
            {!isSupported
              ? 'Không hỗ trợ'
              : recognition.isListening
              ? 'Đang nghe...'
              : recognition.isProcessing
              ? 'Đang xử lý...'
              : 'Giọng nói'}
          </span>
        </button>
        
        {/* Confidence indicator */}
        {recognition.confidence > 0 && (
          <div 
            className="text-xs text-gray-500 dark:text-gray-400"
            aria-label={`Độ tin cậy nhận dạng: ${Math.round(recognition.confidence * 100)} phần trăm`}
          >
            Độ tin cậy: {Math.round(recognition.confidence * 100)}%
          </div>
        )}

        {/* Voice instructions for screen readers */}
        <div className="sr-only" aria-live="polite">
          {isSupported && (
            'Điều khiển giọng nói đã sẵn sàng. Sử dụng phím Space để bắt đầu nghe lệnh.'
          )}
        </div>
      </div>

      {/* Right side - Theme switcher and accessibility controls */}
      <div className="flex items-center space-x-4">
        {/* Skip to main content link for screen readers */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-lg z-50"
        >
          Chuyển đến nội dung chính
        </a>

        {/* Theme switcher */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1" role="radiogroup" aria-label="Chọn chủ đề giao diện">
          {themeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={cn(
                'flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500',
                theme === option.value
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              )}
              role="radio"
              aria-checked={theme === option.value}
              aria-label={`Chuyển sang chủ đề ${option.label}`}
              title={`Chủ đề ${option.label}`}
            >
              <option.icon className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">{option.label}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}