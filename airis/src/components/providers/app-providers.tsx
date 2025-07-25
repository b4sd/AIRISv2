'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from './theme-provider';
import { VoiceProvider } from './voice-provider';
import { StorageProvider } from './storage-provider';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <StorageProvider>
        <VoiceProvider>
          {children}
        </VoiceProvider>
      </StorageProvider>
    </ThemeProvider>
  );
}