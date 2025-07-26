export interface User {
    id: string;
    email: string;
    name?: string;
    avatarUrl?: string;
    preferences: UserPreferences;
    createdAt: Date;
    updatedAt: Date;
}
export interface UserPreferences {
    language: "vi" | "en";
    theme: "light" | "dark" | "system";
    voice: {
        rate: number;
        volume: number;
        pitch: number;
        voiceId?: string;
    };
    ai: {
        summaryLength: "short" | "medium" | "long";
        summaryStyle: "bullet" | "paragraph";
    };
}
export interface Book {
    id: string;
    userId: string;
    title: string;
    author?: string;
    format: "pdf" | "epub" | "txt";
    fileUrl: string;
    fileSize?: number;
    textContent?: string;
    metadata: BookMetadata;
    createdAt: Date;
    updatedAt: Date;
}
export interface BookMetadata {
    isbn?: string;
    publisher?: string;
    publishedDate?: string;
    language: string;
    pageCount?: number;
    description?: string;
    coverImage?: string;
    source?: string;
    originalUrl?: string;
}
export interface Note {
    id: string;
    userId: string;
    bookId: string;
    content: string;
    position?: ReadingPosition;
    createdAt: Date;
    updatedAt: Date;
}
export interface ReadingPosition {
    bookId: string;
    chapter?: number;
    page?: number;
    position: number;
    percentage: number;
    timestamp: Date;
}
export interface Summary {
    id: string;
    contentHash: string;
    summary: string;
    keyPoints: string[];
    options: SummaryOptions;
    createdAt: Date;
    expiresAt?: Date;
}
export interface SummaryOptions {
    language: "vi" | "en";
    length: "short" | "medium" | "long";
    style: "bullet" | "paragraph";
}
export interface AuthRequest {
    email: string;
    password: string;
}
export interface RegisterRequest extends AuthRequest {
    name?: string;
}
export interface AuthResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export interface TokenResponse {
    accessToken: string;
    expiresIn: number;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
    };
}
export interface SyncData {
    readingPositions: ReadingPosition[];
    notes: Note[];
    preferences: UserPreferences;
    lastSyncTime: Date;
}
//# sourceMappingURL=index.d.ts.map