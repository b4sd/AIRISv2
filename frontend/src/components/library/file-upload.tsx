'use client';

import { useState, useCallback, useRef } from 'react';
import {
  CloudArrowUpIcon,
  DocumentIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { bookParser } from '@/services/parsers/book-parser';
import { storageService } from '@/services/storage';
import { cn, formatFileSize } from '@/lib/utils';

interface FileUploadProps {
  onUploadComplete?: (bookId: string) => void;
  onUploadError?: (error: string) => void;
  className?: string;
}

interface UploadFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  bookId?: string;
}

export function FileUpload({ onUploadComplete, onUploadError, className }: FileUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateFileId = () => Math.random().toString(36).substring(2);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    handleFiles(selectedFiles);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleFiles = useCallback((newFiles: File[]) => {
    const uploadFiles: UploadFile[] = newFiles.map(file => ({
      file,
      id: generateFileId(),
      status: 'pending',
      progress: 0,
    }));

    setFiles(prev => [...prev, ...uploadFiles]);

    // Start uploading each file
    uploadFiles.forEach(uploadFile => {
      processFile(uploadFile);
    });
  }, []);

  const processFile = async (uploadFile: UploadFile) => {
    const { file, id } = uploadFile;

    try {
      // Update status to uploading
      setFiles(prev => prev.map(f => 
        f.id === id ? { ...f, status: 'uploading', progress: 10 } : f
      ));

      // Validate file
      const fileInfo = bookParser.getFileInfo(file);
      if (!fileInfo.isSupported) {
        throw new Error(`Định dạng tệp không được hỗ trợ: ${fileInfo.format}`);
      }

      if (!bookParser.validateFileSize(file)) {
        throw new Error('Tệp quá lớn (tối đa 50MB)');
      }

      // Update progress
      setFiles(prev => prev.map(f => 
        f.id === id ? { ...f, progress: 30 } : f
      ));

      // Parse the book
      const book = await bookParser.parseFile(file);

      // Update progress
      setFiles(prev => prev.map(f => 
        f.id === id ? { ...f, progress: 70 } : f
      ));

      // Save to storage
      await storageService.saveBook(book);

      // Update progress
      setFiles(prev => prev.map(f => 
        f.id === id ? { ...f, progress: 100, status: 'success', bookId: book.id } : f
      ));

      // Notify success
      onUploadComplete?.(book.id);

    } catch (error) {
      const errorMessage = error instanceof Error 
        ? bookParser.getParsingError(error, file)
        : 'Đã xảy ra lỗi không xác định';

      setFiles(prev => prev.map(f => 
        f.id === id ? { ...f, status: 'error', error: errorMessage } : f
      ));

      onUploadError?.(errorMessage);
    }
  };

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setFiles(prev => prev.filter(f => f.status === 'uploading' || f.status === 'pending'));
  }, []);

  const hasCompletedFiles = files.some(f => f.status === 'success' || f.status === 'error');

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
          isDragOver
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Thả tệp vào đây hoặc nhấp để chọn
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Hỗ trợ PDF, EPUB, và tệp văn bản (tối đa 50MB)
        </p>
        <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">PDF</span>
          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">EPUB</span>
          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">TXT</span>
          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">MD</span>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.epub,.txt,.md,.markdown"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              Tệp đang tải ({files.length})
            </h4>
            {hasCompletedFiles && (
              <button
                onClick={clearCompleted}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Xóa hoàn thành
              </button>
            )}
          </div>

          <div className="space-y-2">
            {files.map((uploadFile) => (
              <FileUploadItem
                key={uploadFile.id}
                uploadFile={uploadFile}
                onRemove={() => removeFile(uploadFile.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface FileUploadItemProps {
  uploadFile: UploadFile;
  onRemove: () => void;
}

function FileUploadItem({ uploadFile, onRemove }: FileUploadItemProps) {
  const { file, status, progress, error } = uploadFile;
  const fileInfo = bookParser.getFileInfo(file);

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <DocumentIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'uploading':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-300';
    }
  };

  return (
    <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {getStatusIcon()}
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {file.name}
          </p>
          <button
            onClick={onRemove}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
        
        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
          <span>{formatFileSize(file.size)}</span>
          <span>•</span>
          <span className="uppercase">{fileInfo.format}</span>
          {fileInfo.estimatedPages && (
            <>
              <span>•</span>
              <span>~{fileInfo.estimatedPages} trang</span>
            </>
          )}
        </div>

        {/* Progress Bar */}
        {status === 'uploading' && (
          <div className="mt-2">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Status Text */}
        <p className={cn('text-xs mt-1', getStatusColor())}>
          {status === 'pending' && 'Đang chờ...'}
          {status === 'uploading' && `Đang xử lý... ${progress}%`}
          {status === 'success' && 'Tải lên thành công'}
          {status === 'error' && (error || 'Đã xảy ra lỗi')}
        </p>
      </div>
    </div>
  );
}