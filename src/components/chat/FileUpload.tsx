'use client';

import { useState, useRef } from 'react';
import { Upload, X, File, Image as ImageIcon, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onUploadComplete: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSizeInMB?: number;
  acceptedTypes?: string[];
  className?: string;
}

export interface UploadedFile {
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: bigint;
  thumbnailUrl?: string;
}

export default function FileUpload({
  onUploadComplete,
  maxFiles = 5,
  maxSizeInMB = 10,
  acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx'],
  className,
}: FileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setError(null);

    // Validate number of files
    if (files.length + selectedFiles.length > maxFiles) {
      setError(`Chỉ được chọn tối đa ${maxFiles} file`);
      return;
    }

    // Validate file sizes
    const maxSize = maxSizeInMB * 1024 * 1024;
    const invalidFiles = files.filter((file) => file.size > maxSize);
    if (invalidFiles.length > 0) {
      setError(`Một số file vượt quá ${maxSizeInMB}MB`);
      return;
    }

    // Generate previews for images
    const newPreviews: string[] = [];
    files.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result as string);
          setPreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      } else {
        newPreviews.push('');
        setPreviews((prev) => [...prev, '']);
      }
    });

    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const uploadedFiles: UploadedFile[] = [];

      // Upload each file
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', 'current-user-id'); // TODO: Get from auth
        formData.append('roomId', 'current-room-id'); // TODO: Get from props

        const response = await fetch('/api/chat/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const data = await response.json();

        if (data.success) {
          uploadedFiles.push(data.data);
        } else {
          throw new Error(data.error || `Failed to upload ${file.name}`);
        }
      }

      // Call callback with uploaded files
      onUploadComplete(uploadedFiles);

      // Reset state
      setSelectedFiles([]);
      setPreviews([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error uploading files:', err);
      setError(err instanceof Error ? err.message : 'Lỗi khi tải file');
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-5 h-5" />;
    if (type.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    return <File className="w-5 h-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* File Input */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || selectedFiles.length >= maxFiles}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Upload className="w-4 h-4" />
          Chọn file
        </button>

        {selectedFiles.length > 0 && (
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang tải...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Tải lên ({selectedFiles.length})
              </>
            )}
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="relative group bg-white border rounded-lg p-3 hover:border-indigo-300 transition-colors"
            >
              {/* Remove Button */}
              <button
                type="button"
                onClick={() => handleRemoveFile(index)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>

              {/* Preview or Icon */}
              <div className="flex items-center gap-3">
                {previews[index] ? (
                  <img
                    src={previews[index]}
                    alt={file.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                    {getFileIcon(file.type)}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Usage Info */}
      <p className="text-xs text-gray-500">
        Hỗ trợ: Ảnh, PDF, Word • Tối đa {maxFiles} file • Dung lượng tối đa {maxSizeInMB}MB/file
      </p>
    </div>
  );
}
