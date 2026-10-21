"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Link as LinkIcon, ExternalLink } from "lucide-react";
import { toast } from "sonner";

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

interface SharedLinksProps {
  roomId: string;
  isActive: boolean;
}

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

function SharedLinksSkeleton() {
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

export const SharedLinks: React.FC<SharedLinksProps> = ({
  roomId,
  isActive,
}) => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fetchLinks = useCallback(async () => {
    if (!roomId || !isActive) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/media?type=links`);
      const data = await res.json();
      if (data.success && data.items) {
        setItems(data.items);
      }
    } catch (err) {
      console.error("Error fetching links:", err);
      toast.error("Không thể tải danh sách link");
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [roomId, isActive]);

  useEffect(() => {
    if (isActive && !loaded) {
      fetchLinks();
    }
  }, [isActive, loaded, fetchLinks]);

  const handleLinkClick = (url: string) => {
    const finalUrl = url.startsWith("www.") ? "https://" + url : url;
    window.open(finalUrl, "_blank", "noopener,noreferrer");
  };

  if (!isActive) return null;

  if (loading) return <SharedLinksSkeleton />;

  return (
    <div className="space-y-2">
      {items.length === 0 ? (
        <div className="text-center py-12">
          <LinkIcon
            size={48}
            className="mx-auto text-muted-foreground mb-3 opacity-50"
          />
          <p className="text-sm text-muted-foreground">
            Chưa có link nào được chia sẻ
          </p>
        </div>
      ) : (
        items.map((item) => (
          <a
            key={item.id}
            href={item.url.startsWith("www.") ? "https://" + item.url : item.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick(item.url);
            }}
            className="flex items-start gap-3 p-3 bg-muted/50 hover:bg-muted rounded-lg transition-colors text-left border border-border group"
          >
            <div className="p-2 bg-primary/10 rounded-lg shrink-0">
              <ExternalLink size={20} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-primary truncate group-hover:underline">
                {item.name}
              </p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {item.url}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {item.sender.name} • {formatDate(item.createdAt)}
              </p>
            </div>
          </a>
        ))
      )}
    </div>
  );
};
