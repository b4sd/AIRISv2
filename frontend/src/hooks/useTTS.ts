/**
 * React Hook for Text-to-Speech Integration
 * Provides TTS functionality with accessibility features
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { TTSController } from '../services/tts/TTSController';
import { KeyboardShortcuts } from '../services/accessibility/KeyboardShortcuts';
import {
  TTSSettings,
  ReadingPosition,
  TTSVoice,
  AudioFeedbackSettings,
} from '../services/tts/types';

export interface UseTTSReturn {
  // State
  isReading: boolean;
  isPaused: boolean;
  currentPosition: ReadingPosition | null;
  availableVoices: TTSVoice[];
  settings: TTSSettings;
  currentText: string;

  // Actions
  readText: (
    text: string,
    position?: Partial<ReadingPosition>
  ) => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;

  // Settings
  updateSettings: (settings: Partial<TTSSettings>) => Promise<void>;
  changeVoice: (voiceId: string) => Promise<void>;
  adjustRate: (rate: number) => Promise<void>;
  adjustVolume: (volume: number) => Promise<void>;
  adjustPitch: (pitch: number) => Promise<void>;
  increaseSpeed: () => Promise<void>;
  decreaseSpeed: () => Promise<void>;

  // Voice information
  getCurrentVoiceInfo: () => {
    name: string;
    language: string;
    local: boolean;
  } | null;
  getVietnameseVoices: () => TTSVoice[];
  testCurrentVoice: () => Promise<boolean>;

  // Accessibility
  audioFeedbackSettings: AudioFeedbackSettings;
  updateAudioFeedbackSettings: (
    settings: Partial<AudioFeedbackSettings>
  ) => void;

  // Capabilities
  capabilities: {
    hasVietnameseVoices: boolean;
    voiceCount: number;
    supportsSSML: boolean;
    maxRate: number;
    minRate: number;
  };
}

export const useTTS = (): UseTTSReturn => {
  const ttsControllerRef = useRef<TTSController | null>(null);
  const keyboardShortcutsRef = useRef<KeyboardShortcuts | null>(null);

  const [isReading, setIsReading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPosition, setCurrentPosition] =
    useState<ReadingPosition | null>(null);
  const [availableVoices, setAvailableVoices] = useState<TTSVoice[]>([]);
  const [settings, setSettings] = useState<TTSSettings>({
    rate: 1.0,
    pitch: 1.0,
    volume: 0.8,
    voice: '',
    language: 'vi-VN',
  });
  const [currentText, setCurrentText] = useState('');
  const [audioFeedbackSettings, setAudioFeedbackSettings] =
    useState<AudioFeedbackSettings>({
      enabled: true,
      volume: 0.3,
      successSound: true,
      errorSound: true,
      statusSound: true,
    });
  const [capabilities, setCapabilities] = useState({
    hasVietnameseVoices: false,
    voiceCount: 0,
    supportsSSML: false,
    maxRate: 10,
    minRate: 0.1,
  });

  // Initialize controllers
  useEffect(() => {
    const initializeControllers = async () => {
      // Initialize TTS Controller
      ttsControllerRef.current = new TTSController();
      keyboardShortcutsRef.current = new KeyboardShortcuts();

      // Wait for TTS to initialize
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Load initial data
      if (ttsControllerRef.current) {
        const voices = ttsControllerRef.current.getAvailableVoices();
        const initialSettings = ttsControllerRef.current.getSettings();
        const caps = ttsControllerRef.current.getCapabilities();

        setAvailableVoices(voices);
        setSettings(initialSettings);
        setCapabilities(caps);

        // Set up event listeners
        ttsControllerRef.current.addEventListener('start', () => {
          setIsReading(true);
          setIsPaused(false);
        });

        ttsControllerRef.current.addEventListener('end', () => {
          setIsReading(false);
          setIsPaused(false);
        });

        ttsControllerRef.current.addEventListener('pause', () => {
          setIsPaused(true);
        });

        ttsControllerRef.current.addEventListener('resume', () => {
          setIsPaused(false);
        });

        ttsControllerRef.current.addEventListener('boundary', () => {
          if (ttsControllerRef.current) {
            const position = ttsControllerRef.current.getCurrentPosition();
            setCurrentPosition(position);
          }
        });

        ttsControllerRef.current.addEventListener('error', (event) => {
          console.error('TTS Error:', event.data);
          setIsReading(false);
          setIsPaused(false);
        });
      }

      // Set up keyboard shortcuts
      if (keyboardShortcutsRef.current && ttsControllerRef.current) {
        const ttsController = ttsControllerRef.current;

        keyboardShortcutsRef.current.setTTSHandlers({
          toggleReading: () => {
            if (ttsController.isReading() && !ttsController.isPaused()) {
              ttsController.pause();
            } else if (ttsController.isReading() && ttsController.isPaused()) {
              ttsController.resume();
            } else if (currentText) {
              ttsController.speak(currentText);
            }
          },
          pauseReading: () => {
            if (ttsController.isReading()) {
              ttsController.pause();
            }
          },
          stopReading: () => {
            ttsController.stop();
          },
          increaseSpeed: () => {
            ttsController.increaseRate();
          },
          decreaseSpeed: () => {
            ttsController.decreaseRate();
          },
        });

        keyboardShortcutsRef.current.startListening();
      }
    };

    initializeControllers();

    // Cleanup
    return () => {
      if (ttsControllerRef.current) {
        ttsControllerRef.current.destroy();
      }
      if (keyboardShortcutsRef.current) {
        keyboardShortcutsRef.current.stopListening();
      }
    };
  }, [currentText]);

  // Actions
  const readText = useCallback(
    async (text: string, position?: Partial<ReadingPosition>) => {
      if (ttsControllerRef.current) {
        setCurrentText(text);
        await ttsControllerRef.current.speak(text, position);
      }
    },
    []
  );

  const pause = useCallback(() => {
    if (ttsControllerRef.current) {
      ttsControllerRef.current.pause();
    }
  }, []);

  const resume = useCallback(() => {
    if (ttsControllerRef.current) {
      ttsControllerRef.current.resume();
    }
  }, []);

  const stop = useCallback(() => {
    if (ttsControllerRef.current) {
      ttsControllerRef.current.stop();
    }
  }, []);

  // Settings management
  const updateSettings = useCallback(
    async (newSettings: Partial<TTSSettings>) => {
      if (ttsControllerRef.current) {
        await ttsControllerRef.current.updateSettings(newSettings);
        const updatedSettings = ttsControllerRef.current.getSettings();
        setSettings(updatedSettings);
      }
    },
    []
  );

  const changeVoice = useCallback(async (voiceId: string) => {
    if (ttsControllerRef.current) {
      await ttsControllerRef.current.changeVoice(voiceId);
      const updatedSettings = ttsControllerRef.current.getSettings();
      setSettings(updatedSettings);
    }
  }, []);

  const adjustRate = useCallback(async (rate: number) => {
    if (ttsControllerRef.current) {
      await ttsControllerRef.current.adjustRate(rate);
      const updatedSettings = ttsControllerRef.current.getSettings();
      setSettings(updatedSettings);
    }
  }, []);

  const adjustVolume = useCallback(async (volume: number) => {
    if (ttsControllerRef.current) {
      await ttsControllerRef.current.adjustVolume(volume);
      const updatedSettings = ttsControllerRef.current.getSettings();
      setSettings(updatedSettings);
    }
  }, []);

  const adjustPitch = useCallback(async (pitch: number) => {
    if (ttsControllerRef.current) {
      await ttsControllerRef.current.adjustPitch(pitch);
      const updatedSettings = ttsControllerRef.current.getSettings();
      setSettings(updatedSettings);
    }
  }, []);

  const increaseSpeed = useCallback(async () => {
    if (ttsControllerRef.current) {
      await ttsControllerRef.current.increaseRate();
      const updatedSettings = ttsControllerRef.current.getSettings();
      setSettings(updatedSettings);
    }
  }, []);

  const decreaseSpeed = useCallback(async () => {
    if (ttsControllerRef.current) {
      await ttsControllerRef.current.decreaseRate();
      const updatedSettings = ttsControllerRef.current.getSettings();
      setSettings(updatedSettings);
    }
  }, []);

  // Voice information
  const getCurrentVoiceInfo = useCallback(() => {
    if (ttsControllerRef.current) {
      return ttsControllerRef.current.getCurrentVoiceInfo();
    }
    return null;
  }, []);

  const getVietnameseVoices = useCallback(() => {
    if (ttsControllerRef.current) {
      return ttsControllerRef.current.getVietnameseVoices();
    }
    return [];
  }, []);

  const testCurrentVoice = useCallback(async () => {
    if (ttsControllerRef.current) {
      return await ttsControllerRef.current.testCurrentVoice();
    }
    return false;
  }, []);

  // Audio feedback settings
  const updateAudioFeedbackSettings = useCallback(
    (newSettings: Partial<AudioFeedbackSettings>) => {
      setAudioFeedbackSettings((prev) => ({ ...prev, ...newSettings }));
      // Update the audio feedback service in TTS controller
      if (
        ttsControllerRef.current &&
        (ttsControllerRef.current as any).audioFeedback
      ) {
        (ttsControllerRef.current as any).audioFeedback.updateSettings(
          newSettings
        );
      }
    },
    []
  );

  return {
    // State
    isReading,
    isPaused,
    currentPosition,
    availableVoices,
    settings,
    currentText,

    // Actions
    readText,
    pause,
    resume,
    stop,

    // Settings
    updateSettings,
    changeVoice,
    adjustRate,
    adjustVolume,
    adjustPitch,
    increaseSpeed,
    decreaseSpeed,

    // Voice information
    getCurrentVoiceInfo,
    getVietnameseVoices,
    testCurrentVoice,

    // Accessibility
    audioFeedbackSettings,
    updateAudioFeedbackSettings,

    // Capabilities
    capabilities,
  };
};
