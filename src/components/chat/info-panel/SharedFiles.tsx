"use client";

import React, { useEffect, useState, useCallback } from "react";
import { FileText, File, Download, Loader2 } from "lucide-react";
import { getSignedUrlFromFullUrl } from "@/actions/storage";
import { toast } from "sonner";
import FilePreviewModal from "@/components/common/FilePreviewModal";

interface MediaItem {
  id: string;
  url: string;
  name: string;
  type: string;
  size: number | null;
  thumbnail: string | null;
  createdAt: string;
  sender: { name: string; avatar: string | null };
}

interface SharedFilesProps {
  roomId: string;
  isActive: boolean;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

function SharedFilesSkeleton() {
  return (
    <div className="space-y-2" aria-hidden>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 animate-pulse"
        >
          <div className="w-10 h-10 rounded-lg bg-muted" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-3 w-3/4 bg-muted rounded" />
            <div className="h-2 w-1/2 bg-muted/80 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export const SharedFiles: React.FC<SharedFilesProps> = ({
  roomId,
  isActive,
}) => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewName, setPreviewName] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const fetchFiles = useCallback(async () => {
    if (!roomId || !isActive) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/media?type=files`);
      const data = await res.json();
      if (data.success && data.items) {
        setItems(data.items);
      }
    } catch (err) {
      console.error("Error fetching files:", err);
      toast.error("Không thể tải danh sách file");
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [roomId, isActive]);

  useEffect(() => {
    if (isActive && !loaded) {
      fetchFiles();
    }
  }, [isActive, loaded, fetchFiles]);

  const handleFileClick = async (item: MediaItem) => {
    setLoadingPreview(true);
    toast.loading("Đang tải file...", { id: "file-preview" });
    try {
      const result = await getSignedUrlFromFullUrl(item.url);
      if (!result.success || !result.signedUrl) {
        throw new Error(result.error);
      }
      toast.success("File đã sẵn sàng!", { id: "file-preview" });
      setPreviewUrl(result.signedUrl);
      setPreviewName(item.name);
      setIsPreviewOpen(true);
    } catch (err) {
      toast.error("Không thể mở file", { id: "file-preview" });
      window.open(item.url, "_blank");
    } finally {
      setLoadingPreview(false);
    }
  };

  if (!isActive) return null;

  if (loading) return <SharedFilesSkeleton />;

  return (
    <>
      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <FileText
              size={48}
              className="mx-auto text-muted-foreground mb-3 opacity-50"
            />
            <p className="text-sm text-muted-foreground">
              Chưa có file nào được chia sẻ
            </p>
          </div>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              onClick={() => handleFileClick(item)}
              disabled={loadingPreview}
              className="w-full flex items-center gap-3 p-3 bg-muted/50 hover:bg-muted rounded-lg transition-colors text-left border border-border"
            >
              <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                <File size={20} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {item.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(item.size || 0)} • {item.sender.name} •{" "}
                  {formatDate(item.createdAt)}
                </p>
              </div>
              {loadingPreview ? (
                <Loader2 size={18} className="animate-spin text-muted-foreground shrink-0" />
              ) : (
                <Download size={18} className="text-muted-foreground shrink-0" />
              )}
            </button>
          ))
        )}
      </div>
      <FilePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setPreviewUrl("");
          setPreviewName("");
        }}
        fileUrl={previewUrl}
        fileName={previewName}
      />
    </>
  );
};
