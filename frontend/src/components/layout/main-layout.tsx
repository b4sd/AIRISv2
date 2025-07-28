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
      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-lg z-50"
      >
        Chuyển đến nội dung chính
      </a>

      {/* Voice Indicator - Fixed position */}
      <VoiceIndicator />
      
      {/* Main Layout */}
      <div className="flex h-screen">
        {/* Navigation Sidebar */}
        <nav role="navigation" aria-label="Điều hướng chính">
          <Sidebar />
        </nav>
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <Header />
          
          {/* Page Content */}
          <main 
            id="main-content"
            className="flex-1 overflow-auto"
            role="main"
            aria-label="Nội dung chính"
            tabIndex={-1}
          >
            <div className="container mx-auto px-4 py-6 max-w-7xl">
              {/* Announce page changes to screen readers */}
              <div className="sr-only" aria-live="polite" id="page-announcement">
                Nội dung trang đã được tải
              </div>
              
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Live region for voice announcements */}
      <div 
        id="voice-announcements" 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
      ></div>
      
      {/* Live region for urgent announcements */}
      <div 
        id="urgent-announcements" 
        className="sr-only" 
        aria-live="assertive" 
        aria-atomic="true"
      ></div>
    </div>
  );
}