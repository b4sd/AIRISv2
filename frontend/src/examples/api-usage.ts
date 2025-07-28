/**
 * Example usage of the Voice Reading API client
 * This file demonstrates how to use the API services in your components
 */

import { api, VoiceReadingAPI } from '../services/api';

// Example 1: Authentication flow
export async function authenticationExample() {
  try {
    // Initialize API and check current auth status
    const status = await api.initialize();
    console.log('API initialized:', status);

    if (!status.isAuthenticated) {
      // Register new user
      const authResponse = await api.auth.register({
        email: 'user@example.com',
        password: 'securePassword123',
        name: 'Test User',
      });
      console.log('User registered:', authResponse.user);
    }

    // Login (if not already authenticated)
    if (!status.isAuthenticated) {
      const loginResponse = await api.auth.login({
        email: 'user@example.com',
        password: 'securePassword123',
      });
      console.log('User logged in:', loginResponse.user);
    }

    // Get user profile
    const profile = await api.auth.getProfile();
    console.log('User profile:', profile);
  } catch (error) {
    console.error('Authentication error:', error);
  }
}

// Example 2: Book management
export async function bookManagementExample() {
  try {
    // Upload a book
    const file = new File(['Sample book content'], 'sample.txt', {
      type: 'text/plain',
    });

    const uploadedBook = await api.books.uploadBook(
      file,
      {
        title: 'Sample Book',
        author: 'Test Author',
      },
      (progress) => {
        console.log(`Upload progress: ${progress}%`);
      }
    );
    console.log('Book uploaded:', uploadedBook);

    // Get user's book library
    const books = await api.books.getBooks({
      limit: 10,
      offset: 0,
    });
    console.log('User books:', books);

    // Get book content for reading
    const bookContent = await api.books.getBookContent(uploadedBook.id);
    console.log('Book content:', bookContent);

    // Update reading position
    await api.books.updateReadingPosition(uploadedBook.id, {
      page: 5,
      chapter: 'Chapter 1',
      characterOffset: 1250,
      percentage: 25.5,
      timestamp: new Date().toISOString(),
    });

    // Get reading position
    const position = await api.books.getReadingPosition(uploadedBook.id);
    console.log('Reading position:', position);
  } catch (error) {
    console.error('Book management error:', error);
  }
}

// Example 3: Notes management
export async function notesExample() {
  try {
    const bookId = 'sample-book-id';

    // Create a note
    const newNote = await api.notes.createNote(bookId, {
      content: 'This is an important point about the story.',
      position: {
        page: 10,
        chapter: 'Chapter 2',
        characterOffset: 2500,
        percentage: 45.0,
        timestamp: new Date().toISOString(),
      },
      tags: ['important', 'story'],
    });
    console.log('Note created:', newNote);

    // Get all notes for the book
    const notes = await api.notes.getNotes(bookId, {
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    console.log('Book notes:', notes);

    // Search notes
    const searchResults = await api.notes.searchNotes(bookId, 'important');
    console.log('Search results:', searchResults);

    // Update note
    const updatedNote = await api.notes.updateNote(bookId, newNote.id, {
      content: 'Updated note content with more details.',
      tags: ['important', 'story', 'updated'],
    });
    console.log('Note updated:', updatedNote);
  } catch (error) {
    console.error('Notes error:', error);
  }
}

// Example 4: AI services
export async function aiServicesExample() {
  try {
    const sampleText = `
      Đây là một đoạn văn mẫu bằng tiếng Việt để thử nghiệm tính năng tóm tắt AI.
      Nội dung này sẽ được xử lý bởi dịch vụ AI để tạo ra bản tóm tắt ngắn gọn.
      Hệ thống có thể xử lý cả tiếng Việt và tiếng Anh một cách hiệu quả.
    `;

    // Check AI service status
    const aiStatus = await api.ai.checkServiceStatus();
    console.log('AI service status:', aiStatus);

    if (aiStatus.available) {
      // Generate summary
      const summary = await api.ai.summarizePage(sampleText, {
        language: 'vi',
        length: 'medium',
        style: 'paragraph',
      });
      console.log('Generated summary:', summary);

      // Extract key points
      const keyPoints = await api.ai.extractKeyPoints(sampleText, 'vi');
      console.log('Key points:', keyPoints);

      // Translate text
      const translation = await api.ai.translateText(sampleText, 'en', 'vi');
      console.log('Translation:', translation);
    }

    // Get AI usage statistics
    const usage = await api.ai.getUsageStats();
    console.log('AI usage stats:', usage);
  } catch (error) {
    console.error('AI services error:', error);
  }
}

// Example 5: Sync services
export async function syncExample() {
  try {
    // Check sync status
    const syncStatus = await api.sync.getSyncStatus();
    console.log('Sync status:', syncStatus);

    // Check if sync is needed
    const syncNeeded = await api.sync.isSyncNeeded();
    console.log('Sync needed:', syncNeeded);

    if (syncNeeded.needed) {
      // Perform incremental sync
      const syncResult = await api.sync.incrementalSync({
        // This would typically come from your local IndexedDB
        notes: [],
        readingPositions: [],
        preferences: await api.preferences.getPreferences(),
      });
      console.log('Sync result:', syncResult);

      // Handle conflicts if any
      if (syncResult.conflicts && syncResult.conflicts.length > 0) {
        console.log('Sync conflicts detected:', syncResult.conflicts);

        // Resolve conflicts (example: always prefer remote)
        const resolutions = syncResult.conflicts.map((conflict: any) => ({
          conflictId: conflict.id,
          resolution: 'remote' as const,
        }));

        await api.sync.resolveConflicts(resolutions);
        console.log('Conflicts resolved');
      }
    }

    // Get sync statistics
    const syncStats = await api.sync.getSyncStats();
    console.log('Sync statistics:', syncStats);
  } catch (error) {
    console.error('Sync error:', error);
  }
}

// Example 6: Preferences management
export async function preferencesExample() {
  try {
    // Get current preferences
    const preferences = await api.preferences.getPreferences();
    console.log('Current preferences:', preferences);

    // Update voice settings
    const updatedPreferences = await api.preferences.updateVoiceSettings({
      speechRate: 1.2,
      volume: 0.9,
      recognitionLanguage: 'vi-VN',
    });
    console.log('Updated preferences:', updatedPreferences);

    // Test voice settings
    await api.preferences.testVoiceSettings(
      updatedPreferences.voiceSettings,
      'Đây là bài kiểm tra giọng nói tiếng Việt.'
    );
    console.log('Voice test completed');

    // Export preferences for backup
    const exportBlob = await api.preferences.exportPreferences();
    console.log('Preferences exported:', exportBlob);

    // Get available Vietnamese voices
    const voices = api.preferences.getAvailableVietnameseVoices();
    console.log('Available Vietnamese voices:', voices);
  } catch (error) {
    console.error('Preferences error:', error);
  }
}

// Example 7: Error handling and offline support
export async function errorHandlingExample() {
  try {
    // Check network status
    const networkStatus = api.client.getNetworkStatus();
    console.log('Network status:', networkStatus);

    if (!networkStatus.isOnline) {
      console.log('App is offline, requests will be queued');

      // This request will be queued for when online
      await api.books.getBooks();

      console.log(
        'Request queued, queue length:',
        api.client.getNetworkStatus().queueLength
      );
    }

    // Get API health status
    const health = await api.getHealthStatus();
    console.log('API health:', health);

    // Get usage statistics
    const usage = await api.getUsageStats();
    console.log('API usage:', usage);
  } catch (error: any) {
    console.error('Error handling example:', error);

    // Handle specific error types
    if (error.status === 401) {
      console.log('Authentication required, redirecting to login...');
    } else if (error.status === 429) {
      console.log('Rate limited, please wait before retrying...');
    } else if (error.status >= 500) {
      console.log('Server error, please try again later...');
    }
  }
}

// Example 8: Complete workflow
export async function completeWorkflowExample() {
  try {
    console.log('Starting complete workflow example...');

    // 1. Initialize and authenticate
    await authenticationExample();

    // 2. Upload and manage books
    await bookManagementExample();

    // 3. Create and manage notes
    await notesExample();

    // 4. Use AI services
    await aiServicesExample();

    // 5. Sync data
    await syncExample();

    // 6. Manage preferences
    await preferencesExample();

    console.log('Complete workflow example finished successfully!');
  } catch (error) {
    console.error('Complete workflow error:', error);
  }
}

// Example 9: Custom API client configuration
export function customApiClientExample() {
  // Create a custom API client with different configuration
  const customApi = new VoiceReadingAPI({
    baseURL: 'https://api.myvoicereading.com/v1',
    timeout: 10000, // 10 seconds
    retryAttempts: 5,
    enableOfflineQueue: true,
  });

  // Use the custom API client
  return customApi;
}

// Example 10: React Hook usage pattern
export function useApiExample() {
  // This would typically be in a React component
  const exampleReactUsage = async () => {
    try {
      // Initialize API in useEffect
      const status = await api.initialize();

      if (status.isAuthenticated) {
        // Load user data
        const books = await api.books.getBooks();
        const preferences = await api.preferences.getPreferences();

        // Update component state with loaded data
        console.log('Loaded data for React component:', { books, preferences });
      }
    } catch (error) {
      console.error('React hook error:', error);
    }
  };

  return exampleReactUsage;
}

// Export all examples for easy testing
export const examples = {
  authentication: authenticationExample,
  bookManagement: bookManagementExample,
  notes: notesExample,
  aiServices: aiServicesExample,
  sync: syncExample,
  preferences: preferencesExample,
  errorHandling: errorHandlingExample,
  completeWorkflow: completeWorkflowExample,
  customApiClient: customApiClientExample,
  reactHook: useApiExample,
};
