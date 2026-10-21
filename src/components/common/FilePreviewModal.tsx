'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import {
  Download,
  X,
  FileText,
  Image as ImageIcon,
  AlertTriangle,
  Loader2
} from 'lucide-react';

// Dynamic import DocViewerWrapper to avoid canvas module error with SSR
const DocViewerWrapper = dynamic(
  () => import('./DocViewerWrapper'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-sm text-gray-600">Đang tải trình xem tài liệu...</p>
        </div>
      </div>
    )
  }
);

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
}

const getFileExtension = (fileName: string): string => {
  return fileName.split('.').pop()?.toLowerCase() || '';
};

const getFileType = (fileName: string): 'image' | 'document' | 'unknown' => {
  const extension = getFileExtension(fileName);

  // Image extensions
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp'].includes(extension)) {
    return 'image';
  }

  // Document extensions supported by react-doc-viewer
  if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'].includes(extension)) {
    return 'document';
  }

  return 'unknown';
};

export default function FilePreviewModal({
  isOpen,
  onClose,
  fileUrl,
  fileName
}: FilePreviewModalProps) {
  const [imageError, setImageError] = useState(false);
  const [docViewerError, setDocViewerError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fileType = getFileType(fileName);
  const fileExtension = getFileExtension(fileName);

  // Create proxied URL for Supabase files to avoid CORS issues
  const getProxiedUrl = (originalUrl: string, forDownload = false): string => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl && originalUrl.includes(supabaseUrl)) {
      // Use proxy for Supabase storage files
      const downloadParam = forDownload ? '&download=true' : '';
      return `/api/file-proxy?url=${encodeURIComponent(originalUrl)}${downloadParam}`;
    }
    return originalUrl;
  };

  const proxiedFileUrl = getProxiedUrl(fileUrl);
  const downloadUrl = getProxiedUrl(fileUrl, true);

  // Reset states when modal opens with new file
  useEffect(() => {
    if (isOpen) {
      setImageError(false);
      setDocViewerError(false);
      if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(fileExtension)) {
        setIsLoading(false);
      } else {
        setIsLoading(true);

        // Auto hide loading after timeout
        const loadingTimeout = fileType === 'document' && fileExtension === 'pdf' ? 3000 : 5000;
        const timer = setTimeout(() => {
          setIsLoading(false);
        }, loadingTimeout);

        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, fileUrl, fileType, fileExtension]);

  const handleDownload = () => {
    const link = document.createElement('a');
    // Use download URL with download=true parameter
    link.href = downloadUrl;
    link.download = fileName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderFileIcon = () => {
    if (fileType === 'image') {
      return <ImageIcon className="w-5 h-5 text-blue-600" />;
    } else if (fileType === 'document') {
      return <FileText className="w-5 h-5 text-green-600" />;
    } else {
      return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const renderContent = () => {
    // Image files - render directly with img tag
    if (fileType === 'image') {
      return (
        <div className="flex items-center justify-center bg-gray-50 rounded-lg min-h-[70vh]">
          {!imageError ? (
            <div className="relative">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Đang tải ảnh...</p>
                  </div>
                </div>
              )}
              <img
                src={proxiedFileUrl}
                alt={fileName}
                className="max-w-full max-h-[70vh] h-auto object-contain rounded-lg shadow-sm"
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setImageError(true);
                  setIsLoading(false);
                }}
              />
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Không thể tải ảnh
              </h3>
              <p className="text-gray-600 mb-4">
                Có lỗi khi tải ảnh. Vui lòng tải xuống để xem.
              </p>
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Tải xuống
              </button>
            </div>
          )}
        </div>
      );
    }

    // Document files - use DocViewer
    if (fileType === 'document') {
      return (
        <div className="relative bg-white rounded-lg overflow-hidden min-h-[70vh]">
          {!docViewerError ? (
            <div className="doc-viewer-container">
              {/* Try DocViewer first, fallback to iframe for PDF */}
              {fileExtension === 'pdf' ? (
                // Use iframe for PDF files as DocViewer has issues
                <div className="relative">
                  <iframe
                    src={proxiedFileUrl}
                    className="w-full h-[70vh] border-0 rounded"
                    title={`Preview of ${fileName}`}
                    onError={() => setDocViewerError(true)}
                  />
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-95 z-10">
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-sm text-gray-600">Đang tải PDF...</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Powered by Browser PDF Viewer
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(fileExtension) ? (
                // Display fallback message for MS Office docs which often fail in iframe viewers
                <div className="flex flex-col items-center justify-center text-center h-[70vh] bg-gray-50 rounded p-8">
                  <FileText className="w-16 h-16 text-gray-400 mb-6" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    Không thể xem trước file này được, hãy tải về để xem chi tiết nhé !
                  </h3>
                  <button
                    onClick={handleDownload}
                    className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-[#0f4c81] text-white font-medium rounded-lg hover:bg-[#0c3e69] transition-colors shadow-sm"
                  >
                    <Download className="w-5 h-5" />
                    Tải xuống thiết bị
                  </button>
                </div>
              ) : (
                // Use DocViewerWrapper for other document types
                <>
                  <DocViewerWrapper
                    fileUrl={proxiedFileUrl}
                    fileName={fileName}
                  />

                  {/* Loading overlay for documents */}
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-95 z-10">
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-sm text-gray-600">Đang tải tài liệu...</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Powered by React Doc Viewer
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Không thể xem trước tài liệu
              </h3>
              <p className="text-gray-600 mb-4">
                Có lỗi khi tải tài liệu. Có thể do CORS policy hoặc file bị hư.
              </p>
              <div className="space-y-2">
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Tải xuống
                </button>
                <p className="text-xs text-gray-500">
                  Tải file về máy để xem bằng ứng dụng phù hợp
                </p>

                {/* Debug info */}
                <details className="mt-4 text-left">
                  <summary className="text-xs text-gray-400 cursor-pointer">Debug info</summary>
                  <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-100 rounded font-sans font-medium">
                    <p>File: {fileName}</p>
                    <p>Type: {fileExtension}</p>
                    <p>Original URL: {fileUrl}</p>
                    <p>Preview URL: {proxiedFileUrl}</p>
                    <p>Download URL: {downloadUrl}</p>
                  </div>
                </details>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Unknown file type
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg min-h-[60vh] flex items-center justify-center">
        <div>
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Không hỗ trợ xem trước
          </h3>
          <p className="text-gray-600 mb-4">
            File loại .{fileExtension} không hỗ trợ xem trước. Vui lòng tải xuống để xem.
          </p>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Tải xuống
          </button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="flex-shrink-0 px-6 py-4 border-b bg-gray-50 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {renderFileIcon()}
              <div>
                <DialogTitle className="text-lg font-semibold text-gray-900">
                  {fileName}
                </DialogTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Xem trước file • {fileType === 'image' ? 'Ảnh' : fileType === 'document' ? 'Tài liệu' : 'File'} • .{fileExtension.toUpperCase()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Download Button */}
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                title="Tải xuống file"
              >
                <Download className="w-4 h-4" />
                Tải xuống
              </button>

              {/* Close Button */}
              <DialogClose asChild>
                <button
                  onClick={onClose}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                  title="Đóng"
                >
                  <X className="w-4 h-4" />
                </button>
              </DialogClose>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-6">
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-3 border-t bg-gray-50 text-xs text-gray-500 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span>Kích thước: {fileType === 'document' ? 'Đang tải...' : 'N/A'}</span>
              <span>•</span>
              <span>URL: {fileUrl.length > 60 ? `${fileUrl.substring(0, 60)}...` : fileUrl}</span>
            </div>
            <div className="flex items-center gap-4">
              {fileType === 'document' && (
                <span className="text-blue-600 flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  React Doc Viewer
                </span>
              )}
              <span className="text-green-600">
                ✓ Client-side rendering
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
