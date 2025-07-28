'use client';

import { useState, useEffect } from 'react';
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ForwardIcon,
  BackwardIcon,
} from '@heroicons/react/24/outline';
import { useVoice } from '@/components/providers/voice-provider';
import { textToSpeech } from '@/services/voice/text-to-speech';
import { readingEngine } from '@/services/reading/reading-engine';
import { cn } from '@/lib/utils';

interface TTSControlsProps {
  bookId?: string;
  className?: string;
}

export function TTSControls({ bookId, className }: TTSControlsProps) {
  const { synthesis } = useVoice();
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentVoiceIndex, setCurrentVoiceIndex] = useState(0);

  useEffect(() => {
    // Load available voices
    const loadVoices = () => {
      const voices = textToSpeech.getAvailableVoices();
      setAvailableVoices(voices);
      
      // Prioritize Vietnamese voices
      const vietnameseVoices = textToSpeech.getVietnameseVoices();
      if (vietnameseVoices.length > 0) {
        const currentVoice = voices.find(v => v.name === synthesis.voice);
        if (currentVoice) {
          setCurrentVoiceIndex(voices.indexOf(currentVoice));
        }
      }
    };

    loadVoices();
    
    // Listen for voice changes
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      };
    }
  }, [synthesis.voice]);

  const handlePlayPause = async () => {
    try {
      if (synthesis.isReading) {
        if (synthesis.isPaused) {
          readingEngine.resumeReading();
        } else {
          readingEngine.pauseReading();
        }
      } else {
        await readingEngine.startReading();
      }
    } catch (error) {
      console.error('TTS control error:', error);
    }
  };

  const handleStop = () => {
    readingEngine.stopReading();
  };

  const handleSpeedChange = (delta: number) => {
    const newRate = Math.max(0.1, Math.min(3.0, synthesis.rate + delta));
    readingEngine.adjustSpeed(newRate);
  };

  const handleVolumeChange = (delta: number) => {
    const newVolume = Math.max(0, Math.min(1, synthesis.volume + delta));
    readingEngine.adjustVolume(newVolume);
  };

  const handleVoiceChange = () => {
    readingEngine.changeVoice();
  };

  const getPlayPauseIcon = () => {
    if (synthesis.isReading && !synthesis.isPaused) {
      return PauseIcon;
    }
    return PlayIcon;
  };

  const getPlayPauseLabel = () => {
    if (synthesis.isReading && !synthesis.isPaused) {
      return 'Tạm dừng đọc';
    }
    if (synthesis.isPaused) {
      return 'Tiếp tục đọc';
    }
    return 'Bắt đầu đọc';
  };

  const PlayPauseIcon = getPlayPauseIcon();

  return (
    <div 
      className={cn(
        'flex items-center space-x-2 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700',
        className
      )}
      role="toolbar"
      aria-label="Điều khiển đọc văn bản"
    >
      {/* Play/Pause Button */}
      <button
        onClick={handlePlayPause}
        disabled={!bookId}
        className={cn(
          'flex items-center justify-center w-12 h-12 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500',
          synthesis.isReading && !synthesis.isPaused
            ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800'
            : 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800',
          !bookId && 'opacity-50 cursor-not-allowed'
        )}
        aria-label={getPlayPauseLabel()}
        title={getPlayPauseLabel()}
      >
        <PlayPauseIcon className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Stop Button */}
      <button
        onClick={handleStop}
        disabled={!synthesis.isReading}
        className={cn(
          'flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500',
          !synthesis.isReading && 'opacity-50 cursor-not-allowed'
        )}
        aria-label="Dừng đọc"
        title="Dừng đọc"
      >
        <StopIcon className="h-5 w-5" aria-hidden="true" />
      </button>

      {/* Speed Controls */}
      <div className="flex items-center space-x-1">
        <button
          onClick={() => handleSpeedChange(-0.25)}
          disabled={synthesis.rate <= 0.1}
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500',
            synthesis.rate <= 0.1 && 'opacity-50 cursor-not-allowed'
          )}
          aria-label="Giảm tốc độ đọc"
          title="Giảm tốc độ đọc"
        >
          <BackwardIcon className="h-4 w-4" aria-hidden="true" />
        </button>
        
        <div 
          className="px-2 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[3rem] text-center"
          aria-label={`Tốc độ đọc: ${synthesis.rate.toFixed(1)}x`}
        >
          {synthesis.rate.toFixed(1)}x
        </div>
        
        <button
          onClick={() => handleSpeedChange(0.25)}
          disabled={synthesis.rate >= 3.0}
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500',
            synthesis.rate >= 3.0 && 'opacity-50 cursor-not-allowed'
          )}
          aria-label="Tăng tốc độ đọc"
          title="Tăng tốc độ đọc"
        >
          <ForwardIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Volume Controls */}
      <div className="flex items-center space-x-1">
        <button
          onClick={() => handleVolumeChange(-0.1)}
          disabled={synthesis.volume <= 0}
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500',
            synthesis.volume <= 0 && 'opacity-50 cursor-not-allowed'
          )}
          aria-label="Giảm âm lượng"
          title="Giảm âm lượng"
        >
          <SpeakerXMarkIcon className="h-4 w-4" aria-hidden="true" />
        </button>
        
        <div 
          className="px-2 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[3rem] text-center"
          aria-label={`Âm lượng: ${Math.round(synthesis.volume * 100)}%`}
        >
          {Math.round(synthesis.volume * 100)}%
        </div>
        
        <button
          onClick={() => handleVolumeChange(0.1)}
          disabled={synthesis.volume >= 1}
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500',
            synthesis.volume >= 1 && 'opacity-50 cursor-not-allowed'
          )}
          aria-label="Tăng âm lượng"
          title="Tăng âm lượng"
        >
          <SpeakerWaveIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Voice Selection */}
      <button
        onClick={handleVoiceChange}
        disabled={availableVoices.length <= 1}
        className={cn(
          'px-3 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500',
          availableVoices.length <= 1 && 'opacity-50 cursor-not-allowed'
        )}
        aria-label="Thay đổi giọng đọc"
        title={`Giọng hiện tại: ${synthesis.voice || 'Mặc định'}`}
      >
        Giọng đọc
      </button>

      {/* Reading Status */}
      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
        {synthesis.isReading && (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" aria-hidden="true" />
            <span className="sr-only">Đang đọc</span>
            <span aria-live="polite">
              {synthesis.isPaused ? 'Đã tạm dừng' : 'Đang đọc'}
            </span>
          </div>
        )}
      </div>

      {/* Screen reader instructions */}
      <div className="sr-only" aria-live="polite">
        Sử dụng các nút điều khiển để phát, tạm dừng, điều chỉnh tốc độ và âm lượng đọc. 
        Hoặc sử dụng lệnh giọng nói: "Đọc to", "Tạm dừng", "Tiếp tục", "Đọc nhanh hơn", "Đọc chậm hơn".
      </div>
    </div>
  );
}