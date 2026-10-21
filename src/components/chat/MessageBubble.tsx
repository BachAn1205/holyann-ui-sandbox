"use client";

import React, { useState, memo } from "react";
import { CheckCheck, Clock, AlertCircle, FileText, File, Download, MoreVertical, Trash2, CalendarClock } from "lucide-react";
import { Message, Attachment, MeetingMessageData } from "./types";
import { formatMessageTime } from "./utils";
import { getSignedUrlFromFullUrl } from "@/actions/storage";
import { toast } from "sonner";
import FilePreviewModal from "@/components/common/FilePreviewModal";
import { UserAvatar } from "./UserAvatar";
import MeetingDetailModal from "./MeetingDetailModal";

interface MessageBubbleProps {
    message: Message;
    /** Chỉ hiện nút xóa khi là tin của mình và có callback */
    onDeleteMessage?: (messageId: string) => Promise<void>;
    onDeleteAttachment?: (messageId: string, attachmentId: string) => Promise<void>;
}

// URL regex pattern - matches http, https, www links
const URL_REGEX = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;

// Helper function: Parse text and convert URLs to clickable links
const parseTextWithLinks = (text: string, isMine: boolean): React.ReactNode[] => {
    if (!text) return [];

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    // Reset regex lastIndex
    URL_REGEX.lastIndex = 0;

    while ((match = URL_REGEX.exec(text)) !== null) {
        // Add text before the link
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }

        // Get the URL
        let url = match[0];
        const displayUrl = url;

        // Add https:// if URL starts with www.
        if (url.startsWith('www.')) {
            url = 'https://' + url;
        }

        // Add the link element
        parts.push(
            <a
                key={`link-${match.index}`}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                    // Only open link if Ctrl/Cmd is pressed
                    if (!e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        toast.info('Giữ Ctrl + Click để mở link', { duration: 2000 });
                    }
                }}
                className={`font-semibold underline underline-offset-2 cursor-pointer hover:opacity-80 transition-opacity ${
                    isMine 
                        ? 'text-white decoration-white/70' 
                        : 'text-blue-600 dark:text-blue-400 decoration-blue-500/50'
                }`}
                title="Giữ Ctrl + Click để mở link"
            >
                {displayUrl}
            </a>
        );

        lastIndex = match.index + match[0].length;
    }

    // Add remaining text after the last link
    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }

    // If no links found, return original text
    if (parts.length === 0) {
        return [text];
    }

    return parts;
};

// Helper function: Format file size from bytes to human readable format
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

// Helper function: Get file icon based on file type
const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) return FileText;
    if (fileType.includes("document") || fileType.includes("word")) return FileText;
    if (fileType.includes("sheet") || fileType.includes("excel")) return FileText;
    return File;
};

// Helper function: Check if file is an image
const isImageFile = (fileType: string): boolean => {
    return fileType.startsWith("image/");
};

export const MessageBubble = memo(function MessageBubble({ message, onDeleteMessage, onDeleteAttachment }: MessageBubbleProps) {
    // ── Meeting message detection ──────────────────────────────
    const MEETING_PREFIX = '__MEETING__';
    const isMeetingMessage = message.type === 'MEETING' ||
        (typeof message.content === 'string' && message.content.startsWith(MEETING_PREFIX));

    const parsedMeetingData: MeetingMessageData | null = (() => {
        if (message.meetingData) return message.meetingData;
        if (isMeetingMessage && message.content) {
            try {
                return JSON.parse(message.content.replace(MEETING_PREFIX, '')) as MeetingMessageData;
            } catch { return null; }
        }
        return null;
    })();

    const [meetingDetailOpen, setMeetingDetailOpen] = useState(false);
    // isMentor: detect from role. If senderRole not present, caller should pass it.
    // We infer: if isMine and meeting msg → likely mentor. For full accuracy, caller can pass.
    // For now, render both links only if explicitly set via meetingData.hostMeetLink is present.
    const showHostLink = !!parsedMeetingData?.hostMeetLink;

    // ── Regular message state ──────────────────────────────────
    const hasContent = !isMeetingMessage && message.content && message.content.trim().length > 0;
    const [showMenu, setShowMenu] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null);

    const handleDeleteMessage = async () => {
        if (!onDeleteMessage || deleting || message.isSending) return;
        if (!confirm("Bạn có chắc muốn xóa tin nhắn này?")) return;
        setDeleting(true);
        try {
            await onDeleteMessage(message.id);
            toast.success("Đã xóa tin nhắn");
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Không thể xóa tin nhắn");
        } finally {
            setDeleting(false);
            setShowMenu(false);
        }
    };

    const handleDeleteAttachment = async (e: React.MouseEvent, attachmentId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!onDeleteAttachment || deletingAttachmentId) return;
        if (!confirm("Bạn có chắc muốn xóa file này?")) return;
        setDeletingAttachmentId(attachmentId);
        try {
            await onDeleteAttachment(message.id, attachmentId);
            toast.success("Đã xóa file");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Không thể xóa file");
        } finally {
            setDeletingAttachmentId(null);
        }
    };

    // State for file preview modal
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [previewName, setPreviewName] = useState<string>("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);

    // State for image URLs (signed URLs for display)
    const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map());
    const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());

    // Separate images from other files
    const images = message.attachments?.filter((att: Attachment) => isImageFile(att.type || "")) || [];
    const files = message.attachments?.filter((att: Attachment) => !isImageFile(att.type || "")) || [];

    /**
     * Generate signed URL for image display
     */
    const getImageUrl = async (attachment: Attachment): Promise<string> => {
        // Check cache first
        if (imageUrls.has(attachment.id)) {
            return imageUrls.get(attachment.id)!;
        }

        // Check if already loading
        if (loadingImages.has(attachment.id)) {
            return attachment.url; // Return original URL while loading
        }

        try {
            setLoadingImages(prev => new Set(prev).add(attachment.id));

            // Try to generate signed URL
            const result = await getSignedUrlFromFullUrl(attachment.url);

            if (result.success && result.signedUrl) {
                const signedUrl = result.signedUrl;
                setImageUrls(prev => new Map(prev).set(attachment.id, signedUrl));
                return signedUrl;
            } else {
                console.warn('⚠️ Failed to get signed URL, using original:', result.error);
                return attachment.url; // Fallback to original URL
            }
        } catch (error) {
            console.error('❌ Error getting image URL:', error);
            return attachment.url; // Fallback to original URL
        } finally {
            setLoadingImages(prev => {
                const newSet = new Set(prev);
                newSet.delete(attachment.id);
                return newSet;
            });
        }
    };

    /**
     * Handle file/image click - Generate signed URL and open preview
     */
    const handleFileClick = async (
        e: React.MouseEvent,
        attachment: Attachment
    ) => {
        e.preventDefault();

        setIsLoadingPreview(true);
        toast.loading('Đang tải file...', { id: 'file-preview' });

        try {

            // Get signed URL from server
            const result = await getSignedUrlFromFullUrl(attachment.url);

            if (!result.success || !result.signedUrl) {
                throw new Error(result.error || 'Failed to generate signed URL');
            }

            toast.success('File đã sẵn sàng!', { id: 'file-preview' });

            // Set preview data and open modal
            setPreviewUrl(result.signedUrl);
            setPreviewName(attachment.name);
            setIsModalOpen(true);
        } catch (error) {
            console.error('❌ Error opening file:', error);
            toast.error('Không thể mở file', { id: 'file-preview' });

            // Fallback: Try to open original URL in new tab
            window.open(attachment.url, '_blank', 'noopener,noreferrer');
        } finally {
            setIsLoadingPreview(false);
        }
    };

    /**
     * Close preview modal
     */
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setPreviewUrl("");
        setPreviewName("");
    };

    /**
     * Image component with signed URL support
     */
    const ImageDisplay: React.FC<{ image: Attachment; className?: string }> = ({ image, className }) => {
        const [currentUrl, setCurrentUrl] = useState<string>(image.url);
        const [isLoading, setIsLoading] = useState(false);
        const [hasError, setHasError] = useState(false);

        // Load signed URL on mount
        React.useEffect(() => {
            const loadImage = async () => {
                setIsLoading(true);
                try {
                    const signedUrl = await getImageUrl(image);
                    setCurrentUrl(signedUrl);
                    setHasError(false);
                } catch (error) {
                    console.error('Error loading image:', error);
                    setHasError(true);
                } finally {
                    setIsLoading(false);
                }
            };

            loadImage();
        }, [image.id]);

        if (hasError) {
            return (
                <div className={`${className} bg-gray-100 dark:bg-gray-700 flex items-center justify-center`}>
                    <div className="text-center p-4">
                        <AlertCircle size={24} className="text-gray-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-500">Không thể tải ảnh</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="relative">
                {isLoading && (
                    <div className={`${className} bg-gray-100 dark:bg-gray-700 flex items-center justify-center`}>
                        <Clock size={24} className="text-gray-400 animate-spin" />
                    </div>
                )}
                <img
                    src={currentUrl}
                    alt="Hình ảnh"
                    className={`${className} ${isLoading ? 'hidden' : 'block'}`}
                    onLoad={() => setIsLoading(false)}
                    onError={(e) => {
                        console.error('Image load error for image attachment:', currentUrl);
                        setHasError(true);
                        setIsLoading(false);
                    }}
                />
            </div>
        );
    };

    // ── MEETING bubble (early return) ──────────────────────────
    if (isMeetingMessage && parsedMeetingData) {
        const meetStart = new Date(parsedMeetingData.startTime);
        const meetLabel = meetStart.toLocaleString('vi-VN', {
            weekday: 'long', day: '2-digit', month: '2-digit',
            hour: '2-digit', minute: '2-digit',
        });

        return (
            <div className={`flex justify-center w-full my-4 ${message.isSending ? 'opacity-70' : ''}`}>
                <div className="w-[300px] flex flex-col items-center space-y-2">
                    {/* Zalo-style meeting card */}
                    <div className="w-full rounded-2xl overflow-hidden border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800 shadow-sm">
                        {/* Header */}
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-800/60">
                            <CalendarClock className="w-4 h-4 text-blue-500 shrink-0" />
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Lịch tư vấn</span>
                        </div>
                        {/* Body */}
                        <div className="px-4 py-3 space-y-1.5">
                            <p className="text-sm font-semibold text-foreground">{parsedMeetingData.title}</p>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Clock className="w-3.5 h-3.5 shrink-0" />
                                <span className="capitalize">{meetLabel}</span>
                            </div>
                        </div>
                        {/* Button */}
                        <div className="px-3 pb-3">
                            <button
                                onClick={() => setMeetingDetailOpen(true)}
                                className="w-full py-2 text-sm font-semibold text-blue-600 dark:text-blue-400 rounded-xl border border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                            >
                                Xem chi tiết
                            </button>
                        </div>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-slate-500 px-1">{formatMessageTime(message.timestamp)}</span>
                </div>

                <MeetingDetailModal
                    open={meetingDetailOpen}
                    onClose={() => setMeetingDetailOpen(false)}
                    meeting={parsedMeetingData}
                    isMentor={showHostLink}
                />
            </div>
        );
    }

    return (
        <div
            className={`flex items-end gap-2 ${
                message.isMine ? "flex-row-reverse" : ""
            } ${message.isSending ? "opacity-70" : ""}`}
        >
            {/* Sender Avatar */}
            {!message.isMine && (
                <UserAvatar
                    avatarUrl={message.senderAvatar}
                    name={message.senderName}
                    size="sm"
                />
            )}

            <div
                className={`max-w-[75%] md:max-w-[70%] ${
                    message.isMine ? "items-end" : "items-start"
                } space-y-2`}
            >
                {/* Main Message Bubble */}
                {(hasContent || files.length > 0) && (
                    <div
                        className={`rounded-xl md:rounded-2xl overflow-hidden ${
                            message.isMine
                                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md"
                                : "bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-slate-200 rounded-bl-md shadow-sm"
                        } ${message.isError ? "border-red-500 border-2" : ""}`}
                    >
                        {/* Text Content */}
                        {hasContent && (
                            <div className="px-3 py-2 md:px-4 md:py-3">
                                <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                                    {parseTextWithLinks(message.content || '', message.isMine)}
                                </p>
                            </div>
                        )}

                        {/* File Attachments (non-images) */}
                        {files.length > 0 && (
                            <div className={`${hasContent ? "px-3 pb-2 md:px-4 md:pb-3 pt-0" : "p-3 md:p-4"} space-y-2`}>
                                {files.map((file: Attachment) => {
                                    const FileIcon = getFileIcon(file.type || "");

                                    return (
                                        <div
                                            key={file.id}
                                            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                                                message.isMine
                                                    ? "bg-white/20 hover:bg-white/30"
                                                    : "bg-gray-100 dark:bg-slate-600 hover:bg-gray-200 dark:hover:bg-slate-500"
                                            } group relative`}
                                        >
                                            <button
                                                onClick={(e) => handleFileClick(e, file)}
                                                disabled={isLoadingPreview}
                                                className={`flex-1 flex items-center gap-3 min-w-0 ${isLoadingPreview ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                                            >
                                                <div
                                                    className={`p-2 rounded-lg shrink-0 ${
                                                        message.isMine
                                                            ? "bg-white/30"
                                                            : "bg-blue-100 dark:bg-blue-900/30"
                                                    }`}
                                                >
                                                    <FileIcon
                                                        size={20}
                                                        className={
                                                            message.isMine
                                                                ? "text-white"
                                                                : "text-blue-600 dark:text-blue-400"
                                                        }
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p
                                                        className={`text-sm font-medium truncate ${
                                                            message.isMine
                                                                ? "text-white"
                                                                : "text-gray-900 dark:text-slate-100"
                                                        }`}
                                                    >
                                                        {file.name}
                                                    </p>
                                                    <p
                                                        className={`text-xs ${
                                                            message.isMine
                                                                ? "text-white/80"
                                                                : "text-gray-500 dark:text-slate-400"
                                                        }`}
                                                    >
                                                        {formatFileSize(file.size || 0)}
                                                    </p>
                                                </div>
                                                {isLoadingPreview ? (
                                                    <Clock size={18} className="animate-spin text-gray-400 shrink-0" />
                                                ) : (
                                                    <Download
                                                        size={18}
                                                        className={`shrink-0 ${message.isMine ? "text-white/80" : "text-gray-400 dark:text-slate-400"}`}
                                                    />
                                                )}
                                            </button>
                                            {message.isMine && onDeleteAttachment && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleDeleteAttachment(e, file.id)}
                                                    disabled={deletingAttachmentId === file.id}
                                                    className="absolute top-2 right-2 p-1.5 rounded-md bg-black/20 hover:bg-red-500/90 text-white shrink-0"
                                                    title="Xóa file"
                                                >
                                                    {deletingAttachmentId === file.id ? (
                                                        <Clock size={14} className="animate-spin" />
                                                    ) : (
                                                        <Trash2 size={14} />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Image Attachments */}
                {images.length > 0 && (
                    <div
                        className={`${
                            images.length > 1 ? "grid grid-cols-2 gap-2" : ""
                        }`}
                    >
                        {images.map((image: Attachment) => (
                            <div key={image.id} className="relative group/img">
                                <button
                                    onClick={(e) => handleFileClick(e, image)}
                                    disabled={isLoadingPreview}
                                    className={`block w-full rounded-lg overflow-hidden ${
                                        isLoadingPreview ? 'opacity-50 cursor-wait' : 'cursor-pointer'
                                    }`}
                                >
                                    <ImageDisplay
                                        image={image}
                                        className={`rounded-lg object-cover transition-all group-hover/img:scale-105 ${
                                            images.length > 1
                                                ? "w-full h-32 md:h-40"
                                                : "max-w-[300px] max-h-[300px]"
                                        }`}
                                    />
                                    <div className="absolute inset-0 bg-transparent group-hover/img:bg-black/5 dark:group-hover/img:bg-white/5 transition-all rounded-lg flex items-center justify-center" />
                                </button>
                                {message.isMine && onDeleteAttachment && (
                                    <button
                                        type="button"
                                        onClick={(e) => handleDeleteAttachment(e, image.id)}
                                        disabled={deletingAttachmentId === image.id}
                                        className="absolute top-2 right-2 p-1.5 rounded-md bg-black/50 hover:bg-red-500/90 text-white"
                                        title="Xóa ảnh"
                                    >
                                        {deletingAttachmentId === image.id ? (
                                            <Clock size={14} className="animate-spin" />
                                        ) : (
                                            <Trash2 size={14} />
                                        )}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Timestamp, Status, Delete menu */}
                <div
                    className={`flex items-center gap-1 ${
                        message.isMine ? "justify-end" : "justify-start"
                    }`}
                >
                    <span className="text-xs text-gray-400 dark:text-slate-500">
                        {formatMessageTime(message.timestamp)}
                    </span>
                    {message.isMine && (
                        <>
                            {message.isError ? (
                                <AlertCircle size={14} className="text-red-500" />
                            ) : message.isSending ? (
                                <Clock size={14} className="text-gray-400 animate-pulse" />
                            ) : (
                                <CheckCheck
                                    size={14}
                                    className={
                                        message.isRead
                                            ? "text-blue-500 dark:text-blue-400"
                                            : "text-gray-400 dark:text-slate-500"
                                    }
                                />
                            )}
                            {onDeleteMessage && !message.isSending && (
                                <div className="relative inline-block">
                                    <button
                                        type="button"
                                        onClick={() => setShowMenu((v) => !v)}
                                        disabled={deleting}
                                        className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                                        aria-label="Tùy chọn"
                                    >
                                        <MoreVertical size={14} />
                                    </button>
                                    {showMenu && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-10"
                                                aria-hidden
                                                onClick={() => setShowMenu(false)}
                                            />
                                            <div className="absolute right-0 top-full mt-0.5 z-20 py-1 min-w-[140px] bg-popover border border-border rounded-md shadow-md">
                                                <button
                                                    type="button"
                                                    onClick={handleDeleteMessage}
                                                    disabled={deleting}
                                                    className="w-full px-3 py-1.5 text-left text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2"
                                                >
                                                    <Trash2 size={14} />
                                                    {deleting ? "Đang xóa..." : "Xóa tin nhắn"}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* File Preview Modal */}
            <FilePreviewModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                fileUrl={previewUrl}
                fileName={previewName}
            />
        </div>
    );
});