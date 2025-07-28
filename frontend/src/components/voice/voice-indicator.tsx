'use client';

import { useVoice } from '@/components/providers/voice-provider';
import { MicrophoneIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';

export function VoiceIndicator() {
  const { recognition, isSupported } = useVoice();

  // Always show if there's an error or if voice is not supported
  const shouldShow = recognition.isListening || 
                    recognition.isProcessing || 
                    recognition.error || 
                    !isSupported;

  if (!shouldShow) {
    return null;
  }

  const getStatusInfo = () => {
    if (!isSupported) {
      return {
        icon: ExclamationTriangleIcon,
        text: 'Không hỗ trợ giọng nói',
        className: 'bg-gray-500 text-white border-gray-600',
        ariaLabel: 'Trình duyệt không hỗ trợ nhận dạng giọng nói',
      };
    }

    if (recognition.error) {
      return {
        icon: ExclamationTriangleIcon,
        text: 'Lỗi giọng nói',
        className: 'bg-red-600 text-white border-red-700',
        ariaLabel: `Lỗi nhận dạng giọng nói: ${recognition.error}`,
      };
    }

    if (recognition.isListening) {
      return {
        icon: MicrophoneIcon,
        text: 'Đang nghe...',
        className: 'bg-red-500 text-white border-red-600 animate-pulse',
        ariaLabel: 'Đang nghe lệnh giọng nói',
      };
    }

    if (recognition.isProcessing) {
      return {
        icon: MicrophoneIcon,
        text: 'Đang xử lý...',
        className: 'bg-yellow-500 text-white border-yellow-600',
        ariaLabel: 'Đang xử lý lệnh giọng nói',
      };
    }

    return {
      icon: MicrophoneIcon,
      text: 'Sẵn sàng',
      className: 'bg-green-500 text-white border-green-600',
      ariaLabel: 'Nhận dạng giọng nói sẵn sàng',
    };
  };

  const statusInfo = getStatusInfo();
  const IconComponent = statusInfo.icon;

  return (
    <div className="fixed top-4 right-4 z-50" role="status" aria-live="polite">
      <div
        className={cn(
          'flex items-center space-x-2 px-4 py-2 rounded-full shadow-lg border focus:outline-none focus:ring-2 focus:ring-blue-500',
          statusInfo.className
        )}
        aria-label={statusInfo.ariaLabel}
        tabIndex={0}
      >
        <IconComponent className="h-5 w-5" aria-hidden="true" />
        <span className="text-sm font-medium">
          {statusInfo.text}
        </span>
        
        {recognition.confidence > 0 && (
          <div className="text-xs opacity-90" aria-label={`Độ tin cậy ${Math.round(recognition.confidence * 100)} phần trăm`}>
            {Math.round(recognition.confidence * 100)}%
          </div>
        )}
      </div>
      
      {/* Command feedback */}
      {recognition.lastCommand && (
        <div 
          className="mt-2 px-3 py-1 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700"
          role="log"
          aria-live="polite"
        >
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <span className="sr-only">Lệnh vừa nhận dạng: </span>
            Lệnh cuối: {recognition.lastCommand}
          </div>
        </div>
      )}

      {/* Error message */}
      {recognition.error && (
        <div 
          className="mt-2 px-3 py-1 bg-red-50 dark:bg-red-900/20 rounded-lg shadow-md border border-red-200 dark:border-red-800"
          role="alert"
          aria-live="assertive"
        >
          <div className="text-xs text-red-700 dark:text-red-300">
            <span className="sr-only">Lỗi: </span>
            {recognition.error}
          </div>
        </div>
      )}

      {/* Instructions for screen readers */}
      <div className="sr-only" aria-live="polite">
        {isSupported && !recognition.error && (
          'Nhấn phím Space để bắt đầu nghe lệnh giọng nói. Nhấn Escape để dừng nghe. Nhấn Ctrl+H để nghe hướng dẫn.'
        )}
      </div>
    </div>
  );
}