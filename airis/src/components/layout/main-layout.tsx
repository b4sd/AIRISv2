'use client';

import { ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { VoiceIndicator } from '@/components/voice/voice-indicator';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Voice Indicator - Fixed position */}
      <VoiceIndicator />
      
      {/* Main Layout */}
      <div className="flex h-screen">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <Header />
          
          {/* Page Content */}
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto px-4 py-6 max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}