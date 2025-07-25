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
  const { recognition } = useVoice();

  const themeOptions = [
    { value: 'light', icon: SunIcon, label: 'Sáng' },
    { value: 'dark', icon: MoonIcon, label: 'Tối' },
    { value: 'system', icon: ComputerDesktopIcon, label: 'Hệ thống' },
  ] as const;

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
      {/* Left side - Voice status */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div
            className={cn(
              'flex items-center space-x-2 px-3 py-1 rounded-full text-sm',
              recognition.isListening
                ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200'
                : recognition.isProcessing
                ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            )}
          >
            <MicrophoneIcon className="h-4 w-4" />
            <span>
              {recognition.isListening
                ? 'Đang nghe...'
                : recognition.isProcessing
                ? 'Đang xử lý...'
                : 'Sẵn sàng'}
            </span>
          </div>
          
          {recognition.confidence > 0 && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Độ tin cậy: {Math.round(recognition.confidence * 100)}%
            </div>
          )}
        </div>
      </div>

      {/* Right side - Theme switcher */}
      <div className="flex items-center space-x-2">
        <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {themeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={cn(
                'flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors',
                theme === option.value
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              )}
              title={option.label}
            >
              <option.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{option.label}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}