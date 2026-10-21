"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";

/** Lock body scroll when Discussion page is mounted - prevents double scrollbar */
function useBodyScrollLock() {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
}
import { toast } from "sonner";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useChatRooms } from "@/hooks/useChatRooms";
import { useChat } from "@/hooks/useChat";
import { Conversation, Mentor } from "./types";
import { mapRawChatMessagesToUi } from "./utils";
import { ConversationList } from "./ConversationList";
import ChatHeader from "./ChatHeader";
import { MessagesList } from "./MessagesList";
import { MessageInput } from "./MessageInput";
import { DiscussionInfoPanel } from "./info-panel/DiscussionInfoPanel";
import UpcomingMeetingBanner from "./UpcomingMeetingBanner";

// Main Component
export const ChatPage: React.FC = () => {
  const { user } = useAuthSession();
  const {
    rooms,
    loading: roomsLoading,
  } = useChatRooms(user?.id || "");
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [showMobileConversations, setShowMobileConversations] = useState(false);

  // Derived state for conversations list
  const conversations: Conversation[] = useMemo(() => {
    return rooms.map((room) => {
      const otherUser = room.otherUser || {
        id: "unknown",
        name: "Unknown",
        avatar: null,
        role: "mentor",
      };

      // For GROUP rooms: Use room name instead of user name
      // For PRIVATE rooms: Use mentor name
      const displayName = room.type === "GROUP" ? room.name : otherUser.name;

      // Mock mentor details if missing from API
      const mentor: Mentor = {
        id: otherUser.id,
        name: displayName, // Use room name for GROUP, mentor name for PRIVATE
        avatar: otherUser.avatar ?? null,
        roleCode: room.type === "GROUP" ? "GROUP" : room.mentorType || "AS", // Default or derive from room.mentorType if available
        roleTitle: room.type === "GROUP" ? "Nhóm Cố vấn" : "Cố vấn",
        isOnline: false, // Need realtime presence for this
        lastSeen: "1 phút trước",
        description:
          room.type === "GROUP" ? "Nhóm hỗ trợ đầy đủ" : "Chuyên gia tư vấn...",
        achievements:
          room.type === "GROUP" ? [] : ["5 năm kinh nghiệm", "Cố vấn xuất sắc"],
      };

      let lastMessageContent = room.lastMessage?.content || "Chưa có tin nhắn";
      if (lastMessageContent.startsWith("__MEETING__")) {
        try {
          const parsed = JSON.parse(lastMessageContent.replace("__MEETING__", ""));
          lastMessageContent = `📅 Cuộc họp: ${parsed.title}`;
        } catch {
          lastMessageContent = "📅 Lịch tư vấn mới";
        }
      }

      return {
        id: room.id,
        mentor,
        messages: [], // Message list is fetched separately
        lastMessage: lastMessageContent,
        lastMessageTime: room.lastMessage
          ? new Date(room.lastMessage.createdAt)
          : new Date(room.createdAt),
        unreadCount: room.unreadCount,
      };
    });
  }, [rooms]);

  // Select first room by default
  useEffect(() => {
    if (!selectedRoomId && conversations.length > 0) {
      setSelectedRoomId(conversations[0].id);
    }
  }, [conversations, selectedRoomId]);

  const selectedConversation = conversations.find(
    (c) => c.id === selectedRoomId,
  );

  // Fetch messages for selected room
  const {
    messages: rawMessages,
    sendMessage,
    broadcastRoomMessage,
    loading: messagesLoading,
    refreshMessages,
  } = useChat({
    roomId: selectedRoomId || "",
    userId: user?.id || "",
    playSound: true,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const messages = useMemo(
    () => mapRawChatMessagesToUi(rawMessages, { stripMeetingHostLink: true }),
    [rawMessages],
  );

  const [messageInput, setMessageInput] = useState("");

  const handleSendMessage = async () => {
    if (!messageInput.trim()) {
      return;
    }

    const content = messageInput;
    setMessageInput(""); // Clear immediately

    try {
      await sendMessage(content, "TEXT");

      // Force scroll to bottom
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop =
            messagesContainerRef.current.scrollHeight;
        }
      }, 50);
    } catch (error) {
      toast.error("Gửi tin nhắn thất bại");
      console.error("Error sending message:", error);
      setMessageInput(content); // Restore content on error
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedRoomId(conversation.id);
    setShowMobileConversations(false);
  };

  const handleAttachmentMessageSent = (messageId?: string) => {
    refreshMessages();
    if (messageId) {
      broadcastRoomMessage(messageId);
    }
  };

  useBodyScrollLock();

  // Loading state
  if (!user) return null;

  return (
    <div className="h-full w-full flex overflow-hidden bg-background">
      {/* ========== LEFT SIDEBAR - Conversation List ========== */}
      <ConversationList
        conversations={conversations}
        selectedConversationId={selectedRoomId || ""}
        searchQuery={searchQuery}
        onSelectConversation={handleSelectConversation}
        onSearchChange={setSearchQuery}
        showMobile={showMobileConversations}
        onCloseMobile={() => setShowMobileConversations(false)}
        loading={roomsLoading}
      />

      {showMobileConversations && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setShowMobileConversations(false)}
        />
      )}

      {/* ========== FLEX ROW: Chat area + Info panel (same row, no absolute) ========== */}
      <div className="flex-1 flex min-h-0 min-w-0">
        {/* Chat container: flex column, header fixed, messages scroll, input fixed */}
        <div className="flex-1 flex flex-col min-w-0 bg-card border-x border-border">
          {selectedConversation ? (
            <>
              <ChatHeader
                mentor={selectedConversation.mentor}
                roomName={rooms.find((r) => r.id === selectedRoomId)?.name}
                roomType={rooms.find((r) => r.id === selectedRoomId)?.type}
                onToggleInfoPanel={() => setShowInfoPanel((p) => !p)}
                onToggleMobileConversations={() =>
                  setShowMobileConversations(!showMobileConversations)
                }
              />

              <UpcomingMeetingBanner
                partnerId={selectedConversation.mentor.id}
                currentUserId={user?.id || ""}
              />

              <MessagesList
                messages={messages}
                messagesEndRef={messagesEndRef}
                messagesContainerRef={messagesContainerRef}
                conversationId={selectedConversation.id}
                loading={messagesLoading}
              />

              <MessageInput
                roomId={selectedRoomId || ""}
                userId={user?.id || ""}
                messageInput={messageInput}
                onInputChange={setMessageInput}
                onSendMessage={handleSendMessage}
                onKeyPress={handleKeyPress}
                onMessageSent={handleAttachmentMessageSent}
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-muted-foreground">
              <p className="text-sm font-medium">
                Chọn một cuộc hội thoại để bắt đầu
              </p>
              <div className="relative w-48 h-32 rounded-xl overflow-hidden border border-border shadow-sm bg-background/40">
                <Image
                  src="/holy/3.png"
                  alt="Holy đang chờ bạn bắt đầu cuộc trò chuyện"
                  fill
                  className="object-contain"
                  sizes="192px"
                />
                <div className="absolute inset-0 bg-linear-to-t from-background/60 to-transparent" />
              </div>
            </div>
          )}
        </div>

        {/* Info Panel - flex sibling, same row, not fixed */}
        {selectedConversation && (
          <DiscussionInfoPanel
            isOpen={showInfoPanel}
            onClose={() => setShowInfoPanel(false)}
            partner={selectedConversation.mentor}
            partnerRole="teacher"
            roomId={selectedConversation.id}
          />
        )}
      </div>
    </div>
  );
};

export default ChatPage;
