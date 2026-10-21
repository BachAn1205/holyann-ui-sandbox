'use client';

import { useState, useEffect } from 'react';
import { Image as ImageIcon, File, FileText, Download, ExternalLink, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface MediaGalleryProps {
  roomId: string;
  className?: string;
}

interface MediaItem {
  id: string;
  url: string;
  name: string;
  type: string;
  size: number | null;
  thumbnail: string | null;
  createdAt: Date;
  sender: {
    name: string;
    avatar: string | null;
  };
}

export default function MediaGallery({ roomId, className }: MediaGalleryProps) {
  const [activeTab, setActiveTab] = useState<'images' | 'files' | 'links'>('images');
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<MediaItem | null>(null);

  useEffect(() => {
    loadMedia();
  }, [roomId, activeTab]);

  const loadMedia = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/chat/rooms/${roomId}/media?type=${activeTab}`);

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setItems(
            data.items.map((item: any) => ({
              ...item,
              createdAt: new Date(item.createdAt),
            }))
          );
        }
      }
    } catch (error) {
      console.error('Error loading media:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-blue-500" />;
    if (type.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredItems = items.filter((item) => {
    if (activeTab === 'images') return item.type.startsWith('image/');
    if (activeTab === 'files')
      return !item.type.startsWith('image/') && item.type !== 'LINK';
    if (activeTab === 'links') return item.type === 'LINK';
    return true;
  });

  return (
    <div className={cn('flex flex-col h-full bg-white', className)}>
      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('images')}
          className={cn(
            'flex-1 px-4 py-3 text-sm font-medium transition-colors',
            activeTab === 'images'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <ImageIcon className="w-4 h-4 inline-block mr-2" />
          Ảnh
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={cn(
            'flex-1 px-4 py-3 text-sm font-medium transition-colors',
            activeTab === 'files'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <File className="w-4 h-4 inline-block mr-2" />
          File
        </button>
        <button
          onClick={() => setActiveTab('links')}
          className={cn(
            'flex-1 px-4 py-3 text-sm font-medium transition-colors',
            activeTab === 'links'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <ExternalLink className="w-4 h-4 inline-block mr-2" />
          Link
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-sm">Chưa có {activeTab === 'images' ? 'ảnh' : activeTab === 'files' ? 'file' : 'link'} nào</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeTab === 'images' && (
              <div className="grid grid-cols-2 gap-3">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedImage(item)}
                    className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={item.thumbnail || item.url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'files' && (
              <div className="space-y-2">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-shrink-0">{getFileIcon(item.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(item.size)} •{' '}
                        {format(item.createdAt, 'dd/MM/yyyy', { locale: vi })}
                      </p>
                    </div>
                    <a
                      href={item.url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 p-2 hover:bg-white rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4 text-gray-600" />
                    </a>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'links' && (
              <div className="space-y-2">
                {filteredItems.map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <ExternalLink className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-indigo-600 truncate hover:underline">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{item.url}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {format(item.createdAt, 'dd/MM/yyyy', { locale: vi })}
                        </p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image Viewer Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--overlay-dark)]"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          <div className="max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedImage.url}
              alt={selectedImage.name}
              className="w-full h-full object-contain rounded-lg"
            />
            <div className="mt-4 text-center">
              <p className="text-white text-sm">{selectedImage.name}</p>
              <a
                href={selectedImage.url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Tải xuống
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
