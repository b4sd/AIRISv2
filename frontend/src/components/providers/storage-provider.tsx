'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { storageService } from '@/services/storage';
import { UserPreferences, DEFAULT_PREFERENCES } from '@/types';

interface StorageContextType {
  preferences: UserPreferences;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

interface StorageProviderProps {
  children: ReactNode;
}

export function StorageProvider({ children }: StorageProviderProps) {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const prefs = await storageService.getPreferences();
      setPreferences(prefs);
    } catch (err) {
      console.error('Failed to load preferences:', err);
      setError('Failed to load preferences');
      setPreferences(DEFAULT_PREFERENCES);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    try {
      const updatedPreferences = {
        ...preferences,
        ...updates,
        lastUpdated: new Date(),
      };
      
      await storageService.savePreferences(updatedPreferences);
      setPreferences(updatedPreferences);
      setError(null);
    } catch (err) {
      console.error('Failed to update preferences:', err);
      setError('Failed to save preferences');
      throw err;
    }
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <StorageContext.Provider
        value={{
          preferences: DEFAULT_PREFERENCES,
          updatePreferences: async () => {},
          isLoading: true,
          error: null,
        }}
      >
        {children}
      </StorageContext.Provider>
    );
  }

  return (
    <StorageContext.Provider
      value={{
        preferences,
        updatePreferences,
        isLoading,
        error,
      }}
    >
      {children}
    </StorageContext.Provider>
  );
}

export function useStorage() {
  const context = useContext(StorageContext);
  if (context === undefined) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
}