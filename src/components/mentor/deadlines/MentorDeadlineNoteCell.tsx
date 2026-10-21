'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import FeedbackChatBox from '@/components/shared/FeedbackChatBox';

type RowType = 'checklist' | 'custom';

interface MentorDeadlineNoteCellProps {
  type: RowType;
  id: string;
  studentId: string;
  mentorNote: string | null;
  studentNote: string | null;
  title: string;
  onSaved?: () => void;
}

export default function MentorDeadlineNoteCell({
  type,
  id,
  studentId,
  mentorNote,
  studentNote,
  title,
  onSaved,
}: MentorDeadlineNoteCellProps) {
  const router = useRouter();
  const url =
    type === 'custom'
      ? `/api/mentor/students/${studentId}/custom-deadlines/${id}`
      : `/api/mentor/students/${studentId}/task-progress/${id}`;

  const handleSendMessage = async (message: string) => {
    try {
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentor_note: message.trim() || null }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Đã gửi feedback');
      onSaved?.();
      router.refresh();
    } catch {
      toast.error('Không gửi được feedback');
    }
  };

  const handleUpdateMentorFeedback = async (nextRaw: string | null) => {
    try {
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mentor_note: nextRaw,
          mentor_note_mode: 'replace',
        }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Đã cập nhật feedback');
      onSaved?.();
      router.refresh();
    } catch {
      toast.error('Không cập nhật được feedback');
    }
  };

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      {title ? <p className="text-xs text-muted-foreground">{title}</p> : null}
      <FeedbackChatBox
        mentorFeedback={mentorNote}
        studentFeedback={studentNote}
        inputPlaceholder="Nhập feedback cho học viên..."
        onSendMessage={handleSendMessage}
        onUpdateMentorFeedback={handleUpdateMentorFeedback}
      />
    </div>
  );
}
