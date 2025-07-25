'use client';

import { useVoice } from '@/components/providers/voice-provider';
import { MicrophoneIcon } from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';

export function VoiceIndicator() {
  const { recognition } = useVoice();

  if (!recognition.isListening && !recognition.isProcessing) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        className={cn(
          'flex items-center space-x-2 px-4 py-2 rounded-full shadow-lg border',
          recognition.isListening
            ? 'bg-red-500 text-white border-red-600 animate-pulse'
            : 'bg-yellow-500 text-white border-yellow-600'
        )}
      >
        <MicrophoneIcon className="h-5 w-5" />
        <span className="text-sm font-medium">
          {recognition.isListening ? 'Đang nghe...' : 'Đang xử lý...'}
        </span>
        
        {recognition.confidence > 0 && (
          <div className="text-xs opacity-90">
            {Math.round(recognition.confidence * 100)}%
          </div>
        )}
      </div>
      
      {recognition.lastCommand && (
        <div className="mt-2 px-3 py-1 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Lệnh cuối: {recognition.lastCommand}
          </div>
        </div>
      )}
    </div>
  );
}