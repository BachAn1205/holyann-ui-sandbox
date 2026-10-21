'use client';

import MentorDeadlineNoteCell from '@/components/mentor/deadlines/MentorDeadlineNoteCell';

type RowType = 'checklist' | 'custom';

interface MentorFeedbackRow {
  type: RowType;
  id: string;
  taskTitle: string;
  mentor_note: string | null;
  student_note: string | null;
}

interface MentorDeadlineFeedbackPanelProps {
  rows: MentorFeedbackRow[];
  studentId: string;
  onSaved?: () => void;
}

export default function MentorDeadlineFeedbackPanel({
  rows,
  studentId,
  onSaved,
}: MentorDeadlineFeedbackPanelProps) {
  return (
    <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Feedback</h3>
        <span className="text-xs text-gray-500">{rows.length} nhiệm vụ</span>
      </div>

      <div className="space-y-3">
        {rows.map((item) => (
          <div key={`mentor-feedback-${item.type}-${item.id}`} className="rounded-lg border border-gray-200 p-3">
            <MentorDeadlineNoteCell
              type={item.type}
              id={item.id}
              studentId={studentId}
              mentorNote={item.mentor_note}
              studentNote={item.student_note}
              title={item.taskTitle}
              onSaved={onSaved}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

