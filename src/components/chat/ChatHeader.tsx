'use client';

import { ArrowLeft, Info } from 'lucide-react';
import type { Mentor } from './types';
import { UserAvatar } from './UserAvatar';

interface ChatHeaderProps {
  roomName?: string;
  roomType?: string;
  avatar?: string | null;
  isOnline?: boolean;
  mentor?: Mentor;
  onBack?: () => void;
  onToggleSidebar?: () => void;
  onToggleMobileInfo?: () => void;
  onToggleMobileConversations?: () => void;
  onToggleInfoPanel?: () => void;
}

export default function ChatHeader({
  roomName,
  roomType,
  avatar,
  isOnline = false,
  mentor,
  onBack,
  onToggleSidebar,
  onToggleMobileInfo,
  onToggleMobileConversations,
  onToggleInfoPanel,
}: ChatHeaderProps) {
  // Determine display data
  // For GROUP rooms: Always show room name
  // For PRIVATE rooms: Show mentor name if available, otherwise room name
  const displayName = (roomType === 'GROUP' ? roomName : (mentor?.name || roomName)) || 'Unknown';
  const displayAvatar = mentor?.avatar || avatar;
  const displayIsOnline = mentor?.isOnline ?? isOnline;

  return (
    <div className="h-16 bg-card border-b border-border flex items-center justify-between px-4 flex-shrink-0">
      <div className="flex items-center gap-3">
        {(onBack || onToggleMobileConversations) && (
          <button
            onClick={onBack || onToggleMobileConversations}
            className="lg:hidden p-2 hover:bg-muted rounded-full transition-colors text-foreground"
            aria-label="Quay lại"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="relative shrink-0">
          <UserAvatar
            avatarUrl={displayAvatar}
            name={displayName}
            size="header"
            showOnlineIndicator={false}
            isOnline={displayIsOnline}
          />
        </div>
        <div>
          <h3 className="font-semibold text-foreground text-sm">
            {displayName}
          </h3>
          {mentor?.roleTitle && (
            <p className="text-xs text-muted-foreground">
              {mentor.roleTitle}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {onToggleInfoPanel && (
          <button
            onClick={onToggleInfoPanel}
            className="p-2 hover:bg-muted rounded-full transition-colors text-primary"
            aria-label="Thông tin"
          >
            <Info className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
