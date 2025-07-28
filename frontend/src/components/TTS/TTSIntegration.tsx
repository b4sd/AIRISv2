/**
 * TTS Integration Component
 * Integrates the new TTS system with existing reading functionality
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { useTTS } from '../../hooks/useTTS';
import { commandDispatcher } from '../../services/voice/command-dispatcher';

interface TTSIntegrationProps {
  bookId?: string;
  currentText?: string;
  onTTSStateChange?: (isReading: boolean, isPaused: boolean) => void;
}

export const TTSIntegration: React.FC<TTSIntegrationProps> = ({
  bookId,
  currentText = '',
  onTTSStateChange,
}) => {
  const {
    isReading,
    isPaused,
    readText,
    pause,
    resume,
    stop,
    increaseSpeed,
    decreaseSpeed,
    changeVoice,
    getVietnameseVoices,
  } = useTTS();

  const currentTextRef = useRef(currentText);

  // Update current text reference
  useEffect(() => {
    currentTextRef.current = currentText;
  }, [currentText]);

  // Notify parent component of TTS state changes
  useEffect(() => {
    onTTSStateChange?.(isReading, isPaused);
  }, [isReading, isPaused, onTTSStateChange]);

  // Set up voice command integration
  useEffect(() => {
    const handleTTSCommand = async (action: string, params?: any) => {
      try {
        switch (action) {
          case 'start':
            if (currentTextRef.current) {
              await readText(currentTextRef.current);
            } else {
              throw new Error('Không có nội dung để đọc.');
            }
            break;

          case 'pause':
            pause();
            break;

          case 'resume':
            resume();
            break;

          case 'stop':
            stop();
            break;

          case 'increaseSpeed':
            await increaseSpeed();
            break;

          case 'decreaseSpeed':
            await decreaseSpeed();
            break;

          case 'changeVoice':
            const vietnameseVoices = getVietnameseVoices();
            if (vietnameseVoices.length > 0) {
              // Cycle through Vietnamese voices
              await changeVoice(vietnameseVoices[0].id);
            }
            break;

          case 'readSummary':
            // This would be handled by the summary component
            console.log('Read summary command received');
            break;

          default:
            console.warn('Unknown TTS command:', action);
        }
      } catch (error) {
        console.error('TTS command failed:', error);
        // The error will be announced by the audio feedback system
      }
    };

    // Register TTS callback with command dispatcher
    commandDispatcher.setTTSCallback(handleTTSCommand);

    // Set current book ID if provided
    if (bookId) {
      commandDispatcher.setCurrentBook(bookId);
    }

    return () => {
      // Cleanup - stop any ongoing reading
      stop();
    };
  }, [
    bookId,
    readText,
    pause,
    resume,
    stop,
    increaseSpeed,
    decreaseSpeed,
    changeVoice,
    getVietnameseVoices,
  ]);

  // This component doesn't render anything visible
  // It's purely for integration purposes
  return null;
};

export default TTSIntegration;
