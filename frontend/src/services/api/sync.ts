import { ApiClient } from './client';
import {
  SyncRequest,
  SyncResponse,
  DataConflict,
  UserPreferences,
  ApiResponse,
} from './types';
import { API_ENDPOINTS } from './config';

export class SyncService {
  constructor(private apiClient: ApiClient) {}

  /**
   * Perform full synchronization
   */
  async fullSync(localData: SyncRequest['data']): Promise<SyncResponse> {
    const lastSyncTimestamp = await this.getLastSyncTimestamp();

    const request: SyncRequest = {
      lastSyncTimestamp: lastSyncTimestamp || undefined,
      data: localData,
    };

    const response = await this.apiClient.post<SyncResponse>(
      API_ENDPOINTS.SYNC.FULL,
      request
    );

    if (response.data) {
      await this.updateLastSyncTimestamp(response.data.timestamp);
    }

    return response.data!;
  }

  /**
   * Perform incremental synchronization
   */
  async incrementalSync(changes: {
    books?: any[];
    notes?: any[];
    preferences?: UserPreferences;
    readingPositions?: any[];
  }): Promise<SyncResponse> {
    const lastSyncTimestamp = await this.getLastSyncTimestamp();

    const request: SyncRequest = {
      lastSyncTimestamp: lastSyncTimestamp || undefined,
      data: changes,
    };

    const response = await this.apiClient.post<SyncResponse>(
      API_ENDPOINTS.SYNC.INCREMENTAL,
      request
    );

    if (response.data) {
      await this.updateLastSyncTimestamp(response.data.timestamp);
    }

    return response.data!;
  }

  /**
   * Get sync status from server
   */
  async getSyncStatus(): Promise<{
    lastSync: string;
    pendingChanges: number;
    conflicts: number;
    status: 'synced' | 'pending' | 'conflict' | 'error';
  }> {
    const response = await this.apiClient.get(API_ENDPOINTS.SYNC.STATUS);
    return response.data!;
  }

  /**
   * Resolve sync conflicts
   */
  async resolveConflicts(
    resolutions: Array<{
      conflictId: string;
      resolution: 'local' | 'remote' | 'merge';
      mergedData?: any;
    }>
  ): Promise<void> {
    await this.apiClient.post(`${API_ENDPOINTS.SYNC.FULL}/resolve-conflicts`, {
      resolutions,
    });
  }

  /**
   * Sync reading positions
   */
  async syncReadingPositions(
    positions: Array<{
      bookId: string;
      position: {
        page: number;
        chapter: string;
        characterOffset: number;
        percentage: number;
        timestamp: string;
      };
    }>
  ): Promise<
    Array<{
      bookId: string;
      position: any;
      conflict?: DataConflict;
    }>
  > {
    const response = await this.apiClient.post(
      `${API_ENDPOINTS.SYNC.FULL}/reading-positions`,
      {
        positions,
      }
    );

    return response.data!;
  }

  /**
   * Sync notes
   */
  async syncNotes(
    notes: Array<{
      id?: string;
      bookId: string;
      content: string;
      position: any;
      tags: string[];
      createdAt: string;
      updatedAt: string;
      deleted?: boolean;
    }>
  ): Promise<
    Array<{
      localId?: string;
      remoteId: string;
      conflict?: DataConflict;
    }>
  > {
    const response = await this.apiClient.post(
      `${API_ENDPOINTS.SYNC.FULL}/notes`,
      {
        notes,
      }
    );

    return response.data!;
  }

  /**
   * Sync user preferences
   */
  async syncPreferences(preferences: UserPreferences): Promise<{
    preferences: UserPreferences;
    conflict?: DataConflict;
  }> {
    const response = await this.apiClient.post(
      `${API_ENDPOINTS.SYNC.FULL}/preferences`,
      {
        preferences,
      }
    );

    return response.data!;
  }

  /**
   * Sync books metadata (not file content)
   */
  async syncBooksMetadata(
    books: Array<{
      id?: string;
      title: string;
      author: string;
      format: string;
      metadata: any;
      createdAt: string;
      updatedAt: string;
      deleted?: boolean;
    }>
  ): Promise<
    Array<{
      localId?: string;
      remoteId: string;
      needsUpload?: boolean;
      conflict?: DataConflict;
    }>
  > {
    const response = await this.apiClient.post(
      `${API_ENDPOINTS.SYNC.FULL}/books-metadata`,
      {
        books,
      }
    );

    return response.data!;
  }

  /**
   * Get changes since last sync
   */
  async getChangesSinceLastSync(): Promise<{
    books: any[];
    notes: any[];
    preferences: UserPreferences | null;
    readingPositions: any[];
    timestamp: string;
  }> {
    const lastSyncTimestamp = await this.getLastSyncTimestamp();

    const response = await this.apiClient.get(
      `${API_ENDPOINTS.SYNC.INCREMENTAL}?since=${encodeURIComponent(lastSyncTimestamp || '')}`
    );

    return response.data!;
  }

  /**
   * Force sync reset (re-sync everything)
   */
  async resetSync(): Promise<void> {
    await this.apiClient.post(`${API_ENDPOINTS.SYNC.FULL}/reset`);
    await this.clearLastSyncTimestamp();
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(): Promise<{
    totalSyncs: number;
    lastSyncDuration: number;
    averageSyncDuration: number;
    conflictsResolved: number;
    dataTransferred: number;
    syncFrequency: string;
  }> {
    const response = await this.apiClient.get(
      `${API_ENDPOINTS.SYNC.STATUS}/stats`
    );
    return response.data!;
  }

  /**
   * Configure sync settings
   */
  async updateSyncSettings(settings: {
    autoSync?: boolean;
    syncInterval?: number; // minutes
    syncOnlyOnWifi?: boolean;
    backgroundSync?: boolean;
  }): Promise<void> {
    await this.apiClient.put(`${API_ENDPOINTS.SYNC.STATUS}/settings`, settings);
  }

  /**
   * Get sync settings
   */
  async getSyncSettings(): Promise<{
    autoSync: boolean;
    syncInterval: number;
    syncOnlyOnWifi: boolean;
    backgroundSync: boolean;
  }> {
    const response = await this.apiClient.get(
      `${API_ENDPOINTS.SYNC.STATUS}/settings`
    );
    return response.data!;
  }

  /**
   * Check if sync is needed
   */
  async isSyncNeeded(): Promise<{
    needed: boolean;
    reason?: string;
    lastSync?: string;
    pendingChanges?: number;
  }> {
    const response = await this.apiClient.get(
      `${API_ENDPOINTS.SYNC.STATUS}/check`
    );
    return response.data!;
  }

  /**
   * Get last sync timestamp from local storage
   */
  private async getLastSyncTimestamp(): Promise<string | null> {
    if (typeof window === 'undefined') return null;

    try {
      return localStorage.getItem('voice_reading_last_sync') || null;
    } catch (error) {
      console.error('Failed to get last sync timestamp:', error);
      return null;
    }
  }

  /**
   * Update last sync timestamp in local storage
   */
  private async updateLastSyncTimestamp(timestamp: string): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('voice_reading_last_sync', timestamp);
    } catch (error) {
      console.error('Failed to update last sync timestamp:', error);
    }
  }

  /**
   * Clear last sync timestamp
   */
  private async clearLastSyncTimestamp(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem('voice_reading_last_sync');
    } catch (error) {
      console.error('Failed to clear last sync timestamp:', error);
    }
  }

  /**
   * Generate conflict resolution UI data
   */
  generateConflictResolutionData(conflict: DataConflict): {
    title: string;
    description: string;
    localPreview: string;
    remotePreview: string;
    recommendedAction: 'local' | 'remote' | 'merge';
  } {
    const localTime = new Date(conflict.localTimestamp).toLocaleString('vi-VN');
    const remoteTime = new Date(conflict.cloudTimestamp).toLocaleString(
      'vi-VN'
    );

    let title = '';
    let description = '';
    let localPreview = '';
    let remotePreview = '';
    let recommendedAction: 'local' | 'remote' | 'merge' = 'remote';

    switch (conflict.type) {
      case 'note':
        title = 'Xung đột ghi chú';
        description = `Ghi chú đã được chỉnh sửa trên cả thiết bị này (${localTime}) và thiết bị khác (${remoteTime})`;
        localPreview = conflict.localData.content?.substring(0, 100) + '...';
        remotePreview = conflict.cloudData.content?.substring(0, 100) + '...';
        recommendedAction =
          new Date(conflict.cloudTimestamp) > new Date(conflict.localTimestamp)
            ? 'remote'
            : 'local';
        break;

      case 'preference':
        title = 'Xung đột cài đặt';
        description = `Cài đặt đã được thay đổi trên cả thiết bị này và thiết bị khác`;
        localPreview = JSON.stringify(conflict.localData, null, 2);
        remotePreview = JSON.stringify(conflict.cloudData, null, 2);
        recommendedAction = 'remote'; // Usually prefer server settings
        break;

      case 'position':
        title = 'Xung đột vị trí đọc';
        description = `Vị trí đọc khác nhau giữa thiết bị này và thiết bị khác`;
        localPreview = `Trang ${conflict.localData.page}, Chương ${conflict.localData.chapter}`;
        remotePreview = `Trang ${conflict.cloudData.page}, Chương ${conflict.cloudData.chapter}`;
        recommendedAction =
          new Date(conflict.cloudTimestamp) > new Date(conflict.localTimestamp)
            ? 'remote'
            : 'local';
        break;

      default:
        title = 'Xung đột dữ liệu';
        description = 'Dữ liệu khác nhau giữa các thiết bị';
        localPreview = JSON.stringify(conflict.localData);
        remotePreview = JSON.stringify(conflict.cloudData);
        recommendedAction = 'remote';
    }

    return {
      title,
      description,
      localPreview,
      remotePreview,
      recommendedAction,
    };
  }

  /**
   * Estimate sync time based on data size
   */
  estimateSyncTime(dataSize: {
    books: number;
    notes: number;
    preferences: number;
    positions: number;
  }): {
    estimatedSeconds: number;
    description: string;
  } {
    const totalItems =
      dataSize.books +
      dataSize.notes +
      dataSize.preferences +
      dataSize.positions;
    const baseTime = Math.max(1, Math.ceil(totalItems / 10)); // ~10 items per second

    let description = '';
    if (totalItems < 10) {
      description = 'Đồng bộ nhanh';
    } else if (totalItems < 100) {
      description = 'Đồng bộ trung bình';
    } else {
      description = 'Đồng bộ có thể mất một chút thời gian';
    }

    return {
      estimatedSeconds: baseTime,
      description,
    };
  }
}
