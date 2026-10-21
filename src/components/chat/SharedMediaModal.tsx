"use client";

import React, { useState } from "react";
import {
    X,
    FileText,
    Image as ImageIcon,
    Link as LinkIcon,
    Download,
    ExternalLink,
    File,
    Loader2
} from "lucide-react";
import { Message, Attachment } from "./types";
import { getSignedUrlFromFullUrl } from "@/actions/storage";
import { toast } from "sonner";
import FilePreviewModal from "@/components/common/FilePreviewModal";

interface SharedMediaModalProps {
    isOpen: boolean;
    onClose: () => void;
    messages: Message[];
    partnerName: string;
}

// URL regex pattern - matches http, https, www links
const URL_REGEX = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;

// Extract links from message content
const extractLinksFromText = (text: string): string[] => {
    if (!text) return [];
    const matches = text.match(URL_REGEX);
    return matches || [];
};

// Format file size
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

// Check if file is an image
const isImageFile = (fileType: string): boolean => {
    return fileType?.startsWith("image/") || false;
};

type TabType = "files" | "images" | "links";

export const SharedMediaModal: React.FC<SharedMediaModalProps> = ({
    isOpen,
    onClose,
    messages,
    partnerName
}) => {
    const [activeTab, setActiveTab] = useState<TabType>("files");
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [previewName, setPreviewName] = useState<string>("");
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Extract all files, images and links from messages
    const allFiles: { attachment: Attachment; senderName: string; timestamp: Date }[] = [];
    const allImages: { attachment: Attachment; senderName: string; timestamp: Date }[] = [];
    const allLinks: { url: string; senderName: string; timestamp: Date }[] = [];

    messages.forEach((msg) => {
        // Extract attachments
        if (msg.attachments && msg.attachments.length > 0) {
            msg.attachments.forEach((att) => {
                if (isImageFile(att.type || "")) {
                    allImages.push({
                        attachment: att,
                        senderName: msg.senderName,
                        timestamp: msg.timestamp
                    });
                } else {
                    allFiles.push({
                        attachment: att,
                        senderName: msg.senderName,
                        timestamp: msg.timestamp
                    });
                }
            });
        }

        // Extract links from text
        if (msg.content) {
            const links = extractLinksFromText(msg.content);
            links.forEach((url) => {
                allLinks.push({
                    url,
                    senderName: msg.senderName,
                    timestamp: msg.timestamp
                });
            });
        }
    });

    // Sort by timestamp (newest first)
    allFiles.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    allImages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    allLinks.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Handle file click
    const handleFileClick = async (attachment: Attachment) => {
        setIsLoading(true);
        toast.loading('Đang tải file...', { id: 'media-preview' });

        try {
            const result = await getSignedUrlFromFullUrl(attachment.url);

            if (!result.success || !result.signedUrl) {
                throw new Error(result.error || 'Failed to generate signed URL');
            }

            toast.success('File đã sẵn sàng!', { id: 'media-preview' });
            setPreviewUrl(result.signedUrl);
            setPreviewName(attachment.name);
            setIsPreviewOpen(true);
        } catch (error) {
            console.error('Error opening file:', error);
            toast.error('Không thể mở file', { id: 'media-preview' });
            window.open(attachment.url, '_blank', 'noopener,noreferrer');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle link click
    const handleLinkClick = (url: string) => {
        let finalUrl = url;
        if (url.startsWith('www.')) {
            finalUrl = 'https://' + url;
        }
        window.open(finalUrl, '_blank', 'noopener,noreferrer');
    };

    // Format date
    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!isOpen) return null;

    const tabs = [
        { id: "files" as TabType, label: "Files", icon: FileText, count: allFiles.length },
        { id: "images" as TabType, label: "Ảnh", icon: ImageIcon, count: allImages.length },
        { id: "links" as TabType, label: "Links", icon: LinkIcon, count: allLinks.length }
    ];

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-50 bg-[var(--overlay)]"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-x-4 top-[10%] bottom-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[500px] bg-white dark:bg-slate-800 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                            Media đã chia sẻ
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                            Với {partnerName}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                    >
                        <X size={20} className="text-gray-500 dark:text-slate-400" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-slate-700">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                                    activeTab === tab.id
                                        ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                                        : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
                                }`}
                            >
                                <Icon size={16} />
                                <span>{tab.label}</span>
                                <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                                    activeTab === tab.id
                                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                        : "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400"
                                }`}>
                                    {tab.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {/* Files Tab */}
                    {activeTab === "files" && (
                        <div className="space-y-2">
                            {allFiles.length === 0 ? (
                                <div className="text-center py-12">
                                    <FileText size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-3" />
                                    <p className="text-gray-500 dark:text-slate-400">Chưa có file nào được chia sẻ</p>
                                </div>
                            ) : (
                                allFiles.map((item, index) => (
                                    <button
                                        key={`file-${index}`}
                                        onClick={() => handleFileClick(item.attachment)}
                                        disabled={isLoading}
                                        className="w-full flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-left"
                                    >
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                            <File size={20} className="text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                {item.attachment.name}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-slate-400">
                                                {formatFileSize(item.attachment.size || 0)} • {item.senderName} • {formatDate(item.timestamp)}
                                            </p>
                                        </div>
                                        {isLoading ? (
                                            <Loader2 size={18} className="animate-spin text-gray-400" />
                                        ) : (
                                            <Download size={18} className="text-gray-400" />
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    )}

                    {/* Images Tab */}
                    {activeTab === "images" && (
                        <div>
                            {allImages.length === 0 ? (
                                <div className="text-center py-12">
                                    <ImageIcon size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-3" />
                                    <p className="text-gray-500 dark:text-slate-400">Chưa có ảnh nào được chia sẻ</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-2">
                                    {allImages.map((item, index) => (
                                        <button
                                            key={`img-${index}`}
                                            onClick={() => handleFileClick(item.attachment)}
                                            disabled={isLoading}
                                            className="relative aspect-square rounded-lg overflow-hidden group"
                                        >
                                            <img
                                                src={item.attachment.thumbnail || item.attachment.url}
                                                alt={item.attachment.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.src = '/images/placeholder-image.png';
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-transparent group-hover:bg-black/20 dark:group-hover:bg-white/10 transition-colors flex items-center justify-center">
                                                <ExternalLink size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Links Tab */}
                    {activeTab === "links" && (
                        <div className="space-y-2">
                            {allLinks.length === 0 ? (
                                <div className="text-center py-12">
                                    <LinkIcon size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-3" />
                                    <p className="text-gray-500 dark:text-slate-400">Chưa có link nào được chia sẻ</p>
                                </div>
                            ) : (
                                allLinks.map((item, index) => (
                                    <button
                                        key={`link-${index}`}
                                        onClick={() => handleLinkClick(item.url)}
                                        className="w-full flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-left"
                                    >
                                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                            <LinkIcon size={20} className="text-green-600 dark:text-green-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-blue-600 dark:text-blue-400 truncate underline">
                                                {item.url}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-slate-400">
                                                {item.senderName} • {formatDate(item.timestamp)}
                                            </p>
                                        </div>
                                        <ExternalLink size={18} className="text-gray-400" />
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* File Preview Modal */}
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
