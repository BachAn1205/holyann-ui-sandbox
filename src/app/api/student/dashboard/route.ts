import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-config";
import { prisma } from "@/lib/prisma";
import { TaskStatus } from "@prisma/client";
import { redis } from "@/lib/redis";

const CUSTOM_TASK_LINK_MARKER = "__CUSTOM_TASK__";
const MARKETING_CACHE_KEY = "marketing:posts:active";
const MARKETING_CACHE_TTL = 14400; // 4 hours

function getGpaFromProfile(academicProfile: any): { value: string; scale: number } | null {
  if (!academicProfile?.gpa_transcript_details) return null;
  const gpaDetails = academicProfile.gpa_transcript_details as Record<string, unknown>;
  const raw =
    (gpaDetails.grade12 ?? gpaDetails.grade11 ?? gpaDetails.grade10 ?? gpaDetails.grade9 ?? gpaDetails.gpa) as
    | string
    | number
    | undefined;
  if (raw == null) return null;
  const num = typeof raw === "string" ? parseFloat(raw) : raw;
  if (Number.isNaN(num)) return null;
  const scale = (gpaDetails.scale as number) ?? 10;
  return { value: num.toFixed(1), scale };
}

function dueDateToPriority(dueDate: Date): "low" | "medium" | "high" {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(dueDate);
  d.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "high";
  if (diffDays <= 3) return "high";
  if (diffDays <= 7) return "medium";
  return "low";
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const studentId = session.user.id;

    // 1. Try reading marketing posts from cache first
    let rawMarketingPosts: any[] = [];
    if (redis) {
      try {
        const cached = await redis.get(MARKETING_CACHE_KEY);
        if (cached) {
          rawMarketingPosts = JSON.parse(cached);
        }
      } catch (err) {
        console.error("[Redis] Failed to read marketing posts for dashboard:", err);
      }
    }

    const [
      student,
      taskProgressList,
      customDeadlines,
      checklistTasks,
      cvDocumentCount,
      meetingCount,
      targetGoalsRows,
      dbMarketingPosts
    ] = await Promise.all([
      prisma.students.findUnique({
        where: { user_id: studentId },
        include: {
          student_backgrounds: {
            include: {
              subject_scores: true,
            },
          },
          student_academic_profiles: true,
        },
      }),
      prisma.student_task_progress.findMany({
        where: { student_id: studentId },
        include: {
          checklist_tasks: {
            select: {
              id: true,
              title: true,
              link_to: true,
              checklist_stages: { select: { name: true } },
            },
          },
        },
      }),
      prisma.mentor_custom_deadlines.findMany({
        where: { student_id: studentId },
        orderBy: { deadline: "asc" },
        select: {
          id: true,
          title: true,
          deadline: true,
          status: true,
        },
      }),
      prisma.checklist_tasks.findMany({
        include: {
          checklist_stages: { select: { name: true } },
        },
        orderBy: [{ checklist_stages: { order_index: "asc" } }, { order_index: "asc" }],
      }),
      prisma.student_cv_documents.count({ where: { student_id: studentId } }),
      prisma.consultation_meetings.count({
        where: { student_id: studentId },
      }),
      prisma.student_target_goals.findMany({
        where: { student_id: studentId },
        orderBy: [{ sort_order: "asc" }, { created_at: "asc" }],
        select: {
          id: true,
          faculty_name: true,
          university_id: true,
          university_name: true,
          sort_order: true,
        },
      }),
      rawMarketingPosts.length === 0
        ? prisma.marketing_posts.findMany({
            where: { status: 'PUBLISHED' },
            orderBy: { target_publish_date: 'desc' },
            take: 6,
            select: {
              id: true,
              title: true,
              slug: true,
              excerpt: true,
              thumbnail_url: true,
              target_publish_date: true,
              category: true,
            },
          })
        : Promise.resolve(null)
    ]);

    if (rawMarketingPosts.length === 0) {
      rawMarketingPosts = dbMarketingPosts ?? [];

      if (redis && rawMarketingPosts.length > 0) {
        try {
          await redis.set(MARKETING_CACHE_KEY, JSON.stringify(rawMarketingPosts), 'EX', MARKETING_CACHE_TTL);
        } catch (err) {
          console.error("[Redis] Failed to write dashboard marketing posts cache:", err);
        }
      }
    }

    const completedStatuses = new Set<TaskStatus>([TaskStatus.COMPLETED]);
    const baseChecklistTasks = checklistTasks.filter((t) => t.link_to !== CUSTOM_TASK_LINK_MARKER);
    const cvTask = baseChecklistTasks.find((t) => /CV/i.test(t.title));
    const progressByTaskId = new Map(taskProgressList.map((p) => [p.task_id, p]));

    let completedCount = 0;
    let inProgressCount = 0;

    baseChecklistTasks.forEach((task) => {
      const progress = progressByTaskId.get(task.id);
      const completedByCvUpload = cvTask?.id === task.id && cvDocumentCount >= 1;
      if (completedByCvUpload || (progress && completedStatuses.has(progress.status))) {
        completedCount += 1;
        return;
      }
      if (progress?.status === TaskStatus.IN_PROGRESS) {
        inProgressCount += 1;
      }
    });

    customDeadlines.forEach((c) => {
      const progress = progressByTaskId.get(c.id);
      const status = progress?.status ?? c.status;
      if (completedStatuses.has(status)) {
        completedCount += 1;
        return;
      }
      if (status === TaskStatus.IN_PROGRESS) {
        inProgressCount += 1;
      }
    });

    const totalTasks = baseChecklistTasks.length + customDeadlines.length;
    const pendingCount = Math.max(0, totalTasks - completedCount - inProgressCount);

    const deadlinesWithDue: { id: string; title: string; subject: string; dueDate: Date; priority: "low" | "medium" | "high"; completed: boolean }[] = [];

    taskProgressList
      .filter((p) => p.deadline && p.checklist_tasks)
      .filter((p) => p.checklist_tasks?.link_to !== CUSTOM_TASK_LINK_MARKER)
      .forEach((p) => {
        const completed = p.status === TaskStatus.COMPLETED || p.status === TaskStatus.SUBMITTED;
        deadlinesWithDue.push({
          id: p.id,
          title: p.checklist_tasks!.title,
          subject: p.checklist_tasks!.checklist_stages?.name ?? ":",
          dueDate: p.deadline!,
          priority: dueDateToPriority(p.deadline!),
          completed,
        });
      });
    customDeadlines.forEach((c) => {
      if (!c.deadline) return;
      const completed = c.status === TaskStatus.COMPLETED || c.status === TaskStatus.SUBMITTED;
      deadlinesWithDue.push({
        id: c.id,
        title: c.title,
        subject: "Mentor",
        dueDate: c.deadline,
        priority: dueDateToPriority(c.deadline),
        completed,
      });
    });
    deadlinesWithDue.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    const upcomingDeadlines = deadlinesWithDue.filter((d) => !d.completed).slice(0, 10);

    const gpaInfo = student?.student_academic_profiles
      ? getGpaFromProfile(student.student_academic_profiles)
      : null;

    const subjectScores = student?.student_backgrounds?.subject_scores ?? [];
    const gradesBySubject = subjectScores.map((s) => ({
      subject: s.subject,
      grade: s.score,
    }));

    const quickStats = [
      {
        id: "gpa",
        label: "GPA hiện tại",
        value: gpaInfo ? `${gpaInfo.value}/${gpaInfo.scale}` : ":",
        trend: undefined as { value: number; label: string } | undefined,
        icon: "GraduationCap",
        accent: "blue" as const,
      },
      {
        id: "courses",
        label: "Khóa đã hoàn thành",
        value: completedCount,
        trend: totalTasks
          ? {
            value: Math.round((completedCount / totalTasks) * 100),
            label: "Mức hoàn thành công việc",
          }
          : undefined,
        icon: "BookOpen",
        accent: "emerald" as const,
      },
      {
        id: "tasks",
        label: "Nhiệm vụ đang chờ",
        value: pendingCount + inProgressCount,
        trend: undefined,
        icon: "CheckSquare",
        accent: "amber" as const,
      },
      {
        id: "meetings",
        label: "Số buổi tham gia tư vấn cùng Ban Cố vấn",
        value: meetingCount,
        trend: undefined,
        icon: "Video",
        accent: "violet" as const,
      },
      {
        id: "goal",
        label: "Mục tiêu cao nhất",
        value:
          student?.target_faculty_name && student?.target_university_name
            ? `${student.target_faculty_name} @ ${student.target_university_name}`
            : ":",
        trend: undefined,
        icon: "Target",
        accent: "rose" as const,
      },
    ];

    const taskCompletionPie = [
      { name: "Done", value: completedCount },
      { name: "In progress", value: inProgressCount },
      { name: "Pending", value: totalTasks - completedCount - inProgressCount },
      { name: "Total", value: totalTasks }
    ];

    const recentCompleted = taskProgressList
      .filter((p) => p.completed_at)
      .sort((a, b) => (b.completed_at!.getTime() - a.completed_at!.getTime()))
      .slice(0, 5);
    const activity = recentCompleted.map((p) => ({
      id: p.id,
      type: "task" as const,
      title: p.checklist_tasks ? `Hoàn thành: ${p.checklist_tasks.title}` : "Hoàn thành nhiệm vụ",
      time: formatTimeAgo(p.completed_at!),
      meta: p.checklist_tasks?.checklist_stages?.name ?? undefined,
    }));

    return NextResponse.json({
      quickStats,
      currentGoal: {
        targetFacultyName: student?.target_faculty_name ?? null,
        targetUniversityName: student?.target_university_name ?? null,
        targetUniversityId: student?.target_university_id ?? null,
        personalDesire: student?.personal_desire ?? null,
      },
      targetGoals: targetGoalsRows.map((g) => ({
        id: g.id,
        facultyName: g.faculty_name,
        universityId: g.university_id,
        universityName: g.university_name,
        sortOrder: g.sort_order,
      })),
      deadlines: upcomingDeadlines.map((d) => ({
        id: d.id,
        title: d.title,
        subject: d.subject,
        dueDate: d.dueDate.toISOString(),
        priority: d.priority,
        completed: d.completed,
      })),
      taskCompletion: taskCompletionPie,
      gradesBySubject,
      weeklyStudy: [] as { day: string; hours: number }[],
      activity,
      aiInsights: [] as { id: string; text: string; tone: "positive" | "warning" | "neutral" }[],
      marketingPosts: rawMarketingPosts.map(p => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        thumbnailUrl: p.thumbnail_url,
        targetPublishDate: p.target_publish_date
          ? (typeof p.target_publish_date === 'string'
              ? p.target_publish_date
              : p.target_publish_date.toISOString())
          : null,
        category: p.category,
      })),
    });
  } catch (e) {
    console.error("[Dashboard API]", e);
    return NextResponse.json(
      { error: "Lỗi tải dữ liệu dashboard" },
      { status: 500 }
    );
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 60) return diffMins <= 1 ? "Vừa xong" : `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays === 1) return "Hôm qua";
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString("vi-VN");
}
