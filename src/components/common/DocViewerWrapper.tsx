'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface DocViewerWrapperProps {
  fileUrl: string;
  fileName: string;
}

// This component is loaded dynamically to avoid SSR issues with canvas
export default function DocViewerWrapper({ fileUrl, fileName }: DocViewerWrapperProps) {
  const [DocViewer, setDocViewer] = useState<React.ComponentType<any> | null>(null);
  const [renderers, setRenderers] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only load on client side
    if (typeof window === 'undefined') return;

    const loadDocViewer = async () => {
      try {
        const mod = await import('@cyntler/react-doc-viewer');
        setDocViewer(() => mod.default);
        setRenderers(mod.DocViewerRenderers);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load DocViewer:', err);
        setError('Failed to load document viewer');
        setIsLoading(false);
      }
    };

    loadDocViewer();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-sm text-gray-600">Đang tải trình xem tài liệu...</p>
        </div>
      </div>
    );
  }

  if (error || !DocViewer || !renderers) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-center text-red-500">
          <p>{error || 'Không thể tải trình xem tài liệu'}</p>
        </div>
      </div>
    );
  }

  return (
    <DocViewer
      documents={[{
        uri: fileUrl,
        fileName: fileName
      }]}
      pluginRenderers={renderers}
      config={{
        header: {
          disableHeader: true,
          disableFileName: true,
          retainURLParams: false,
        },
        csvDelimiter: ',',
      }}
      theme={{
        primary: '#0f4c81',
        secondary: '#e5e7eb',
        tertiary: '#f3f4f6',
        textPrimary: '#1f2937',
        textSecondary: '#6b7280',
        disableThemeScrollbar: false,
      }}
      style={{
        height: '70vh',
        width: '100%',
        backgroundColor: '#ffffff'
      }}
    />
  );
}
