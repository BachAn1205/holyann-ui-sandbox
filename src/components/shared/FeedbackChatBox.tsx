"use client";

import { useState } from "react";
import { Check, MoreHorizontal, Pencil, Send, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type FeedbackItem = {
  id: string;
  actor: "mentor" | "student" | "unknown";
  actorLabel: string;
  timestamp: string | null;
  message: string;
  source: "mentor" | "student";
  sourceLineIndex: number;
};

interface FeedbackChatBoxProps {
  mentorFeedback?: string | null;
  studentFeedback?: string | null;
  className?: string;
  inputPlaceholder?: string;
  onSendMessage?: (message: string) => Promise<void> | void;
  onUpdateMentorFeedback?: (nextRaw: string | null) => Promise<void> | void;
  onUpdateStudentFeedback?: (nextRaw: string | null) => Promise<void> | void;
}

const ENTRY_REGEX = /^\[(.+?)\]\s*(Mentor|Học viên)\s*:\s*(.+)$/i;

function parseViTimestampToMs(value: string | null): number | null {
  if (!value) return null;
  const normalized = value.trim().replace(",", "");

  // Format A: dd/MM/yyyy HH:mm[:ss]
  const dateFirst = normalized.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/
  );
  if (dateFirst) {
    const [, dd, mm, yyyy, hh, min, sec] = dateFirst;
    const ms = new Date(
      Number(yyyy),
      Number(mm) - 1,
      Number(dd),
      Number(hh),
      Number(min),
      Number(sec ?? 0),
      0
    ).getTime();
    return Number.isNaN(ms) ? null : ms;
  }

  // Format B: HH:mm[:ss] dd/MM/yyyy (vi-VN hay trả kiểu này)
  const timeFirst = normalized.match(
    /^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?\s+(\d{1,2})\/(\d{1,2})\/(\d{4})$/
  );
  if (timeFirst) {
    const [, hh, min, sec, dd, mm, yyyy] = timeFirst;
    const ms = new Date(
      Number(yyyy),
      Number(mm) - 1,
      Number(dd),
      Number(hh),
      Number(min),
      Number(sec ?? 0),
      0
    ).getTime();
    return Number.isNaN(ms) ? null : ms;
  }

  return null;
}

function parseEntries(
  raw: string | null | undefined,
  source: "mentor" | "student"
): FeedbackItem[] {
  if (!raw) return [];
  return raw
    .split("\n")
    .map((line, idx): FeedbackItem | null => {
      const text = line.trim();
      if (!text) return null;
      const match = text.match(ENTRY_REGEX);
      if (!match) {
        // Legacy entry without timestamp: derive actor from which field it came from
        const actor: FeedbackItem["actor"] = source === "mentor" ? "mentor" : "student";
        return {
          id: `${source}-legacy-${idx}-${text.slice(0, 12)}`,
          actor,
          actorLabel: actor === "mentor" ? "Mentor" : "Học viên",
          timestamp: null,
          message: text,
          source,
          sourceLineIndex: idx,
        };
      }
      const actorRaw = match[2].toLowerCase();
      const actor: FeedbackItem["actor"] = actorRaw.includes("mentor")
        ? "mentor"
        : "student";
      return {
        id: `${source}-${actor}-${idx}-${match[1]}`,
        actor,
        actorLabel: actor === "mentor" ? "Mentor" : "Học viên",
        timestamp: match[1],
        message: match[3],
        source,
        sourceLineIndex: idx,
      };
    })
    .filter((item): item is FeedbackItem => item !== null);
}


export default function FeedbackChatBox({
  mentorFeedback,
  studentFeedback,
  className = "",
  inputPlaceholder = "Nhập phản hồi...",
  onSendMessage,
  onUpdateMentorFeedback,
  onUpdateStudentFeedback,
}: FeedbackChatBoxProps) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const mentorItems = parseEntries(mentorFeedback, "mentor");
  const studentItems = parseEntries(studentFeedback, "student");
  const items = [...mentorItems, ...studentItems].sort((a, b) => {
    const aMs = parseViTimestampToMs(a.timestamp);
    const bMs = parseViTimestampToMs(b.timestamp);

    if (aMs != null && bMs != null && aMs !== bMs) {
      return aMs - bMs; // oldest first (chat timeline)
    }
    if (aMs != null && bMs == null) return -1;
    if (aMs == null && bMs != null) return 1;

    // Same minute/legacy timestamp:
    // each source string is prepended (newest at top), so bigger index = older.
    if (a.sourceLineIndex !== b.sourceLineIndex) {
      return b.sourceLineIndex - a.sourceLineIndex;
    }
    if (a.source !== b.source) return a.source.localeCompare(b.source);
    return a.id.localeCompare(b.id);
  });

  const handleSend = async () => {
    const text = message.trim();
    if (!text || !onSendMessage || sending) return;
    setSending(true);
    try {
      await onSendMessage(text);
      setMessage("");
    } finally {
      setSending(false);
    }
  };

  const applyMessageMutation = async (
    target: FeedbackItem,
    nextMessage: string | null
  ) => {
    const sourceFeedback =
      target.source === "mentor" ? mentorFeedback : studentFeedback;
    const onUpdate =
      target.source === "mentor"
        ? onUpdateMentorFeedback
        : onUpdateStudentFeedback;
    if (!onUpdate) return;
    const lines = (sourceFeedback ?? "").split("\n");
    if (target.sourceLineIndex < 0 || target.sourceLineIndex >= lines.length) return;

    if (nextMessage == null) {
      lines.splice(target.sourceLineIndex, 1);
    } else {
      const oldLine = lines[target.sourceLineIndex] ?? "";
      const lineMatch = oldLine.match(ENTRY_REGEX);
      if (lineMatch) {
        lines[target.sourceLineIndex] = `[${lineMatch[1]}] ${lineMatch[2]}: ${nextMessage}`;
      } else {
        lines[target.sourceLineIndex] = nextMessage;
      }
    }

    const nextRaw = lines.map((line) => line.trim()).filter(Boolean).join("\n");
    await onUpdate(nextRaw || null);
  };

  return (
    <div
      className={`rounded-md border border-border/70 bg-muted/10 p-2 ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-1 px-1 text-[11px] font-medium tracking-wide text-muted-foreground">
        Trao đổi
      </div>
      {items.length === 0 ? (
        <div className="rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
          Nhập để trao đổi về nhiệm vụ
        </div>
      ) : (
        <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
          {items.map((item) => {
            const isMentor = item.actor === "mentor";
            const canManage =
              (item.source === "mentor" &&
                item.actor === "mentor" &&
                !!onUpdateMentorFeedback) ||
              (item.source === "student" &&
                item.actor === "student" &&
                !!onUpdateStudentFeedback);
            const isEditing = editingId === item.id;
            return (
              <div
                key={item.id}
                className={`flex ${isMentor ? "justify-start" : item.actor === "student" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`relative max-w-[88%] rounded-lg px-2.5 py-1.5 text-xs ${
                    isMentor
                      ? "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-200"
                      : item.actor === "student"
                        ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200"
                        : "bg-muted text-foreground"
                  }`}
                >
                  <div className="mb-0.5 flex items-center justify-between gap-2 text-[10px] font-medium opacity-80">
                    <span>
                      {item.actorLabel}
                      {item.timestamp ? ` • ${item.timestamp}` : ""}
                    </span>
                    {canManage ? (
                      <div className="opacity-100">
                        <button
                          type="button"
                          className="rounded p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
                          onClick={() =>
                            setActioningId((prev) => (prev === item.id ? null : item.id))
                          }
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : null}
                  </div>
                  {canManage && actioningId === item.id ? (
                    <div className="mb-1 flex flex-wrap justify-end gap-1">
                      <button
                        type="button"
                        className="flex items-center gap-1 rounded border border-border bg-background px-2 py-1 text-[11px] hover:bg-muted"
                        onClick={() => {
                          setEditingId(item.id);
                          setEditingText(item.message);
                          setActioningId(null);
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                        Chỉnh sửa
                      </button>
                      <button
                        type="button"
                        className="flex items-center gap-1 rounded border border-red-200 bg-red-50 px-2 py-1 text-[11px] text-red-600 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
                        onClick={async () => {
                          setActioningId(null);
                          setSavingEdit(true);
                          try {
                            await applyMessageMutation(item, null);
                          } finally {
                            setSavingEdit(false);
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                        Gỡ
                      </button>
                    </div>
                  ) : null}
                  {isEditing ? (
                    <div className="space-y-1.5">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="min-h-[70px] w-full resize-y rounded border border-input bg-background px-2 py-1.5 text-xs text-foreground"
                      />
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs"
                          onClick={() => {
                            setEditingId(null);
                            setEditingText("");
                          }}
                          disabled={savingEdit}
                        >
                          <X className="mr-1 h-3.5 w-3.5" />
                          Hủy
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          disabled={savingEdit || editingText.trim().length === 0}
                          onClick={async () => {
                            setSavingEdit(true);
                            try {
                              await applyMessageMutation(item, editingText.trim());
                              setEditingId(null);
                              setEditingText("");
                            } finally {
                              setSavingEdit(false);
                            }
                          }}
                        >
                          <Check className="mr-1 h-3.5 w-3.5" />
                          Lưu
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap break-all">{item.message}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {onSendMessage ? (
        <div className="mt-2 flex items-center gap-2 border-t border-border/60 pt-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            placeholder={inputPlaceholder}
            className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground"
          />
          <Button
            size="sm"
            className="shrink-0"
            onClick={() => void handleSend()}
            disabled={sending || message.trim().length === 0}
          >
            <Send className="mr-1 h-4 w-4" />
            Gửi
          </Button>
        </div>
      ) : null}
    </div>
  );
}
