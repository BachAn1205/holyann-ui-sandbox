"use client";

import React, { useMemo, memo } from "react";
import { MessageCircle, Search, X } from "lucide-react";
import { Conversation } from "./types";
import { getRoleIcon, getRoleColor, formatTime } from "./utils";
import { UserAvatar } from "./UserAvatar";
import { ConversationListSkeleton } from "./DiscussionCardSkeleton";

const ConversationCard = memo(function ConversationCard({
  conv,
  isSelected,
  onSelect,
}: {
  conv: Conversation;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const ConvIcon = getRoleIcon(conv.mentor.roleCode);
  const convColors = getRoleColor(conv.mentor.roleCode);
  return (
    <div
      onClick={onSelect}
      className={`p-3 md:p-4 cursor-pointer border-b border-border hover:bg-muted/30 transition-colors ${
        isSelected ? "bg-primary/10 border-l-4 border-l-primary" : ""
      }`}
    >
      <div className="flex items-start gap-2 md:gap-3">
        <UserAvatar
          avatarUrl={conv.mentor.avatar}
          name={conv.mentor.name}
          size="md"
          showOnlineIndicator={false}
          isOnline={conv.mentor.isOnline}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <h3
              className={`text-sm font-semibold truncate ${
                isSelected ? "text-primary" : "text-foreground"
              }`}
            >
              {conv.mentor.name}
            </h3>
            <span className="text-[11px] text-muted-foreground shrink-0">
              {formatTime(conv.lastMessageTime)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${convColors.bg} ${convColors.text}`}
            >
              <ConvIcon size={10} />
              {conv.mentor.roleCode}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground truncate min-w-0">
              {conv.lastMessage}
            </p>
            {conv.unreadCount > 0 && (
              <span className="shrink-0 min-w-[1.25rem] h-5 px-1.5 bg-primary text-primary-foreground text-[11px] rounded-full flex items-center justify-center font-semibold">
                {conv.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId: string;
  searchQuery: string;
  onSelectConversation: (conversation: Conversation) => void;
  onSearchChange: (query: string) => void;
  showMobile?: boolean;
  onCloseMobile?: () => void;
  loading?: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversationId,
  searchQuery,
  onSelectConversation,
  onSearchChange,
  showMobile = false,
  onCloseMobile,
  loading = false,
}) => {
  const filteredConversations = useMemo(
    () =>
      conversations.filter(
        (conv) =>
          conv.mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          conv.mentor.roleTitle
            .toLowerCase()
            .includes(searchQuery.toLowerCase()),
      ),
    [conversations, searchQuery],
  );
  return (
    <div
      className={`w-full md:w-80 bg-card border-r border-border flex flex-col fixed md:relative inset-y-0 left-0 z-50 md:z-auto transform transition-transform duration-300 ease-in-out ${
        showMobile ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0`}
    >
      {/* Header – gradient giống dashboard */}
      <div className="p-3 md:p-4 border-b border-border bg-gradient-to-r from-primary/10 via-indigo-500/5 to-transparent">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <h2 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary shrink-0">
              <MessageCircle className="size-5" aria-hidden />
            </span>
            <span className="hidden sm:inline">Trao Đổi</span>
            <span className="sm:hidden">Chat</span>
          </h2>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground md:hidden"
            >
              <X size={20} />
            </button>
          )}
        </div>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={16}
          />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2 md:py-2.5 bg-muted/80 rounded-lg md:rounded-xl border border-border focus:ring-2 focus:ring-primary/50 focus:bg-background transition-all text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <ConversationListSkeleton count={5} />
        ) : (
          filteredConversations.map((conv) => (
            <ConversationCard
              key={conv.id}
              conv={conv}
              isSelected={selectedConversationId === conv.id}
              onSelect={() => onSelectConversation(conv)}
            />
          ))
        )}
      </div>
    </div>
  );
};
