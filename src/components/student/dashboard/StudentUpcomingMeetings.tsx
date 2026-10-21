"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Video,
  Calendar,
  Clock,
  ExternalLink,
  Copy,
  Check,
  User,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getStudentMeetings } from "@/actions/calendar";

interface StudentMeeting {
  id: string;
  title: string;
  description: string | null;
  student_email: string;
  start_time: string | Date;
  end_time: string | Date;
  duration_minutes: number;
  meet_link: string | null;
  mentor_user?: {
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
}

export function StudentUpcomingMeetings() {
  const [meetings, setMeetings] = useState<StudentMeeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const result = await getStudentMeetings();
        if (result.success && result.data) {
          setMeetings(result.data as StudentMeeting[]);
        }
      } catch (error) {
        console.error("Error fetching student meetings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeetings();
  }, []);

  const handleCopyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(link);
      toast.success("Đã copy link phòng họp");
      setTimeout(() => setCopiedLink(null), 2000);
    } catch {
      toast.error("Không thể copy link");
    }
  };

  const handleOpenLink = (link: string) => {
    window.open(link, "_blank", "noopener,noreferrer");
  };

  // Kiểm tra buổi họp sắp diễn ra (trong vòng 30 phút)
  const isUpcomingSoon = (startTime: string | Date) => {
    const start = new Date(startTime).getTime();
    const now = Date.now();
    const diff = start - now;
    return diff > 0 && diff <= 30 * 60 * 1000;
  };

  // Kiểm tra buổi họp đang diễn ra
  const isOngoing = (startTime: string | Date, endTime: string | Date) => {
    const now = Date.now();
    return new Date(startTime).getTime() <= now && now <= new Date(endTime).getTime();
  };

  if (isLoading) {
    return (
      <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border px-6 py-4 bg-muted/30 dark:bg-muted/20">
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            <CardTitle className="font-heading text-base font-bold text-primary m-0">
              Lịch tư vấn sắp tới
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border px-6 py-4 bg-muted/30 dark:bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              <CardTitle className="font-heading text-base font-bold text-primary m-0">
                Lịch tư vấn sắp tới
              </CardTitle>
            </div>
            {meetings.length > 0 && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                {meetings.length} buổi
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {meetings.length === 0 ? (
            <div className="py-10 text-center">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">
                Chưa có lịch tư vấn nào sắp tới
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Cố vấn sẽ đặt lịch tư vấn cho bạn khi cần thiết
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {meetings.map((meeting) => {
                const ongoing = isOngoing(meeting.start_time, meeting.end_time);
                const soon = isUpcomingSoon(meeting.start_time);

                return (
                  <div
                    key={meeting.id}
                    className={`rounded-xl border p-4 transition-all duration-200 ${
                      ongoing
                        ? "border-green-500/50 bg-green-50 dark:bg-green-950/20 shadow-sm shadow-green-500/10"
                        : soon
                        ? "border-primary/50 bg-primary/5 dark:bg-primary/10 shadow-sm shadow-primary/10"
                        : "border-border bg-card hover:border-primary/30 hover:bg-muted/30"
                    }`}
                  >
                    {/* Status Badge */}
                    {(ongoing || soon) && (
                      <div className="mb-3">
                        {ongoing ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-900/40 px-3 py-1 text-xs font-medium text-green-700 dark:text-green-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                            Đang diễn ra
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                            <Clock className="h-3 w-3" />
                            Sắp bắt đầu
                          </span>
                        )}
                      </div>
                    )}

                    {/* Title & Mentor */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-foreground line-clamp-2">
                          {meeting.title}
                        </h4>
                        {meeting.mentor_user && (
                          <div className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                            <User className="h-3.5 w-3.5 shrink-0" />
                            <span>Mentor: {meeting.mentor_user.full_name}</span>
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                        {meeting.duration_minutes} phút
                      </div>
                    </div>

                    {/* Time */}
                    <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 shrink-0 text-primary/70" />
                      <span>
                        {format(
                          new Date(meeting.start_time),
                          "EEEE, dd/MM/yyyy 'lúc' HH:mm",
                          { locale: vi }
                        )}
                        {" → "}
                        {format(new Date(meeting.end_time), "HH:mm", {
                          locale: vi,
                        })}
                      </span>
                    </div>

                    {/* Meet Link */}
                    {meeting.meet_link && (
                      <div className="mt-4 w-full overflow-hidden rounded-lg bg-muted/50 dark:bg-muted/30 p-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <Video className="h-3.5 w-3.5 shrink-0" />
                          <span>Link phòng họp:</span>
                        </div>
                        <div className="flex items-center gap-2 min-w-0 w-full overflow-hidden">
                          <code className="min-w-0 flex-1 rounded bg-muted px-3 py-2 text-xs text-foreground truncate block max-w-full overflow-hidden">
                            {meeting.meet_link}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleCopyLink(meeting.meet_link!)
                            }
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
                            onClick={() =>
                              handleOpenLink(meeting.meet_link!)
                            }
                            className={`w-fit ${
                              ongoing
                                ? "bg-green-600 hover:bg-green-700 text-white"
                                : "bg-primary hover:bg-primary/90"
                            }`}
                          >
                            <ExternalLink className="h-4 w-4 mr-1.5" />
                            {ongoing ? "Vào phòng ngay" : "Tham gia phòng họp"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
