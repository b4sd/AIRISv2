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
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { useVoice } from '@/components/providers/voice-provider';
import { textToSpeech } from '@/services/voice/text-to-speech';
import { readingEngine } from '@/services/reading/reading-engine';
import { cn } from '@/lib/utils';

interface TTSControlsProps {
  bookId?: string;
  currentPage?: number;
  totalPages?: number;
  contentLength?: number;
  className?: string;
}

export function TTSControls({
  bookId,
  currentPage = 1,
  totalPages = 1,
  contentLength = 0,
  className,
}: TTSControlsProps) {
  const { synthesis } = useVoice();
  const [availableVoices, setAvailableVoices] = useState<
    SpeechSynthesisVoice[]
  >([]);
  const [currentVoiceIndex, setCurrentVoiceIndex] = useState(0);
  const [charPosition, setCharPosition] = useState(0);

  useEffect(() => {
    const loadVoices = () => {
      const voices = textToSpeech.getAvailableVoices();
      setAvailableVoices(voices);

      const vietnameseVoices = textToSpeech.getVietnameseVoices();
      if (vietnameseVoices.length > 0) {
        const currentVoice = voices.find((v) => v.name === synthesis.voice);
        if (currentVoice) {
          setCurrentVoiceIndex(voices.indexOf(currentVoice));
        }
      }
    };

    loadVoices();

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

  const handleSeek = (value: number) => {
    setCharPosition(value);
    if (readingEngine.startTTSFromChar) {
      readingEngine.startTTSFromChar(currentPage, value);
    }
  };

  const PlayPauseIcon =
    synthesis.isReading && !synthesis.isPaused ? PauseIcon : PlayIcon;

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-6 py-3 shadow-lg dark:border-gray-700 dark:bg-gray-800',
        className
      )}
      role="toolbar"
      aria-label="Thanh điều khiển đọc văn bản"
    >
      <div className="flex flex-col space-y-2">
        {/* Controls */}
        <div className="flex items-center justify-center space-x-4">
          {/* Previous Page */}
          <button
            onClick={() =>
              readingEngine.navigateToPage(Math.max(1, currentPage - 1))
            }
            disabled={currentPage === 1}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>

          {/* Play / Pause */}
          <button
            onClick={handlePlayPause}
            disabled={!bookId}
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500',
              synthesis.isReading && !synthesis.isPaused
                ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900 dark:text-red-400 dark:hover:bg-red-800'
                : 'bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-400 dark:hover:bg-blue-800',
              !bookId && 'cursor-not-allowed opacity-50'
            )}
          >
            <PlayPauseIcon className="h-6 w-6" />
          </button>

          {/* Next Page */}
          <button
            onClick={() =>
              readingEngine.navigateToPage(
                Math.min(totalPages, currentPage + 1)
              )
            }
            disabled={currentPage === totalPages}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <ChevronRightIcon className="h-6 w-6" />
          </button>

          {/* Speed Control */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleSpeedChange(-0.25)}
              className="px-2 py-1"
            >
              -
            </button>
            <span className="text-sm">{synthesis.rate.toFixed(1)}x</span>
            <button
              onClick={() => handleSpeedChange(0.25)}
              className="px-2 py-1"
            >
              +
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center space-x-1">
            <button onClick={() => handleVolumeChange(-0.1)}>
              <SpeakerXMarkIcon className="h-5 w-5" />
            </button>
            <span className="text-sm">
              {Math.round(synthesis.volume * 100)}%
            </span>
            <button onClick={() => handleVolumeChange(0.1)}>
              <SpeakerWaveIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Voice Selection */}
          <button
            onClick={handleVoiceChange}
            className="rounded bg-gray-100 px-3 py-1 text-sm dark:bg-gray-700"
          >
            Giọng đọc
          </button>
        </div>

        {/* Seek Bar */}
        <div className="flex items-center space-x-4">
          <span className="text-xs text-gray-500">{charPosition}</span>
          <input
            type="range"
            min={0}
            max={contentLength}
            value={charPosition}
            onChange={(e) => handleSeek(Number(e.target.value))}
            className="w-full accent-blue-600"
          />
          <span className="text-xs text-gray-500">{contentLength}</span>
        </div>
      </div>
    </div>
  );
}
