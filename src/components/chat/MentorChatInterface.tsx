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
import CreateMeetingModal from "@/components/meetings/CreateMeetingModal";
import { sendMeetingMessage } from "@/actions/chat";

// Main Component for Mentor Interface
export const MentorChatInterface: React.FC = () => {
  const { user } = useAuthSession();
  const {
    rooms,
    loading: roomsLoading,
  } = useChatRooms(user?.id || "");
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [showMobileConversations, setShowMobileConversations] = useState(false);

  // ── Meeting modal state ──────────────────────────────────────
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);

  // Derived state for conversations list
  const conversations: Conversation[] = useMemo(() => {
    return rooms.map((room) => {
      const otherUser = room.otherUser || {
        id: "unknown",
        name: "Unknown",
        avatar: null,
        role: "student",
        email: "",
      };

      // For GROUP rooms: Use room name instead of user name
      // For PRIVATE rooms: Use student name
      const displayName = room.type === "GROUP" ? room.name : otherUser.name;

      // Map student data to Mentor interface structure
      // This is a workaround to reuse existing components that expect 'Mentor' type
      const studentAsMentor: Mentor = {
        id: otherUser.id,
        name: displayName, // Use room name for GROUP, student name for PRIVATE
        avatar: otherUser.avatar ?? null,
        roleCode: room.type === "GROUP" ? "GROUP" : "STUDENT",
        roleTitle: room.type === "GROUP" ? "Nhóm" : "Học viên",
        isOnline: false, // Need realtime presence for this
        lastSeen: "1 phút trước",
        description: "email" in otherUser ? otherUser.email : "", // Passing email via description field
        achievements: [], // Not used for students
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
        mentor: studentAsMentor, // Property name is 'mentor' but holds student data
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

  // Student pre-fill: for PRIVATE rooms, use the partner's user id
  const prefilledStudentId =
    selectedConversation?.mentor.roleCode === "STUDENT"
      ? selectedConversation.mentor.id
      : undefined;

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
    () => mapRawChatMessagesToUi(rawMessages, { stripMeetingHostLink: false }),
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

  // ── Meeting created callback ─────────────────────────────────
  const handleMeetingCreated = async (result: {
    meetingId?: string;
    title?: string;
    startTime?: string;
    endTime?: string;
    meetLink?: string | null;
    hostMeetLink?: string | null;
    studentId?: string;
  }) => {
    setMeetingModalOpen(false);

    if (!selectedRoomId || !user?.id) return;
    if (!result.meetingId || !result.title || !result.startTime || !result.endTime) return;

    // Send meeting bubble into current chat room
    const res = await sendMeetingMessage(selectedRoomId, user.id, {
      meetingId: result.meetingId,
      title: result.title,
      startTime: result.startTime,
      endTime: result.endTime,
      meetLink: result.meetLink ?? null,
      hostMeetLink: result.hostMeetLink ?? null,
    });

    if (res.success) {
      refreshMessages();
      if (res.message?.id) {
        await broadcastRoomMessage(res.message.id);
      }
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop =
            messagesContainerRef.current.scrollHeight;
        }
      }, 100);
    } else {
      toast.error("Không thể gửi thông báo lịch hẹn vào chat");
    }
  };

  useBodyScrollLock();

  // Loading state
  if (!user) return null;

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
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

      {/* Mobile Overlay */}
      {showMobileConversations && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setShowMobileConversations(false)}
        />
      )}

      {/* ========== FLEX ROW: Chat area + Info panel (same row, no absolute) ========== */}
      <div className="flex-1 flex min-h-0 min-w-0">
        {/* Chat container: flex column, header fixed, messages scroll, input fixed */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col border-x border-border bg-card">
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
                isMentor={true}
                onCreateMeeting={() => setMeetingModalOpen(true)}
              />
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-muted-foreground">
              <p className="text-sm font-medium">
                Chọn một cuộc hội thoại để bắt đầu
              </p>
              <div className="relative h-32 w-48 overflow-hidden rounded-xl border border-border bg-background/40 shadow-sm">
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
            partnerRole="student"
            roomId={selectedConversation.id}
          />
        )}
      </div>

      {/* ========== Create Meeting Modal ========== */}
      {user?.email && (
        <CreateMeetingModal
          open={meetingModalOpen}
          onOpenChange={setMeetingModalOpen}
          mentorEmail={user.email}
          prefilledStudentId={prefilledStudentId}
          onMeetingCreated={handleMeetingCreated}
        />
      )}
    </div>
  );
};

