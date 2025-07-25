/**
 * @jest-environment jsdom
 */

import { BookParser } from '../book-parser';
import { Book } from '@/types';

// Mock the individual parsers
jest.mock('../pdf-parser');
jest.mock('../epub-parser');
jest.mock('../text-parser');

describe('BookParser', () => {
  let bookParser: BookParser;
  let mockTextFile: File;
  let mockPDFFile: File;
  let mockEPUBFile: File;

  beforeEach(() => {
    bookParser = new BookParser();
    
    // Create mock files
    mockTextFile = new File(['Sample text content'], 'test.txt', {
      type: 'text/plain',
    });
    
    mockPDFFile = new File(['PDF content'], 'test.pdf', {
      type: 'application/pdf',
    });
    
    mockEPUBFile = new File(['EPUB content'], 'test.epub', {
      type: 'application/epub+zip',
    });
  });

  describe('detectFormat', () => {
    it('should detect PDF format by MIME type', () => {
      const format = bookParser.detectFormat(mockPDFFile);
      expect(format).toBe('pdf');
    });

    it('should detect EPUB format by MIME type', () => {
      const format = bookParser.detectFormat(mockEPUBFile);
      expect(format).toBe('epub');
    });

    it('should detect text format by MIME type', () => {
      const format = bookParser.detectFormat(mockTextFile);
      expect(format).toBe('txt');
    });

    it('should detect format by file extension when MIME type is unknown', () => {
      const unknownFile = new File(['content'], 'test.pdf', {
        type: 'application/octet-stream',
      });
      const format = bookParser.detectFormat(unknownFile);
      expect(format).toBe('pdf');
    });

    it('should default to txt for unknown formats', () => {
      const unknownFile = new File(['content'], 'test.unknown', {
        type: 'application/unknown',
      });
      const format = bookParser.detectFormat(unknownFile);
      expect(format).toBe('txt');
    });
  });

  describe('isSupported', () => {
    it('should return true for supported formats', () => {
      expect(bookParser.isSupported(mockPDFFile)).toBe(true);
      expect(bookParser.isSupported(mockEPUBFile)).toBe(true);
      expect(bookParser.isSupported(mockTextFile)).toBe(true);
    });

    it('should return true for markdown files', () => {
      const mdFile = new File(['# Title'], 'test.md', {
        type: 'text/markdown',
      });
      expect(bookParser.isSupported(mdFile)).toBe(true);
    });
  });

  describe('getSupportedFormats', () => {
    it('should return all supported formats', () => {
      const formats = bookParser.getSupportedFormats();
      expect(formats).toEqual(['pdf', 'epub', 'txt', 'md', 'markdown']);
    });
  });

  describe('getSupportedMimeTypes', () => {
    it('should return all supported MIME types', () => {
      const mimeTypes = bookParser.getSupportedMimeTypes();
      expect(mimeTypes).toContain('application/pdf');
      expect(mimeTypes).toContain('application/epub+zip');
      expect(mimeTypes).toContain('text/plain');
      expect(mimeTypes).toContain('text/markdown');
    });
  });

  describe('validateFileSize', () => {
    it('should return true for files within size limit', () => {
      const smallFile = new File(['small content'], 'small.txt', {
        type: 'text/plain',
      });
      expect(bookParser.validateFileSize(smallFile)).toBe(true);
    });

    it('should return false for files exceeding size limit', () => {
      // Create a mock file that appears large
      const largeFile = new File(['content'], 'large.txt', {
        type: 'text/plain',
      });
      Object.defineProperty(largeFile, 'size', {
        value: 60 * 1024 * 1024, // 60MB
        writable: false,
      });
      
      expect(bookParser.validateFileSize(largeFile)).toBe(false);
    });

    it('should respect custom size limit', () => {
      const file = new File(['content'], 'test.txt', {
        type: 'text/plain',
      });
      Object.defineProperty(file, 'size', {
        value: 2 * 1024 * 1024, // 2MB
        writable: false,
      });
      
      expect(bookParser.validateFileSize(file, 1)).toBe(false); // 1MB limit
      expect(bookParser.validateFileSize(file, 5)).toBe(true);  // 5MB limit
    });
  });

  describe('validateFileName', () => {
    it('should return true for valid file names', () => {
      expect(bookParser.validateFileName('valid-file_name.txt')).toBe(true);
      expect(bookParser.validateFileName('Sách tiếng Việt.pdf')).toBe(true);
      expect(bookParser.validateFileName('Book (2023).epub')).toBe(true);
    });

    it('should return false for invalid file names', () => {
      expect(bookParser.validateFileName('')).toBe(false);
      expect(bookParser.validateFileName('file<>name.txt')).toBe(false);
      expect(bookParser.validateFileName('file|name.txt')).toBe(false);
    });

    it('should return false for names that are too long', () => {
      const longName = 'a'.repeat(300) + '.txt';
      expect(bookParser.validateFileName(longName)).toBe(false);
    });
  });

  describe('getFileInfo', () => {
    it('should return complete file information', () => {
      const info = bookParser.getFileInfo(mockTextFile);
      
      expect(info).toEqual({
        name: 'test.txt',
        size: mockTextFile.size,
        type: 'text/plain',
        format: 'txt',
        isSupported: true,
        estimatedPages: expect.any(Number),
      });
    });

    it('should indicate unsupported files', () => {
      const unsupportedFile = new File(['content'], 'test.xyz', {
        type: 'application/unknown',
      });
      const info = bookParser.getFileInfo(unsupportedFile);
      
      expect(info.isSupported).toBe(true); // txt is default, so it's supported
      expect(info.format).toBe('txt');
    });
  });

  describe('getParsingError', () => {
    it('should return Vietnamese error messages for PDF errors', () => {
      const error = new Error('Invalid PDF structure');
      const message = bookParser.getParsingError(error, mockPDFFile);
      expect(message).toContain('PDF');
      expect(message).toContain('không hợp lệ');
    });

    it('should return Vietnamese error messages for EPUB errors', () => {
      const error = new Error('EPUB parsing failed');
      const message = bookParser.getParsingError(error, mockEPUBFile);
      expect(message).toContain('EPUB');
      expect(message).toContain('không hợp lệ');
    });

    it('should return Vietnamese error messages for encoding errors', () => {
      const error = new Error('encoding error');
      const message = bookParser.getParsingError(error, mockTextFile);
      expect(message).toContain('mã hóa');
      expect(message).toContain('UTF-8');
    });

    it('should return Vietnamese error messages for size errors', () => {
      const error = new Error('File size too large');
      const message = bookParser.getParsingError(error, mockTextFile);
      expect(message).toContain('quá lớn');
      expect(message).toContain('50MB');
    });

    it('should return generic error message for unknown errors', () => {
      const error = new Error('Unknown error');
      const message = bookParser.getParsingError(error, mockTextFile);
      expect(message).toContain('TXT');
      expect(message).toContain('Unknown error');
    });
  });
});