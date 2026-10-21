"use client";

import { useState, useEffect } from "react";
import { CalendarClock, Clock, ExternalLink, Video } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getUpcomingMeetingWithUser } from "@/actions/calendar";

interface MeetingData {
  id: string;
  title: string;
  start_time: string | Date;
  end_time: string | Date;
  duration_minutes: number;
  meet_link: string | null;
  host_meet_link: string | null;
  mentor_id: string;
}

interface UpcomingMeetingBannerProps {
  partnerId: string;
  currentUserId: string;
}

export default function UpcomingMeetingBanner({
  partnerId,
  currentUserId,
}: UpcomingMeetingBannerProps) {
  const [meeting, setMeeting] = useState<MeetingData | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!partnerId) return;

    getUpcomingMeetingWithUser(partnerId)
      .then((result) => {
        if (result.success && result.data) {
          setMeeting(result.data as MeetingData);
        } else {
          setMeeting(null);
        }
      })
      .catch(() => setMeeting(null));
  }, [partnerId]);

  if (!meeting) return null;

  const isHost = meeting.mentor_id === currentUserId;
  const joinLink = isHost
    ? meeting.host_meet_link || meeting.meet_link
    : meeting.meet_link;

  const formattedTime = format(
    new Date(meeting.start_time),
    "HH:mm, dd/MM/yyyy",
    { locale: vi },
  );

  return (
    <>
      {/* Banner */}
      <div
        onClick={() => setIsOpen(true)}
        className="flex w-full cursor-pointer items-center gap-3 border-b border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-950/30 px-4 py-2.5 transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/40"
      >
        <CalendarClock className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
        <p className="flex-1 truncate text-sm text-blue-800 dark:text-blue-300">
          <span className="font-medium">Lịch tư vấn sắp tới:</span>{" "}
          {meeting.title} —{" "}
          <span className="text-blue-600 dark:text-blue-400">
            {formattedTime}
          </span>
        </p>
        <Video className="h-4 w-4 shrink-0 text-blue-500 dark:text-blue-400" />
      </div>

      {/* Detail Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <CalendarClock className="h-5 w-5 text-primary" />
              Chi tiết lịch tư vấn
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Title */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Nội dung
              </p>
              <p className="mt-1 text-base font-semibold text-foreground">
                {meeting.title}
              </p>
            </div>

            {/* Time */}
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Bắt đầu:</span>
                <span className="font-medium text-foreground">
                  {format(
                    new Date(meeting.start_time),
                    "EEEE, dd/MM/yyyy 'lúc' HH:mm",
                    { locale: vi },
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Kết thúc:</span>
                <span className="font-medium text-foreground">
                  {format(new Date(meeting.end_time), "HH:mm", { locale: vi })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Thời lượng:</span>
                <span className="font-medium text-foreground">
                  {meeting.duration_minutes} phút
                </span>
              </div>
            </div>

            {/* Join Button */}
            {joinLink && (
              <Button
                className="w-full"
                onClick={() =>
                  window.open(joinLink, "_blank", "noopener,noreferrer")
                }
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                {isHost ? "Vào phòng (Host)" : "Tham gia phòng họp"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
