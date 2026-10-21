"use client";

import React, { useRef, useState, useMemo } from "react";
import { X, Headset, Minimize2 } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { useAuthSession } from "@/hooks/useAuthSession";
import { MessagesList } from "@/components/chat/MessagesList";
import { MessageInput } from "@/components/chat/MessageInput";
import { mapRawChatMessagesToUi } from "@/components/chat/utils";

interface SupportChatWindowProps {
  roomId: string;
  onClose: () => void;
}

export function SupportChatWindow({ roomId, onClose }: SupportChatWindowProps) {
  const { user } = useAuthSession();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [messageInput, setMessageInput] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);

  const {
    messages: rawMessages,
    sendMessage,
    broadcastRoomMessage,
    loading,
    refreshMessages,
    otherParticipantLastReadAt,
    markAsRead,
  } = useChat({
    roomId,
    userId: user?.id || "",
    playSound: true,
  });

  const messages = useMemo(
    () => mapRawChatMessagesToUi(rawMessages, { 
      stripMeetingHostLink: true, 
      otherParticipantLastReadAt 
    }),
    [rawMessages, otherParticipantLastReadAt]
  );

  // Mark as read when opening the chat
  React.useEffect(() => {
    markAsRead();
  }, [markAsRead]);

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    const content = messageInput;
    setMessageInput("");
    try {
      await sendMessage(content, "TEXT");
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop =
            messagesContainerRef.current.scrollHeight;
        }
      }, 50);
    } catch {
      setMessageInput(content);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAttachmentSent = (messageId?: string) => {
    refreshMessages();
    if (messageId) broadcastRoomMessage(messageId);
  };

  return (
    <div
      className="
        fixed bottom-24 right-6 z-[60]
        w-[360px] rounded-2xl shadow-2xl border border-border
        bg-background/95 backdrop-blur-md
        flex flex-col overflow-hidden
        animate-in slide-in-from-bottom-4 fade-in-0 duration-300
      "
      style={{ maxHeight: isMinimized ? "56px" : "520px", transition: "max-height 0.3s ease" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Headset className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">Admin Support</p>
            <p className="text-blue-100 text-xs mt-0.5">Hỗ trợ trực tuyến</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized((v) => !v)}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white"
            title={isMinimized ? "Mở rộng" : "Thu nhỏ"}
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chat body — hidden when minimized */}
      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <MessagesList
              messages={messages}
              messagesEndRef={messagesEndRef}
              messagesContainerRef={messagesContainerRef}
              conversationId={roomId}
              loading={loading}
            />
          </div>

          {/* Input */}
          <div className="flex-shrink-0">
            <MessageInput
              roomId={roomId}
              userId={user?.id || ""}
              messageInput={messageInput}
              onInputChange={setMessageInput}
              onSendMessage={handleSendMessage}
              onKeyPress={handleKeyPress}
              onMessageSent={handleAttachmentSent}
              hideAttachments={true}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default SupportChatWindow;
