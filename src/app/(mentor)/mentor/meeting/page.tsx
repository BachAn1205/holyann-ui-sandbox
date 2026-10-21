"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  isSameDay,
} from "date-fns";
import { vi } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  Video,
  Clock,
  User,
  ExternalLink,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  getMentorMeetings,
  getMentorMeetingsInRange,
} from "@/actions/calendar";
import { cn } from "@/lib/utils";

const ACCENT = "#0052FF";
const ACCENT_SEC = "#4D7CFF";

type MeetingItem = {
  id: string;
  title: string;
  description: string | null;
  start_time: string | Date;
  end_time: string | Date;
  duration_minutes: number;
  meet_link: string | null;
  host_meet_link: string | null;
  student_user?: {
    id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
  student_email?: string;
};

const easeOut = [0.16, 1, 0.3, 1] as const;
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOut } },
};

export default function MentorMeetingPage() {
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [allMeetings, setAllMeetings] = useState<MeetingItem[]>([]);
  const [calendarMeetings, setCalendarMeetings] = useState<MeetingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const monthStart = useMemo(() => startOfMonth(calendarMonth), [calendarMonth]);
  const monthEnd = useMemo(() => endOfMonth(calendarMonth), [calendarMonth]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [allRes, rangeRes] = await Promise.all([
        getMentorMeetings(),
        getMentorMeetingsInRange(monthStart, monthEnd),
      ]);
      if (allRes.success && allRes.data) {
        setAllMeetings(allRes.data as MeetingItem[]);
      }
      if (rangeRes.success && rangeRes.data) {
        setCalendarMeetings(rangeRes.data as MeetingItem[]);
      }
      setLoading(false);
    };
    load();
  }, [monthStart, monthEnd]);

  const upcomingMeetings = useMemo(() => {
    const now = new Date();
    return allMeetings.filter((m) => new Date(m.start_time) >= now);
  }, [allMeetings]);

  const daysWithMeetings = useMemo(() => {
    const set = new Set<string>();
    calendarMeetings.forEach((m) => {
      set.add(format(new Date(m.start_time), "yyyy-MM-dd"));
    });
    return set;
  }, [calendarMeetings]);

  const displayMeetings = useMemo(() => {
    if (selectedDate) {
      return calendarMeetings.filter((m) =>
        isSameDay(new Date(m.start_time), selectedDate)
      );
    }
    return upcomingMeetings;
  }, [upcomingMeetings, calendarMeetings, selectedDate]);

  const modifiers = useMemo(
    () => ({
      hasMeeting: (date: Date) =>
        daysWithMeetings.has(format(date, "yyyy-MM-dd")),
    }),
    [daysWithMeetings]
  );

  const modifiersClassNames = useMemo(
    () => ({
      hasMeeting: "bg-[#0052FF]/15 font-medium",
    }),
    []
  );

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

  const getMeetLink = (m: MeetingItem) => m.host_meet_link || m.meet_link;

  const isOngoing = (start: string | Date, end: string | Date) => {
    const now = Date.now();
    return (
      new Date(start).getTime() <= now && now <= new Date(end).getTime()
    );
  };

  const isUpcomingSoon = (start: string | Date) => {
    const startTime = new Date(start).getTime();
    const diff = startTime - Date.now();
    return diff > 0 && diff <= 30 * 60 * 1000;
  };

  const studentLabel = (m: MeetingItem) =>
    m.student_user?.full_name || m.student_email || "Học viên";

  return (
    <div className="min-h-[60vh]">
      <div className="mx-auto max-w-6xl min-w-0 space-y-8">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-2xl border border-border bg-card px-6 py-8 shadow-md sm:px-10 sm:py-10">
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-[0.06]"
            style={{
              background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_SEC})`,
            }}
          />
          <div className="relative">
            <div
              className="inline-flex items-center gap-2 rounded-full border px-4 py-2"
              style={{
                borderColor: "rgba(0, 82, 255, 0.3)",
                backgroundColor: "rgba(0, 82, 255, 0.05)",
              }}
            >
              <span
                className="h-2 w-2 rounded-full animate-pulse"
                style={{ backgroundColor: ACCENT }}
              />
              <span
                className="font-sans font-medium text-xs uppercase tracking-[0.15em]"
                style={{ color: ACCENT }}
              >
                Lịch tư vấn
              </span>
            </div>
            <h1 className="mt-4 font-university-display text-2xl font-bold leading-tight text-foreground sm:text-3xl md:text-4xl">
              <span className="relative inline-block">
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage: `linear-gradient(to right, ${ACCENT}, ${ACCENT_SEC})`,
                  }}
                >
                  Cuộc hẹn với học viên
                </span>
              </span>
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Xem lịch và tham gia các buổi tư vấn 1-1 với học viên
            </p>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
          {/* Calendar card */}
          <motion.section
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="rounded-2xl border border-border bg-card p-5 shadow-md transition-shadow hover:shadow-lg"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">
                Lịch theo tháng
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-xl"
                  onClick={() => setCalendarMonth((d) => subMonths(d, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-xl"
                  onClick={() => setCalendarMonth((d) => addMonths(d, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {loading ? (
              <div className="flex h-[280px] items-center justify-center">
                <Loader2
                  className="h-8 w-8 animate-spin"
                  style={{ color: ACCENT }}
                />
              </div>
            ) : (
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  month={calendarMonth}
                  onMonthChange={setCalendarMonth}
                  modifiers={modifiers}
                  modifiersClassNames={modifiersClassNames}
                  classNames={{
                    today: "",
                  }}
                  className="mx-auto rounded-xl border-0 p-0"
                />
              </div>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              Chấm tròn: ngày có cuộc hẹn. Chọn ngày để lọc danh sách bên dưới.
            </p>
          </motion.section>

          {/* List */}
          <motion.section
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="rounded-2xl border border-border bg-card p-5 shadow-md transition-shadow hover:shadow-lg sm:p-6"
          >
            <div className="mb-4 flex items-center gap-2">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_SEC})`,
                  boxShadow: "0 4px 14px rgba(0, 82, 255, 0.25)",
                }}
              >
                <Video className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">
                  {selectedDate
                    ? `Cuộc hẹn ngày ${format(selectedDate, "dd/MM/yyyy", { locale: vi })}`
                    : "Sắp tới"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {selectedDate
                    ? "Các buổi tư vấn trong ngày đã chọn"
                    : "Tất cả cuộc hẹn sắp tới"}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2
                  className="h-8 w-8 animate-spin"
                  style={{ color: ACCENT }}
                />
              </div>
            ) : displayMeetings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground/40" />
                <p className="mt-3 text-sm text-muted-foreground">
                  {selectedDate
                    ? "Không có cuộc hẹn nào trong ngày này"
                    : "Chưa có lịch tư vấn sắp tới"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Tạo lịch tư vấn từ dashboard hoặc khi chat với học viên
                </p>
              </div>
            ) : (
              <ul className="space-y-4">
                {displayMeetings.map((meeting) => {
                  const ongoing = isOngoing(
                    meeting.start_time,
                    meeting.end_time
                  );
                  const soon = isUpcomingSoon(meeting.start_time);
                  const meetLink = getMeetLink(meeting);
                  return (
                    <li
                      key={meeting.id}
                      className={cn(
                        "rounded-xl border p-4 transition-all",
                        ongoing
                          ? "border-emerald-500/50 bg-emerald-50/80 dark:bg-emerald-950/20"
                          : soon
                            ? "border-[#0052FF]/40 bg-[#0052FF]/5"
                            : "border-border bg-muted/20 hover:bg-muted/30"
                      )}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          {(ongoing || soon) && (
                            <span
                              className={cn(
                                "mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                                ongoing
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                                  : "text-[#0052FF]"
                              )}
                              style={
                                soon
                                  ? { backgroundColor: "rgba(0, 82, 255, 0.1)" }
                                  : undefined
                              }
                            >
                              {ongoing ? (
                                <>
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Đang diễn ra
                                </>
                              ) : (
                                <>
                                  <Clock className="h-3 w-3" />
                                  Sắp bắt đầu
                                </>
                              )}
                            </span>
                          )}
                          <h3 className="font-semibold text-foreground">
                            {meeting.title}
                          </h3>
                          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                            <User className="h-3.5 w-3.5 shrink-0" />
                            {studentLabel(meeting)}
                          </p>
                          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Clock className="h-3.5 w-3.5 shrink-0" />
                            {format(
                              new Date(meeting.start_time),
                              "EEEE, dd/MM/yyyy 'lúc' HH:mm",
                              { locale: vi }
                            )}{" "}
                            →{" "}
                            {format(new Date(meeting.end_time), "HH:mm", {
                              locale: vi,
                            })}{" "}
                            · {meeting.duration_minutes} phút
                          </p>
                        </div>
                        {meetLink && (
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 rounded-xl"
                                onClick={() => handleCopyLink(meetLink)}
                              >
                                {copiedLink === meetLink ? (
                                  <Check className="h-4 w-4 text-emerald-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                className="h-8 rounded-xl font-semibold text-white shadow-md"
                                style={{
                                  background: ongoing
                                    ? undefined
                                    : `linear-gradient(to right, ${ACCENT}, ${ACCENT_SEC})`,
                                }}
                                onClick={() => handleOpenLink(meetLink)}
                                {...(ongoing && {
                                  className:
                                    "h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white",
                                })}
                              >
                                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                                {ongoing ? "Vào phòng ngay" : "Tham gia"}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </motion.section>
        </div>
      </div>
    </div>
  );
}
