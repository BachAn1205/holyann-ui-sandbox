"use client";

import FeedbackChatBox from "@/components/shared/FeedbackChatBox";
import type { DeadlineRow } from "./StudentDeadlinesTable";

interface DeadlineFeedbackPanelProps {
  rows: DeadlineRow[];
  onSendNote: (row: DeadlineRow, message: string) => Promise<void> | void;
}

export default function DeadlineFeedbackPanel({
  rows,
  onSendNote,
}: DeadlineFeedbackPanelProps) {
  return (
    <div className="mt-4 rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Feedback & ghi chú</h3>
        <span className="text-xs text-muted-foreground">{rows.length} nhiệm vụ</span>
      </div>

      <div className="space-y-3">
        {rows.map((row) => (
          <div key={`feedback-${row.type}-${row.id}`} className="rounded-lg border border-border/70 p-3">
            <div className="mb-2 min-w-0">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{row.title}</p>
                <p className="text-xs text-muted-foreground">
                  {row.type === "checklist" ? "Tiến độ checklist" : "Deadline tùy chỉnh"}
                </p>
              </div>
            </div>

            <FeedbackChatBox
              mentorFeedback={row.mentor_note}
              studentFeedback={row.student_note}
              inputPlaceholder="Nhập phản hồi của bạn..."
              onSendMessage={(message) => onSendNote(row, message)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

