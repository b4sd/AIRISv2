'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import {
  VoiceRecognitionState,
  SpeechSynthesisState,
  CommandIntent,
} from '@/types';
import { speechRecognition } from '@/services/voice/speech-recognition';
import { commandDispatcher } from '@/services/voice/command-dispatcher';

interface VoiceContextType {
  recognition: VoiceRecognitionState;
  synthesis: SpeechSynthesisState;
  updateRecognition: (updates: Partial<VoiceRecognitionState>) => void;
  updateSynthesis: (updates: Partial<SpeechSynthesisState>) => void;
  startListening: () => void;
  stopListening: () => void;
  isSupported: boolean;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

interface VoiceProviderProps {
  children: ReactNode;
}

const initialRecognitionState: VoiceRecognitionState = {
  isListening: false,
  isProcessing: false,
  confidence: 0,
};

const initialSynthesisState: SpeechSynthesisState = {
  isReading: false,
  isPaused: false,
  currentPosition: 0,
  rate: 1,
  volume: 1,
};

export function VoiceProvider({ children }: VoiceProviderProps) {
  const [recognition, setRecognition] = useState<VoiceRecognitionState>(
    initialRecognitionState
  );
  const [synthesis, setSynthesis] = useState<SpeechSynthesisState>(
    initialSynthesisState
  );
  const [isSupported, setIsSupported] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check if speech recognition is supported
    const supported =
      typeof window !== 'undefined' &&
      ((window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition);
    setIsSupported(!!supported);

    if (supported) {
      // Set up speech recognition callbacks
      speechRecognition.onStateChanged((state) => {
        setRecognition((prev) => ({
          ...prev,
          isListening: state.isListening,
          confidence: state.confidence,
          error: state.error,
        }));
      });

      speechRecognition.onCommandReceived(
        (command: string, intent?: CommandIntent) => {
          setRecognition((prev) => ({
            ...prev,
            lastCommand: command,
            lastIntent: intent,
            isProcessing: true,
          }));

          // Execute the command
          if (intent) {
            commandDispatcher.executeCommand(intent).finally(() => {
              setRecognition((prev) => ({
                ...prev,
                isProcessing: false,
              }));
            });
          }
        }
      );

      speechRecognition.onErrorOccurred((error: string) => {
        setRecognition((prev) => ({
          ...prev,
          error,
          isListening: false,
          isProcessing: false,
        }));
      });

      // Set up keyboard shortcuts
      speechRecognition.setupKeyboardShortcuts();

      // Set up TTS callbacks
      const { textToSpeech } = require('@/services/voice/text-to-speech');
      textToSpeech.onStateChanged((ttsState: any) => {
        setSynthesis((prev) => ({
          ...prev,
          isReading: ttsState.isReading,
          isPaused: ttsState.isPaused,
          rate: ttsState.rate,
          volume: ttsState.volume,
          voice: ttsState.voice,
        }));
      });

      // Announce that voice control is ready
      if (supported) {
        setTimeout(() => {
          announceToScreenReader(
            'Điều khiển giọng nói và đọc văn bản đã sẵn sàng. Nhấn phím Space để bắt đầu nghe lệnh.'
          );
        }, 1000);
      }
    }

    return () => {
      speechRecognition.destroy();
    };
  }, []);

  const updateRecognition = (updates: Partial<VoiceRecognitionState>) => {
    setRecognition((prev) => ({ ...prev, ...updates }));
  };

  const updateSynthesis = (updates: Partial<SpeechSynthesisState>) => {
    setSynthesis((prev) => ({ ...prev, ...updates }));
  };

  const startListening = () => {
    if (isSupported) {
      speechRecognition.startListening();
    } else {
      announceToScreenReader(
        'Trình duyệt không hỗ trợ nhận dạng giọng nói. Vui lòng sử dụng Chrome, Edge, hoặc Safari.'
      );
    }
  };

  const stopListening = () => {
    speechRecognition.stopListening();
  };

  const announceToScreenReader = (message: string) => {
    if (typeof window === 'undefined') return;

    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <VoiceContext.Provider
        value={{
          recognition: initialRecognitionState,
          synthesis: initialSynthesisState,
          updateRecognition: () => {},
          updateSynthesis: () => {},
          startListening: () => {},
          stopListening: () => {},
          isSupported: false,
        }}
      >
        {children}
      </VoiceContext.Provider>
    );
  }

  return (
    <VoiceContext.Provider
      value={{
        recognition,
        synthesis,
        updateRecognition,
        updateSynthesis,
        startListening,
        stopListening,
        isSupported,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  const context = useContext(VoiceContext);
  if (context === undefined) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
}
