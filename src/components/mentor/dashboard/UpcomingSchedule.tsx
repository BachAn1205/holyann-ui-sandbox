'use client';

import { useState, useMemo } from 'react';
import { Calendar, Clock, Plus, Video, ExternalLink, Copy, Check } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';
import CreateMeetingModal from '@/components/meetings/CreateMeetingModal';
import { getAllMentorMeetings } from '@/actions/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  student_email: string;
  start_time: Date;
  end_time: Date;
  duration_minutes: number;
  meet_link: string | null;
  host_meet_link: string | null;
  created_at: Date;
  student_user?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
}

interface UpcomingScheduleProps {
  meetings?: Meeting[];
  mentorEmail?: string;
  onMeetingCreated?: () => void;
}

export default function UpcomingSchedule({ meetings: initialMeetings = [], mentorEmail = '', onMeetingCreated }: UpcomingScheduleProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMeetingsModalOpen, setIsMeetingsModalOpen] = useState(false);
  const [allMeetings, setAllMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Lọc ra các buổi tư vấn sắp tới (start_time >= now)
  const upcomingMeetings = useMemo(() => {
    const now = new Date();
    return initialMeetings.filter((m) => new Date(m.start_time) >= now);
  }, [initialMeetings]);

  // Tổng số buổi tư vấn trong DB
  const totalMeetingsCount = initialMeetings.length;

  // Fetch all meetings (including past) khi mở modal
  const handleOpenMeetingsModal = async () => {
    setIsMeetingsModalOpen(true);
    setIsLoading(true);

    try {
      const result = await getAllMentorMeetings();
      if (result.success && result.data) {
        setAllMeetings(result.data as Meeting[]);
      } else {
        toast.error(result.error || 'Không thể tải danh sách cuộc họp');
      }
    } catch (error) {
      toast.error('Đã xảy ra lỗi khi tải danh sách cuộc họp');
    } finally {
      setIsLoading(false);
    }
  };

  // Copy link to clipboard
  const handleCopyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(link);
      toast.success('Đã copy link phòng họp');
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (error) {
      toast.error('Không thể copy link');
    }
  };

  // Open link in new tab
  const handleOpenLink = (link: string) => {
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  const MeetingCard = ({ meeting }: { meeting: Meeting }) => (
    <div
      key={meeting.id}
      className="rounded-lg border border-border bg-card p-4 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">
            {meeting.title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Học viên: {meeting.student_user?.full_name || meeting.student_email}
          </p>
        </div>
        <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md shrink-0">
          {meeting.duration_minutes} phút
        </div>
      </div>

      {/* Time */}
      <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4 shrink-0" />
        <span>
          {format(new Date(meeting.start_time), "EEEE, dd/MM/yyyy 'lúc' HH:mm", { locale: vi })}
          {' → '}
          {format(new Date(meeting.end_time), 'HH:mm', { locale: vi })}
        </span>
      </div>

      {/* Meet Link - Host (cho Mentor) */}
      {meeting.host_meet_link && (
        <div className="mt-4 w-full overflow-hidden rounded-lg bg-primary/10 dark:bg-primary/20 p-3 border border-primary/20">
          <div className="flex items-center gap-2 text-xs text-primary mb-2 font-medium">
            <Video className="h-3.5 w-3.5 shrink-0" />
            <span>🎯 Link Host (Quyền chủ phòng):</span>
          </div>
          <div className="flex items-start gap-2 min-w-0 w-full">
            <code className="min-w-0 flex-1 rounded bg-muted px-3 py-2 text-xs text-foreground break-all whitespace-pre-wrap">
              {meeting.host_meet_link}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCopyLink(meeting.host_meet_link!)}
              className="shrink-0"
            >
              {copiedLink === meeting.host_meet_link ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="mt-2 flex justify-start">
            <Button
              size="sm"
              onClick={() => handleOpenLink(meeting.host_meet_link!)}
              className="w-fit bg-primary hover:bg-primary/90"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Vào phòng (Host)
            </Button>
          </div>
        </div>
      )}

      {/* Meet Link - Student (link thường) */}
      {meeting.meet_link && (
        <div className="mt-3 w-full overflow-hidden rounded-lg bg-muted/50 p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Video className="h-3.5 w-3.5 shrink-0" />
            <span>Link phòng họp (Học viên):</span>
          </div>
          <div className="flex items-start gap-2 min-w-0 w-full">
            <code className="min-w-0 flex-1 rounded bg-muted px-3 py-2 text-xs text-foreground break-all whitespace-pre-wrap">
              {meeting.meet_link}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCopyLink(meeting.meet_link!)}
              className="shrink-0"
            >
              {copiedLink === meeting.meet_link ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="mt-2 flex justify-start">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleOpenLink(meeting.meet_link!)}
              className="w-fit"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Tham gia
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Lịch sắp tới</h2>
            <p className="mt-1 text-sm text-muted-foreground">{totalMeetingsCount} buổi tư vấn</p>
          </div>
          {totalMeetingsCount > 0 && (
            <button
              type="button"
              onClick={handleOpenMeetingsModal}
              className="text-sm text-primary hover:underline"
            >
              Xem tất cả
            </button>
          )}
        </div>

        <div className="px-6 py-4">
          <div className="space-y-3">
            {upcomingMeetings.length === 0 ? (
              <div className="py-8 text-center">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Chưa có lịch tư vấn nào</p>
              </div>
            ) : (
              upcomingMeetings.slice(0, 3).map((meeting) => (
                <div
                  key={meeting.id}
                  className="cursor-pointer rounded-lg border border-border bg-muted/30 p-4 transition-colors hover:border-primary hover:bg-primary/5 dark:bg-muted/20"
                  onClick={handleOpenMeetingsModal}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Video className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="line-clamp-1 font-medium text-foreground">
                        {meeting.title}
                      </h4>
                      <p className="mt-0.5 text-xs text-muted-foreground truncate">
                        {meeting.student_email}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          {format(new Date(meeting.start_time), 'dd/MM/yyyy - HH:mm', { locale: vi })}
                          {' · '}
                          {meeting.duration_minutes} phút
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            {upcomingMeetings.length > 3 && (
              <button
                type="button"
                onClick={handleOpenMeetingsModal}
                className="w-full rounded-lg border border-dashed border-border py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                +{upcomingMeetings.length - 3} buổi khác...
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <Plus className="h-5 w-5" />
            Thêm buổi tư vấn
          </button>
        </div>

        {/* Create Meeting Modal */}
        <CreateMeetingModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          mentorEmail={mentorEmail}
          onMeetingCreated={onMeetingCreated}
        />
      </div>

      {/* All Meetings Modal */}
      <Dialog open={isMeetingsModalOpen} onOpenChange={setIsMeetingsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto overflow-x-hidden p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Tất cả cuộc họp
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="py-12 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="mt-4 text-sm text-muted-foreground">Đang tải...</p>
            </div>
          ) : allMeetings.length === 0 ? (
            <div className="py-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">Chưa có cuộc họp nào</p>
            </div>
          ) : (
            <div className="space-y-4 mt-2">
              {allMeetings.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}



