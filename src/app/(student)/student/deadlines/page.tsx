import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-config";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import StudentDeadlinesTable from "@/components/student/deadlines/StudentDeadlinesTable";
import { StudentPageContainer } from "@/components/student";

export const dynamic = "force-dynamic";

type RowType = "checklist" | "custom";
const CUSTOM_TASK_LINK_MARKER = "__CUSTOM_TASK__";

function getDeadlineStatus(deadline: Date, status: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const formattedDate = deadlineDate.toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  if (status === "COMPLETED" || status === "SUBMITTED") {
    return {
      label: formattedDate,
      sublabel: status === "COMPLETED" ? "Đã hoàn thành" : "Chờ review",
      badgeClass: "bg-muted text-muted-foreground dark:bg-muted/80",
      priority: 4,
    };
  }
  if (diffDays < 0) {
    return {
      label: formattedDate,
      sublabel: `Quá hạn ${Math.abs(diffDays)} ngày`,
      badgeClass: "bg-destructive/20 text-destructive dark:bg-destructive/30",
      priority: 1,
    };
  }
  if (diffDays === 0) {
    return {
      label: formattedDate,
      sublabel: "Hôm nay",
      badgeClass: "bg-accent/20 text-accent-foreground dark:bg-accent/30",
      priority: 1,
    };
  }
  if (diffDays <= 3) {
    return {
      label: formattedDate,
      sublabel: `Còn ${diffDays} ngày`,
      badgeClass:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      priority: 2,
    };
  }
  return {
    label: formattedDate,
    sublabel: `Còn ${diffDays} ngày`,
    badgeClass:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    priority: 3,
  };
}

function getCustomDeadlineStatus(deadline: Date | null) {
  if (!deadline) {
    return {
      label: ":",
      sublabel: "Chưa đặt",
      badgeClass: "bg-muted text-muted-foreground",
      priority: 5,
    };
  }

  return {
    label: deadline.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    sublabel: "Tùy chỉnh",
    badgeClass: "bg-muted text-muted-foreground",
    priority: 5,
  };
}

export default async function StudentDeadlinesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const studentId = session.user.id;

  const [tasksWithDeadlines, customDeadlines] = await Promise.all([
    prisma.student_task_progress.findMany({
      where: { student_id: studentId, deadline: { not: null } },
      include: {
        checklist_tasks: {
          select: {
            id: true,
            title: true,
            description: true,
            link_to: true,
            checklist_stages: { select: { name: true } },
          },
        },
      },
      orderBy: { deadline: "asc" },
    }),
    prisma.mentor_custom_deadlines.findMany({
      where: { student_id: studentId },
      orderBy: { deadline: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        mentor_note: true,
        deadline: true,
        status: true,
        student_note: true,
        submission_url: true,
      },
    }),
  ]);

  // For custom tasks, also fetch student_task_progress to get mentor_note
  // saved via the ChecklistTab (which stores in student_task_progress.mentor_note)
  const customIds = customDeadlines.map((c) => c.id);
  const customProgressMap = new Map<
    string,
    { mentor_note: string | null; student_note: string | null; submission_url: string | null }
  >();
  if (customIds.length > 0) {
    const customProgressRows = await prisma.student_task_progress.findMany({
      where: { student_id: studentId, task_id: { in: customIds } },
      select: { task_id: true, mentor_note: true, student_note: true, submission_url: true },
    });
    for (const p of customProgressRows) {
      if (!p.task_id) continue;
      customProgressMap.set(p.task_id, {
        mentor_note: p.mentor_note ?? null,
        student_note: p.student_note ?? null,
        submission_url: p.submission_url ?? null,
      });
    }
  }

  /** Merge two note strings: combine both (non-null) sources with newline */
  function mergeNotes(a: string | null, b: string | null): string | null {
    if (a && b) return `${a}\n${b}`;
    return a ?? b ?? null;
  }

  type UnifiedRow = {
    id: string;
    type: RowType;
    title: string;
    description: string | null;
    stageName?: string | null;
    deadline: string | null;
    status: string;
    mentor_note: string | null;
    student_note: string | null;
    submission_url: string | null;
    deadlineStatus: ReturnType<typeof getDeadlineStatus>;
  };

  const checklistRows: UnifiedRow[] = tasksWithDeadlines
    .filter((t) => t.checklist_tasks && t.deadline)
    .filter((t) => t.checklist_tasks?.link_to !== CUSTOM_TASK_LINK_MARKER)
    .map((t) => {
      const deadlineStatus = getDeadlineStatus(t.deadline!, t.status);
      return {
        id: t.id,
        type: "checklist" as RowType,
        title: t.checklist_tasks!.title,
        description: t.checklist_tasks!.description,
        stageName: t.checklist_tasks!.checklist_stages?.name ?? null,
        deadline: t.deadline!.toISOString(),
        status: t.status,
        mentor_note: t.mentor_note ?? null,
        student_note: t.student_note ?? null,
        submission_url: t.submission_url ?? null,
        deadlineStatus,
      };
    });

  const customRows: UnifiedRow[] = customDeadlines.map((c) => {
    const deadline = c.deadline;
    const deadlineStatus = getCustomDeadlineStatus(deadline);
    const progressData = customProgressMap.get(c.id);
    return {
      id: c.id,
      type: "custom" as RowType,
      title: c.title,
      description: c.description,
      stageName: null,
      deadline: deadline?.toISOString() ?? null,
      status: c.status,
      mentor_note: mergeNotes(c.mentor_note ?? null, progressData?.mentor_note ?? null),
      student_note: mergeNotes(c.student_note ?? null, progressData?.student_note ?? null),
      submission_url: c.submission_url ?? progressData?.submission_url ?? null,
      deadlineStatus,
    };
  });

  const allRows = [...checklistRows, ...customRows].sort((a, b) => {
    if (a.deadlineStatus.priority !== b.deadlineStatus.priority)
      return a.deadlineStatus.priority - b.deadlineStatus.priority;
    const aTime = a.deadline ? new Date(a.deadline).getTime() : 0;
    const bTime = b.deadline ? new Date(b.deadline).getTime() : 0;
    return aTime - bTime;
  });

  const serializableRows = allRows.map((r) => ({
    ...r,
    deadlineStatus: { ...r.deadlineStatus },
  }));

  return (
    <StudentPageContainer noPadding className="min-h-[60vh]">
      <section
        className="relative overflow-hidden text-white"
        style={{
          background:
            "linear-gradient(135deg, var(--primary) 0%, var(--brand-deep) 50%, var(--brand-cyan) 100%)",
        }}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 right-1/4 h-40 w-80 rounded-full bg-[var(--brand-cyan)]/20 blur-2xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="relative px-6 py-8 sm:px-10 sm:py-10">
          <div className="max-w-6xl mx-auto">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60">
              Deadline
            </p>
            <h1 className="mt-2 text-2xl font-bold leading-tight text-white sm:text-3xl md:text-4xl">
              Theo dõi hạn chót
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/70">
              Theo dõi deadline và trao đổi trực tiếp với Cố vấn theo từng nhiệm vụ.
            </p>
          </div>
        </div>
      </section>
      <div className="px-4 pb-12 pt-8 sm:px-6">
        <StudentDeadlinesTable rows={serializableRows} />
      </div>
    </StudentPageContainer>
  );
}
