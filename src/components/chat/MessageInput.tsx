"use client";

import React, { useRef, useState } from "react";
import { Send, Paperclip, Image, Smile, Loader2, X, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { uploadFileServerAction } from "@/actions/upload";
import { sendMessageWithAttachment, getMessageTypeFromMime } from "@/actions/chat";

interface MessageInputProps {
    roomId: string;
    userId: string;
    messageInput: string;
    onInputChange: (value: string) => void;
    onSendMessage: () => void;
    onKeyPress: (e: React.KeyboardEvent) => void;
    onMessageSent?: (messageId?: string) => void; // Callback after successful send
    onCreateMeeting?: () => void; // Mentor-only: open meeting creation modal
    isMentor?: boolean;           // Show calendar button only for mentors
    hideAttachments?: boolean;    // Hide attachment and image buttons
}

export const MessageInput: React.FC<MessageInputProps> = ({
    roomId,
    userId,
    messageInput,
    onInputChange,
    onSendMessage,
    onKeyPress,
    onMessageSent,
    onCreateMeeting,
    isMentor = false,
    hideAttachments = false,
}) => {
    // File input refs
    const imageInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Upload state
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Handle file selection and upload
    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, fileType: 'image' | 'file') => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            toast.error('File quá lớn! Kích thước tối đa là 10MB.');
            return;
        }

        // Validate image type if image upload
        if (fileType === 'image' && !file.type.startsWith('image/')) {
            toast.error('Vui lòng chỉ chọn file ảnh!');
            return;
        }

        setSelectedFile(file);
        setIsUploading(true);
        setUploadProgress(0);

        try {
            // Step 1: Upload file to Supabase Storage
            toast.loading('Đang tải lên...', { id: 'upload' });

            const formData = new FormData();
            formData.append('file', file);
            formData.append('userId', userId);
            formData.append('category', 'chat'); // Chat category for storage

            const uploadResult = await uploadFileServerAction(formData);

            if (!uploadResult.success || !uploadResult.url) {
                throw new Error(uploadResult.error || 'Upload failed');
            }

            setUploadProgress(50);

            // Step 2: Send message with attachment
            const messageType = await getMessageTypeFromMime(file.type);
            const content = messageInput.trim() || ""; // Don't use filename as content

            const result = await sendMessageWithAttachment(
                roomId,
                userId,
                content,
                messageType,
                {
                    url: uploadResult.url,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                }
            );

            if (!result.success) {
                throw new Error(result.error || 'Failed to send message');
            }

            setUploadProgress(100);
            toast.success('Đã gửi!', { id: 'upload' });

            // Clear input and state
            onInputChange('');
            setSelectedFile(null);

            // Trigger callback to refresh messages
            if (onMessageSent) {
                onMessageSent(result.message?.id);
            }

        } catch (error) {
            console.error('❌ Upload/send error:', error);
            toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra!', { id: 'upload' });
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
            setSelectedFile(null);

            // Reset file input
            if (event.target) {
                event.target.value = '';
            }
        }
    };

    // Cancel upload
    const handleCancelUpload = () => {
        setIsUploading(false);
        setSelectedFile(null);
        setUploadProgress(0);
        if (imageInputRef.current) imageInputRef.current.value = '';
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="p-3 md:p-4 border-t border-border bg-card flex-shrink-0">
            {isUploading && (
                <div className="mb-3 p-3 bg-primary/10 rounded-xl border border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Loader2 size={16} className="animate-spin text-primary" />
                            <span className="text-sm font-medium text-foreground">
                                {selectedFile?.type?.startsWith('image/') ? 'Đang tải lên ảnh...' : `Đang tải lên: ${selectedFile?.name}`}
                            </span>
                        </div>
                        <button
                            onClick={handleCancelUpload}
                            className="p-1 hover:bg-primary/20 rounded transition-colors text-primary"
                        >
                            <X size={16} />
                        </button>
                    </div>
                    <div className="w-full h-2 bg-primary/20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                </div>
            )}

            <div className="flex items-end gap-2 md:gap-3">
                <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, 'image')}
                    disabled={isUploading}
                />
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, 'file')}
                    disabled={isUploading}
                />

                <div className="flex items-center gap-0.5 md:gap-1">
                    {!hideAttachments && (
                        <>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className={`p-2 md:p-2.5 rounded-full transition-colors ${
                            isUploading
                                ? 'text-muted-foreground/50 cursor-not-allowed'
                                : 'hover:bg-muted text-muted-foreground hover:text-primary'
                        }`}
                        title="Đính kèm file"
                    >
                        <Paperclip size={18} className="md:w-5 md:h-5" />
                    </button>
                    <button
                        onClick={() => imageInputRef.current?.click()}
                        disabled={isUploading}
                        className={`p-2 md:p-2.5 rounded-full transition-colors ${
                            isUploading
                                ? 'text-muted-foreground/50 cursor-not-allowed'
                                : 'hover:bg-muted text-muted-foreground hover:text-primary'
                        }`}
                        title="Đính kèm ảnh"
                    >
                        <Image size={18} className="md:w-5 md:h-5" />
                    </button>
                        </>
                    )}

                    {/* Calendar button — mentor only */}
                    {isMentor && onCreateMeeting && (
                        <button
                            type="button"
                            onClick={onCreateMeeting}
                            disabled={isUploading}
                            className={`p-2 md:p-2.5 rounded-full transition-colors ${
                                isUploading
                                    ? 'text-muted-foreground/50 cursor-not-allowed'
                                    : 'hover:bg-blue-50 text-muted-foreground hover:text-blue-600'
                            }`}
                            title="Tạo lịch tư vấn"
                        >
                            <CalendarClock size={18} className="md:w-5 md:h-5" />
                        </button>
                    )}
                </div>

                <div className="flex-1 relative">
                    <textarea
                        value={messageInput}
                        onChange={(e) => onInputChange(e.target.value)}
                        onKeyPress={onKeyPress}
                        placeholder="Nhập tin nhắn..."
                        rows={1}
                        disabled={isUploading}
                        className={`w-full px-3 md:px-4 py-2 md:py-3 bg-muted/80 rounded-xl md:rounded-2xl border border-border focus:ring-2 focus:ring-primary/50 focus:bg-background resize-none text-sm transition-all text-foreground placeholder:text-muted-foreground ${
                            isUploading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        style={{ minHeight: "44px", maxHeight: "120px" }}
                    />
                    <button
                        className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 p-1 md:p-1.5 hover:bg-muted rounded-full transition-colors text-muted-foreground hidden sm:block"
                        disabled={isUploading}
                    >
                        <Smile size={18} className="md:w-5 md:h-5" />
                    </button>
                </div>

                <button
                    onClick={onSendMessage}
                    disabled={!messageInput.trim() || isUploading}
                    className={`p-2.5 md:p-3 rounded-full transition-all shrink-0 ${
                        messageInput.trim() && !isUploading
                            ? "bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:scale-105"
                            : "bg-muted text-muted-foreground cursor-not-allowed"
                    }`}
                    title="Gửi tin nhắn"
                >
                    {isUploading ? (
                        <Loader2 size={18} className="md:w-5 md:h-5 animate-spin" />
                    ) : (
                        <Send size={18} className="md:w-5 md:h-5" />
                    )}
                </button>
            </div>
        </div>
    );
};
