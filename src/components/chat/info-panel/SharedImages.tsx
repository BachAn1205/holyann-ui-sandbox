"use client";

import React, { useEffect, useState } from "react";
import { Image as ImageIcon } from "lucide-react";
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

interface SharedImagesProps {
  roomId: string;
  isActive: boolean;
}

function SharedImagesSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-2" aria-hidden>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="aspect-square rounded-lg bg-muted animate-pulse"
        />
      ))}
    </div>
  );
}

export const SharedImages: React.FC<SharedImagesProps> = ({
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

  useEffect(() => {
    if (!roomId || !isActive) return;
    if (loaded) return;

    const fetchImages = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/chat/rooms/${roomId}/media?type=images`);
        const data = await res.json();
        if (data.success && data.items) {
          setItems(data.items);
        }
      } catch (err) {
        console.error("Error fetching images:", err);
        toast.error("Không thể tải danh sách ảnh");
      } finally {
        setLoading(false);
        setLoaded(true);
      }
    };

    fetchImages();
  }, [roomId, isActive, loaded]);

  const handleImageClick = async (item: MediaItem) => {
    setLoadingPreview(true);
    toast.loading("Đang tải ảnh...", { id: "image-preview" });
    try {
      const result = await getSignedUrlFromFullUrl(item.url);
      if (!result.success || !result.signedUrl) {
        throw new Error(result.error);
      }
      toast.success("Ảnh đã sẵn sàng!", { id: "image-preview" });
      setPreviewUrl(result.signedUrl);
      setPreviewName(item.name);
      setIsPreviewOpen(true);
    } catch (err) {
      toast.error("Không thể mở ảnh", { id: "image-preview" });
      window.open(item.url, "_blank");
    } finally {
      setLoadingPreview(false);
    }
  };

  if (!isActive) return null;

  if (loading) return <SharedImagesSkeleton />;

  return (
    <>
      <div>
        {items.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon
              size={48}
              className="mx-auto text-muted-foreground mb-3 opacity-50"
            />
            <p className="text-sm text-muted-foreground">
              Chưa có ảnh nào được chia sẻ
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => handleImageClick(item)}
                disabled={loadingPreview}
                className="relative aspect-square rounded-lg overflow-hidden group border border-border"
              >
                <img
                  src={item.thumbnail || item.url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <div className="absolute inset-0 bg-transparent group-hover:bg-black/10 dark:group-hover:bg-white/5 transition-colors" />
              </button>
            ))}
          </div>
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
