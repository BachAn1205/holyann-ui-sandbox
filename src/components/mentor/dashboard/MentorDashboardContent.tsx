'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Users, Calendar, Star, AlertTriangle, Clock, ArrowRight, CalendarClock, LayoutDashboard, MessageCircle } from 'lucide-react';
import UpcomingSchedule from './UpcomingSchedule';
import MentorDashboardHero from './MentorDashboardHero';
import { getMentorMeetings } from '@/actions/calendar';
import type { MentorDashboardStats } from '@/types/mentor';
import { QuickStatCard } from '@/components/student/dashboard/QuickStatCard';
import type { QuickStatItem } from '@/components/student/dashboard/types';

interface DeadlineTask {
  id: string;
  render_id?: string;
  type?: 'checklist' | 'custom';
  task_title: string;
  student_name: string;
  student_id: string;
  deadline: string;
  status: string;
  days_remaining: number;
}

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

export default function MentorDashboardContent() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<MentorDashboardStats>({
    totalActiveStudents: 0,
    weeklyDeadlines: 0,
    averageRating: 5.0,
  });
  const [urgentDeadlines, setUrgentDeadlines] = useState<DeadlineTask[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshMeetings = useCallback(async () => {
    try {
      const result = await getMentorMeetings();
      if (result.success && result.data) {
        setMeetings(result.data as Meeting[]);
      }
    } catch (error) {
      console.error('Error refreshing meetings:', error);
    }
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, deadlinesRes, meetingsResult] = await Promise.all([
          fetch('/api/mentor/dashboard/stats'),
          fetch('/api/mentor/dashboard/urgent-deadlines'),
          getMentorMeetings(),
        ]);

        if (!statsRes.ok) {
          console.error('Dashboard Stats API Error:', await statsRes.text());
          return;
        }

        const statsData = await statsRes.json();

        setStats({
          totalActiveStudents: statsData.totalActiveStudents,
          weeklyDeadlines: statsData.weeklyDeadlines,
          averageRating: statsData.averageRating,
        });

        if (deadlinesRes.ok) {
          const deadlinesData = await deadlinesRes.json();
          setUrgentDeadlines(deadlinesData);
        }

        if (meetingsResult.success && meetingsResult.data) {
          setMeetings(meetingsResult.data as Meeting[]);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getDeadlineColor = (daysRemaining: number) => {
    if (daysRemaining < 0) {
      return {
        iconBg: 'bg-red-50 dark:bg-red-950/30',
        iconText: 'text-red-600 dark:text-red-400',
        iconBorder: 'border-red-200/70 dark:border-red-800/40',
        badgeBg: 'bg-red-50 dark:bg-red-950/30',
        badgeText: 'text-red-700 dark:text-red-300',
      };
    }
    if (daysRemaining === 0) {
      return {
        iconBg: 'bg-amber-50 dark:bg-amber-950/30',
        iconText: 'text-amber-600 dark:text-amber-400',
        iconBorder: 'border-amber-200/70 dark:border-amber-800/40',
        badgeBg: 'bg-amber-50 dark:bg-amber-950/30',
        badgeText: 'text-amber-700 dark:text-amber-300',
      };
    }
    if (daysRemaining <= 2) {
      return {
        iconBg: 'bg-blue-50 dark:bg-blue-950/30',
        iconText: 'text-blue-600 dark:text-blue-400',
        iconBorder: 'border-blue-200/70 dark:border-blue-800/40',
        badgeBg: 'bg-blue-50 dark:bg-blue-950/30',
        badgeText: 'text-blue-700 dark:text-blue-300',
      };
    }
    return {
      iconBg: 'bg-slate-50 dark:bg-slate-900/40',
      iconText: 'text-slate-600 dark:text-slate-300',
      iconBorder: 'border-slate-200/70 dark:border-slate-700/60',
      badgeBg: 'bg-slate-50 dark:bg-slate-900/40',
      badgeText: 'text-slate-700 dark:text-slate-300',
    };
  };

  const getTaskTypeLabel = (type?: DeadlineTask['type']) => {
    if (type === 'custom') return 'Task cố vấn';
    return 'Checklist';
  };

  const getDeadlineText = (daysRemaining: number) => {
    if (daysRemaining < 0) return `Quá hạn ${Math.abs(daysRemaining)} ngày`;
    if (daysRemaining === 0) return 'Hôm nay!';
    return `Còn ${daysRemaining} ngày`;
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-border bg-card">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const quickStats: QuickStatItem[] = [
    {
      id: 'mentor_students',
      label: 'Học viên phụ trách',
      value: stats.totalActiveStudents,
      icon: 'Users',
      accent: 'blue',
    },
    {
      id: 'mentor_deadlines',
      label: 'Hạn chót tuần này',
      value: stats.weeklyDeadlines,
      icon: 'Calendar',
      accent: 'amber',
    },
    {
      id: 'mentor_rating',
      label: 'Đánh giá trung bình',
      value: Number(stats.averageRating.toFixed(1)),
      icon: 'Star',
      accent: 'violet',
    },
  ];

  const quickLinks = [
    { href: '/mentor/students', label: 'Danh sách học viên', icon: Users },
    { href: '/mentor/deadlines', label: 'Quản lý hạn chót', icon: CalendarClock },
    { href: '/mentor/chat', label: 'Tin nhắn', icon: MessageCircle },
  ];

  return (
    <div>
      <MentorDashboardHero userName={session?.user?.name || 'Cố vấn'} />

      <div className="space-y-6 px-4 py-6 sm:px-6">
      {/* Stats Row - same visual system as student */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 items-stretch">
        {quickStats.map((item, index) => (
          <QuickStatCard key={item.id} item={item} index={index} />
        ))}
      </div>

      <section className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="border-b border-border px-6 py-4 bg-muted/30 dark:bg-muted/20">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            <h3 className="font-heading text-base font-bold text-primary m-0">Truy cập nhanh</h3>
          </div>
        </div>
        <div className="p-4">
          <nav className="grid grid-cols-1 sm:grid-cols-3 gap-3" aria-label="Truy cập nhanh mentor">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 text-center transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary hover:text-primary-foreground hover:shadow-md"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-primary transition-all duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-sans font-medium text-foreground group-hover:text-primary-foreground">
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Urgent deadlines (2/3 width) */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-950/30">
                  <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="font-heading text-base font-bold text-primary">Hạn chót sắp đến hạn</h2>
                  <p className="text-sm text-muted-foreground">Các nhiệm vụ cần chú ý trong 5 ngày tới</p>
                </div>
              </div>
              <Link
                href="/mentor/deadlines"
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                Xem tất cả
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="divide-y divide-border/80">
              {urgentDeadlines.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <CalendarClock className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Không có hạn chót nào trong 5 ngày tới
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Các học viên đang hoàn thành đúng tiến độ
                  </p>
                </div>
              ) : (
                urgentDeadlines.map((task) => {
                  const colors = getDeadlineColor(task.days_remaining);
                  return (
                    <div
                      key={task.render_id ?? `${task.type ?? 'task'}-${task.id}`}
                      className="px-6 py-4 transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-900/40"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 flex-1 items-center gap-4">
                          <div className={`rounded-xl border p-2.5 ${colors.iconBg} ${colors.iconBorder}`}>
                            {task.days_remaining < 0 ? (
                              <AlertTriangle className={`h-5 w-5 ${colors.iconText}`} />
                            ) : (
                              <Clock className={`h-5 w-5 ${colors.iconText}`} />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                {getTaskTypeLabel(task.type)}
                              </span>
                            </div>
                            <h3 className="truncate text-[15px] font-semibold text-foreground">
                              {task.task_title}
                            </h3>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                              Học viên: {task.student_name}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors.badgeBg} ${colors.badgeText}`}>
                              {getDeadlineText(task.days_remaining)}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {new Date(task.deadline).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                        </div>
                        <Link
                          href={`/mentor/students?studentId=${task.student_id}`}
                          className="ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
                        >
                          <ArrowRight className="h-5 w-5" />
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Schedule (1/3 width) */}
        <div className="space-y-6 lg:col-span-1">
          {/* Schedule */}
          <UpcomingSchedule meetings={meetings} mentorEmail={session?.user?.email || ''} onMeetingCreated={refreshMeetings} />
        </div>
      </div>
      </div>
    </div>
  );
}
