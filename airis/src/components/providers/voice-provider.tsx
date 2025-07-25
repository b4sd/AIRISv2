'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { VoiceRecognitionState, SpeechSynthesisState } from '@/types';

interface VoiceContextType {
  recognition: VoiceRecognitionState;
  synthesis: SpeechSynthesisState;
  updateRecognition: (updates: Partial<VoiceRecognitionState>) => void;
  updateSynthesis: (updates: Partial<SpeechSynthesisState>) => void;
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
  const [recognition, setRecognition] = useState<VoiceRecognitionState>(initialRecognitionState);
  const [synthesis, setSynthesis] = useState<SpeechSynthesisState>(initialSynthesisState);

  const updateRecognition = (updates: Partial<VoiceRecognitionState>) => {
    setRecognition(prev => ({ ...prev, ...updates }));
  };

  const updateSynthesis = (updates: Partial<SpeechSynthesisState>) => {
    setSynthesis(prev => ({ ...prev, ...updates }));
  };

  return (
    <VoiceContext.Provider
      value={{
        recognition,
        synthesis,
        updateRecognition,
        updateSynthesis,
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