"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { Message } from "./types";
import { MessageBubble } from "./MessageBubble";
import { MessagesListSkeleton } from "./MessageSkeleton";
import { formatDateLabel } from "./utils";

interface MessagesListProps {
    messages: Message[];
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    messagesContainerRef: React.RefObject<HTMLDivElement | null>;
    conversationId?: string;
    loading?: boolean;
    onDeleteMessage?: (messageId: string) => Promise<void>;
    onDeleteAttachment?: (messageId: string, attachmentId: string) => Promise<void>;
}

export const MessagesList: React.FC<MessagesListProps> = ({
                                                              messages,
                                                              messagesEndRef,
                                                              messagesContainerRef,
                                                              conversationId,
                                                              loading = false,
                                                              onDeleteMessage,
                                                              onDeleteAttachment,
                                                          }) => {
    const [hasInitialScrolled, setHasInitialScrolled] = useState(false);

    // Reset initial scroll state when conversation changes
    useEffect(() => {
        setHasInitialScrolled(false);
    }, [conversationId]);

    // Handle auto-scroll
    useEffect(() => {
        const container = messagesContainerRef.current;
        const endRef = messagesEndRef.current;

        if (!container || !endRef) return;

        // 1. Initial load scroll (when messages are first loaded for a conversation)
        // We check !hasInitialScrolled to ensure we only force-scroll once per conversation load
        if (!hasInitialScrolled && messages.length > 0) {
            // Use requestAnimationFrame to ensure DOM is updated
            requestAnimationFrame(() => {
                container.scrollTop = container.scrollHeight;
                setHasInitialScrolled(true);
            });
            return;
        }

        // 2. New message scroll (only if user is already near bottom)
        if (hasInitialScrolled) {
            const isNearBottom =
                container.scrollHeight - container.scrollTop - container.clientHeight < 200;

            if (isNearBottom) {
                // Smooth scroll for new messages
                setTimeout(() => {
                    endRef.scrollIntoView({ behavior: "smooth" });
                }, 100);
            }
        }
    }, [messages, conversationId, hasInitialScrolled, messagesContainerRef, messagesEndRef]);

    // Group messages by date and build render list (date separators + messages)
    const items = useMemo(() => {
        const list: Array<{ type: "date"; label: string } | { type: "message"; message: Message }> = [];
        let lastDateKey = "";
        for (const msg of messages) {
            const d = new Date(msg.timestamp);
            const dateKey = format(d, "yyyy-MM-dd");
            if (dateKey !== lastDateKey) {
                list.push({ type: "date", label: formatDateLabel(msg.timestamp) });
                lastDateKey = dateKey;
            }
            list.push({ type: "message", message: msg });
        }
        return list;
    }, [messages]);

    if (loading) {
        return (
            <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto bg-gradient-to-b from-muted/30 to-background min-h-0"
            >
                <div className="flex items-center justify-center pt-3">
                    <div className="px-3 md:px-4 py-1 md:py-1.5 bg-muted rounded-full text-xs text-muted-foreground font-medium">
                        Hôm nay
                    </div>
                </div>
                <MessagesListSkeleton count={4} />
            </div>
        );
    }

    return (
        <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-3 md:p-6 space-y-3 md:space-y-4 bg-gradient-to-b from-muted/30 to-background min-h-0"
        >
            {items.length === 0 ? (
                <div className="flex items-center justify-center">
                    <div className="px-3 md:px-4 py-1 md:py-1.5 bg-muted rounded-full text-xs text-muted-foreground font-medium">
                        Hôm nay
                    </div>
                </div>
            ) : (
                items.map((item, i) =>
                    item.type === "date" ? (
                        <div key={`date-${i}`} className="flex items-center justify-center">
                            <div className="px-3 md:px-4 py-1 md:py-1.5 bg-muted rounded-full text-xs text-muted-foreground font-medium">
                                {item.label}
                            </div>
                        </div>
                    ) : (
                        <MessageBubble
                            key={item.message.id}
                            message={item.message}
                            onDeleteMessage={onDeleteMessage}
                            onDeleteAttachment={onDeleteAttachment}
                        />
                    )
                )
            )}
            <div ref={messagesEndRef} />
        </div>
    );
};