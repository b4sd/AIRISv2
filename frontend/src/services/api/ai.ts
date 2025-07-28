import { ApiClient } from './client';
import {
  SummarizationRequest,
  SummarizationResponse,
  ApiResponse,
} from './types';
import { API_ENDPOINTS } from './config';

export class AIService {
  constructor(private apiClient: ApiClient) {}

  /**
   * Generate summary for text content
   */
  async summarizeText(
    request: SummarizationRequest
  ): Promise<SummarizationResponse> {
    const response = await this.apiClient.post<SummarizationResponse>(
      API_ENDPOINTS.AI.SUMMARIZE,
      request
    );

    return response.data!;
  }

  /**
   * Summarize a page of content
   */
  async summarizePage(
    text: string,
    options?: {
      language?: 'vi' | 'en';
      length?: 'short' | 'medium' | 'long';
      style?: 'bullet' | 'paragraph';
    }
  ): Promise<SummarizationResponse> {
    const request: SummarizationRequest = {
      text,
      type: 'page',
      language: options?.language || 'vi',
      length: options?.length || 'medium',
      style: options?.style || 'paragraph',
    };

    return this.summarizeText(request);
  }

  /**
   * Summarize a chapter of content
   */
  async summarizeChapter(
    text: string,
    options?: {
      language?: 'vi' | 'en';
      length?: 'short' | 'medium' | 'long';
      style?: 'bullet' | 'paragraph';
    }
  ): Promise<SummarizationResponse> {
    const request: SummarizationRequest = {
      text,
      type: 'chapter',
      language: options?.language || 'vi',
      length: options?.length || 'medium',
      style: options?.style || 'paragraph',
    };

    return this.summarizeText(request);
  }

  /**
   * Summarize an entire book
   */
  async summarizeBook(
    text: string,
    options?: {
      language?: 'vi' | 'en';
      length?: 'short' | 'medium' | 'long';
      style?: 'bullet' | 'paragraph';
    }
  ): Promise<SummarizationResponse> {
    const request: SummarizationRequest = {
      text,
      type: 'book',
      language: options?.language || 'vi',
      length: options?.length || 'long',
      style: options?.style || 'paragraph',
    };

    return this.summarizeText(request);
  }

  /**
   * Extract key points from text
   */
  async extractKeyPoints(
    text: string,
    language: 'vi' | 'en' = 'vi'
  ): Promise<string[]> {
    const response = await this.apiClient.post<{ keyPoints: string[] }>(
      API_ENDPOINTS.AI.ANALYZE,
      {
        text,
        type: 'key_points',
        language,
      }
    );

    return response.data?.keyPoints || [];
  }

  /**
   * Analyze text content for insights
   */
  async analyzeContent(
    text: string,
    analysisType: 'sentiment' | 'topics' | 'complexity',
    language: 'vi' | 'en' = 'vi'
  ): Promise<{
    analysis: any;
    confidence: number;
    language: string;
  }> {
    const response = await this.apiClient.post(API_ENDPOINTS.AI.ANALYZE, {
      text,
      type: analysisType,
      language,
    });

    return response.data!;
  }

  /**
   * Translate text between Vietnamese and English
   */
  async translateText(
    text: string,
    targetLanguage: 'vi' | 'en',
    sourceLanguage?: 'vi' | 'en'
  ): Promise<{
    translatedText: string;
    sourceLanguage: string;
    targetLanguage: string;
    confidence: number;
  }> {
    const response = await this.apiClient.post(API_ENDPOINTS.AI.TRANSLATE, {
      text,
      targetLanguage,
      sourceLanguage,
    });

    return response.data!;
  }

  /**
   * Get cached summary if available
   */
  async getCachedSummary(
    contentHash: string
  ): Promise<SummarizationResponse | null> {
    try {
      const response = await this.apiClient.get<SummarizationResponse>(
        `${API_ENDPOINTS.AI.SUMMARIZE}/${contentHash}`
      );
      return response.data!;
    } catch (error: any) {
      if (error.status === 404) {
        return null; // No cached summary found
      }
      throw error;
    }
  }

  /**
   * Check AI service availability
   */
  async checkServiceStatus(): Promise<{
    available: boolean;
    services: {
      summarization: boolean;
      translation: boolean;
      analysis: boolean;
    };
    quotaRemaining?: number;
    resetTime?: string;
  }> {
    const response = await this.apiClient.get(
      `${API_ENDPOINTS.AI.SUMMARIZE}/status`
    );
    return response.data!;
  }

  /**
   * Get AI usage statistics
   */
  async getUsageStats(): Promise<{
    requestsToday: number;
    requestsThisMonth: number;
    quotaLimit: number;
    quotaRemaining: number;
    resetDate: string;
    topRequestTypes: Array<{ type: string; count: number }>;
  }> {
    const response = await this.apiClient.get(
      `${API_ENDPOINTS.AI.SUMMARIZE}/usage`
    );
    return response.data!;
  }

  /**
   * Generate content hash for caching
   */
  generateContentHash(text: string, options: SummarizationRequest): string {
    const content = JSON.stringify({
      text: text.substring(0, 1000), // Use first 1000 chars for hash
      type: options.type,
      language: options.language,
      length: options.length,
      style: options.style,
    });

    // Simple hash function (in production, use a proper hash library)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Validate text for AI processing
   */
  validateTextForProcessing(text: string): {
    isValid: boolean;
    error?: string;
    warnings?: string[];
  } {
    const minLength = 50; // Minimum 50 characters
    const maxLength = 100000; // Maximum 100k characters
    const warnings: string[] = [];

    if (text.length < minLength) {
      return {
        isValid: false,
        error: `Text must be at least ${minLength} characters long for meaningful processing`,
      };
    }

    if (text.length > maxLength) {
      return {
        isValid: false,
        error: `Text must be less than ${maxLength} characters. Consider breaking it into smaller chunks.`,
      };
    }

    // Check for potential issues
    if (text.length < 200) {
      warnings.push('Short text may result in less detailed summaries');
    }

    if (text.length > 50000) {
      warnings.push('Large text may take longer to process');
    }

    // Check for Vietnamese content
    const vietnamesePattern =
      /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
    const hasVietnamese = vietnamesePattern.test(text);

    if (!hasVietnamese) {
      warnings.push(
        'Text appears to be non-Vietnamese. Consider using English language setting for better results.'
      );
    }

    return {
      isValid: true,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Estimate processing time based on text length and type
   */
  estimateProcessingTime(
    textLength: number,
    type: 'page' | 'chapter' | 'book'
  ): {
    estimatedSeconds: number;
    description: string;
  } {
    let baseTime = 0;
    let description = '';

    switch (type) {
      case 'page':
        baseTime = Math.max(2, Math.ceil(textLength / 1000) * 0.5);
        description = 'Page summaries are typically quick';
        break;
      case 'chapter':
        baseTime = Math.max(5, Math.ceil(textLength / 1000) * 1);
        description = 'Chapter summaries require more analysis';
        break;
      case 'book':
        baseTime = Math.max(10, Math.ceil(textLength / 1000) * 2);
        description = 'Book summaries are comprehensive and take longer';
        break;
    }

    return {
      estimatedSeconds: baseTime,
      description,
    };
  }

  /**
   * Format AI response for display
   */
  formatSummaryForDisplay(summary: SummarizationResponse): {
    formattedSummary: string;
    metadata: string;
  } {
    const metadata = `Tóm tắt ${summary.language === 'vi' ? 'tiếng Việt' : 'tiếng Anh'} • Thời gian xử lý: ${summary.processingTime}ms`;

    let formattedSummary = summary.summary;

    // Add key points if available
    if (summary.keyPoints && summary.keyPoints.length > 0) {
      formattedSummary += '\n\n**Điểm chính:**\n';
      formattedSummary += summary.keyPoints
        .map((point) => `• ${point}`)
        .join('\n');
    }

    return {
      formattedSummary,
      metadata,
    };
  }
}
