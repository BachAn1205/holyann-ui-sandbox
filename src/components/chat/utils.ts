import { Target, PenTool, Lightbulb, User, GraduationCap } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { vi } from "date-fns/locale";
import type { MeetingMessageData, Message } from "./types";

const MEETING_PREFIX = "__MEETING__";

/** Shape returned by `useChat` message list — kept loose to match the hook without importing it here */
export type RawChatMessageForUi = {
  id: string;
  content: string | null;
  type: string;
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
  sender: { id: string; name: string; avatar: string | null; role: string };
  isFromMe: boolean;
  isPending?: boolean;
  error?: boolean;
  attachments?: Array<{
    id: string;
    url: string;
    name: string;
    type: string;
    size: number | null;
    thumbnail: string | null;
  }>;
};

export function mapRawChatMessagesToUi(
  rawMessages: RawChatMessageForUi[],
  options?: { stripMeetingHostLink?: boolean; otherParticipantLastReadAt?: Date | null },
): Message[] {
  const stripHost = options?.stripMeetingHostLink ?? false;
  const otherLastReadAt = options?.otherParticipantLastReadAt;
  return rawMessages.map((msg) => {
    const isMeetingContent =
      typeof msg.content === "string" && msg.content.startsWith(MEETING_PREFIX);

    let meetingData: MeetingMessageData | undefined;
    if (isMeetingContent && msg.content) {
      try {
        const parsed = JSON.parse(
          msg.content.replace(MEETING_PREFIX, ""),
        ) as MeetingMessageData;
        meetingData = stripHost ? { ...parsed, hostMeetLink: null } : parsed;
      } catch {
        // ignore parse errors
      }
    }

    return {
      id: msg.id,
      senderId: msg.sender.id,
      senderName: msg.sender.name,
      senderAvatar: msg.sender.avatar ?? null,
      content: msg.content,
      type: isMeetingContent
        ? ("MEETING" as const)
        : (msg.type as "TEXT" | "IMAGE" | "FILE" | "LINK" | undefined),
      meetingData,
      timestamp: new Date(msg.createdAt),
      isRead: otherLastReadAt ? new Date(msg.createdAt) <= otherLastReadAt : false,
      isMine: msg.isFromMe,
      isSending: msg.isPending,
      isError: msg.error,
      attachments:
        msg.attachments?.map((att) => ({
          id: att.id,
          url: att.url,
          name: att.name,
          type: att.type,
          size: att.size,
          thumbnail: att.thumbnail,
        })) || [],
    };
  });
}

export const getRoleIcon = (roleCode: string) => {
  switch (roleCode) {
    case "AS":
      return Target;
    case "ACS":
      return PenTool;
    case "ARD":
      return Lightbulb;
    case "STUDENT":
      return GraduationCap;
    case "GROUP":
      return User;
    default:
      return User;
  }
};

export const getRoleColor = (roleCode: string) => {
  switch (roleCode) {
    case "AS":
      return { bg: "bg-primary/15", text: "text-primary" };
    case "ACS":
      return { bg: "bg-violet-100 dark:bg-violet-900/30", text: "text-violet-700 dark:text-violet-300" };
    case "ARD":
      return { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300" };
    case "STUDENT":
      return { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300" };
    case "GROUP":
      return { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-300" };
    default:
      return { bg: "bg-muted", text: "text-muted-foreground" };
  }
};

export const formatTime = (date: Date | string) => {
  const d = new Date(date);
  if (isToday(d)) {
    return format(d, "HH:mm");
  }
  if (isYesterday(d)) {
    return "Hôm qua";
  }
  return format(d, "dd/MM");
};

export const formatMessageTime = (date: Date | string) => {
  return format(new Date(date), "HH:mm");
};

/** Label for date separator in chat: "Hôm nay" | "Hôm qua" | "dd/MM/yyyy" */
export const formatDateLabel = (date: Date | string) => {
  const d = new Date(date);
  if (isToday(d)) return "Hôm nay";
  if (isYesterday(d)) return "Hôm qua";
  return format(d, "dd/MM/yyyy", { locale: vi });
};
