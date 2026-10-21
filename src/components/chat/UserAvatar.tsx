"use client";

import React, { useState, useCallback } from "react";
import { getInitialsAvatar } from "@/utils/avatar";

const BUCKET_NAME = "hoex-documents";

/** Check if URL is a valid Supabase storage URL (not local path) */
function isSupabaseStorageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string" || url.trim() === "") return false;
  // Reject local paths - only allow Supabase URLs
  if (url.startsWith("/") || url.startsWith("file:")) return false;
  return url.includes("supabase") || url.startsWith("http");
}

/** Convert Supabase storage path to public URL (when DB stores path instead of full URL) */
function getSupabasePublicUrl(path: string): string | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;
  const cleanPath = path.replace(/^\/+/, "");
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${cleanPath}`;
}

/** Generate consistent background color from name for UI fallback */
function getAvatarBackgroundColor(name: string | null): string {
  if (!name) return "bg-primary/20";
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hues = [
    "bg-primary/20 text-primary",
    "bg-violet-500/20 text-violet-600 dark:text-violet-400",
    "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    "bg-amber-500/20 text-amber-600 dark:text-amber-400",
    "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400",
  ];
  return hues[hash % hues.length];
}

export interface UserAvatarProps {
  /** Supabase storage URL or null - never use local paths */
  avatarUrl?: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "header";
  className?: string;
  showOnlineIndicator?: boolean;
  isOnline?: boolean;
}

const sizeClasses = {
  sm: "w-7 h-7 md:w-8 md:h-8 text-xs",
  md: "w-10 h-10 md:w-12 md:h-12 text-sm",
  lg: "w-16 h-16 text-lg",
  /** Fixed w-10 h-10 for header */
  header: "w-10 h-10 text-sm",
};

/**
 * UserAvatar for Discussion/Chat - Supabase Storage only.
 * - Never uses local static paths (no 404s)
 * - If avatarUrl is null or invalid: renders UI fallback (initials + background)
 * - If avatar load fails: falls back to UI avatar
 * - Lazy loads images with loading="lazy" decoding="async"
 */
export const UserAvatar = React.memo(function UserAvatar({
  avatarUrl,
  name,
  size = "md",
  className = "",
  showOnlineIndicator = false,
  isOnline = false,
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const initials = getInitialsAvatar(name) || "?";
  const bgColor = getAvatarBackgroundColor(name);
  const sizeClass = sizeClasses[size];

  // Resolve avatar URL: use as-is if full Supabase URL, else try path→public URL
  const resolvedUrl = (() => {
    if (!avatarUrl || imageError) return null;
    if (isSupabaseStorageUrl(avatarUrl)) return avatarUrl;
    // DB might store path (e.g. "userId/avatars/file.jpg") - generate public URL
    if (!avatarUrl.includes("http") && !avatarUrl.startsWith("/")) {
      return getSupabasePublicUrl(avatarUrl);
    }
    return null;
  })();

  const shouldShowImage = !!resolvedUrl;

  const handleError = useCallback(() => {
    setImageError(true);
    setImageLoaded(false);
  }, []);

  const handleLoad = useCallback(() => {
    setImageLoaded(true);
    setImageError(false);
  }, []);

  // UI fallback: initials + background color (no image request)
  const renderFallback = () => (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-semibold border-2 border-background shadow-sm ${bgColor} ${className}`}
      aria-hidden
    >
      {initials}
    </div>
  );

  if (!shouldShowImage) {
    return (
      <div className="relative shrink-0">
        {renderFallback()}
        {showOnlineIndicator && isOnline && (
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-background" />
        )}
      </div>
    );
  }

  return (
    <div className="relative shrink-0">
      <div
        className={`${sizeClass} rounded-full overflow-hidden border-2 border-background shadow-sm ${className}`}
      >
        {imageError ? (
          <div
            className={`w-full h-full flex items-center justify-center font-semibold ${bgColor}`}
          >
            {initials}
          </div>
        ) : (
          <>
            {!imageLoaded && (
              <div
                className={`absolute inset-0 flex items-center justify-center ${bgColor} animate-pulse`}
                aria-hidden
              >
                <span className="font-semibold opacity-70">{initials}</span>
              </div>
            )}
        <img
          src={resolvedUrl!}
              alt={name}
              loading="lazy"
              decoding="async"
              className={`w-full h-full object-cover ${!imageLoaded ? "opacity-0" : "opacity-100"} transition-opacity duration-200`}
              onError={handleError}
              onLoad={handleLoad}
            />
          </>
        )}
      </div>
      {showOnlineIndicator && isOnline && (
        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-background" />
      )}
    </div>
  );
});
