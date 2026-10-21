'use client';

import MentorDeadlineNoteCell from '@/components/mentor/deadlines/MentorDeadlineNoteCell';

type RowType = 'checklist' | 'custom';

interface FeedbackRow {
  type: RowType;
  id: string;
  student_id: string;
  studentName: string;
  taskTitle: string;
  mentor_note: string | null;
  student_note: string | null;
}

interface MentorGlobalFeedbackPanelProps {
  rows: FeedbackRow[];
}

export default function MentorGlobalFeedbackPanel({ rows }: MentorGlobalFeedbackPanelProps) {
  return (
    <div className="mt-4 rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Feedback chat</h3>
        <span className="text-xs text-muted-foreground">{rows.length} nhiệm vụ</span>
      </div>

      <div className="space-y-3">
        {rows.map((item) => (
          <div key={`global-feedback-${item.type}-${item.id}`} className="rounded-lg border border-border p-3">
            <div className="mb-2">
              <p className="text-sm font-medium text-foreground">{item.taskTitle}</p>
              <p className="text-xs text-muted-foreground">{item.studentName}</p>
            </div>
            <MentorDeadlineNoteCell
              type={item.type}
              id={item.id}
              studentId={item.student_id}
              mentorNote={item.mentor_note}
              studentNote={item.student_note}
              title={item.taskTitle}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

