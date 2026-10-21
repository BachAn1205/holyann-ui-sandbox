import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-config";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarDays, Users } from "lucide-react";
import MentorDeadlinesTable, {
  type MentorDeadlineRow,
} from "@/components/mentor/deadlines/MentorDeadlinesTable";

const CUSTOM_TASK_LINK_MARKER = "__CUSTOM_TASK__";

const STAGE_LABEL_BY_ORDER: Record<number, string> = {
  1: "Giai đoạn 1: Khởi động",
  2: "Giai đoạn 2: Phát triển",
  3: "Giai đoạn 3: Về đích",
};

function toStageLabel(stageOrder?: number | null, fallback?: string | null) {
  if (stageOrder != null && STAGE_LABEL_BY_ORDER[stageOrder]) {
    return STAGE_LABEL_BY_ORDER[stageOrder];
  }
  return fallback ?? null;
}

/** Cùng logic trang học viên — có tính trạng thái hoàn thành / chờ review. */
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
      label: "—",
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

export default async function MentorDeadlinesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const mentorId = session.user.id;

  const assignments = await prisma.mentor_assignments.findMany({
    where: {
      mentor_id: mentorId,
      status: "ACTIVE",
    },
    select: {
      student_id: true,
    },
  });

  const studentIds = assignments.map((a) => a.student_id);

  if (studentIds.length === 0) {
    return (
      <div className="min-h-[60vh] bg-background">
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
            <div className="mx-auto max-w-6xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60">
                Deadline
              </p>
              <h1 className="mt-2 text-2xl font-bold leading-tight text-white sm:text-3xl md:text-4xl">
                Quản lý hạn chót
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/70">
                Theo dõi deadline và trao đổi với học viên — cùng giao diện với trang học viên.
              </p>
            </div>
          </div>
        </section>
        <div className="space-y-4 px-4 pb-6 pt-6 sm:px-6">
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16 text-center shadow-sm">
            <div
              className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl text-white shadow-md"
              style={{
                background: "linear-gradient(135deg, #0052FF, #4D7CFF)",
                boxShadow: "0 4px 14px rgba(0, 82, 255, 0.25)",
              }}
            >
              <Users className="h-7 w-7" />
            </div>
            <p className="font-medium text-foreground">Chưa có học viên</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Bạn chưa được phân công quản lý học viên nào.
            </p>
          </div>
        </div>
      </div>
    );
  }

  type CustomDeadlineDb = {
    id: string;
    title: string;
    description: string | null;
    student_id: string;
    stage: string | null;
    stage_order: number | null;
    deadline: Date | null;
    status: string;
    mentor_note: string | null;
    student_note: string | null;
    submission_url: string | null;
    students: {
      user_id: string;
      users: { full_name: string | null; email: string | null } | null;
    };
  };

  const [tasksWithDeadlines, customDeadlines] = await Promise.all([
    prisma.student_task_progress.findMany({
      where: {
        student_id: { in: studentIds },
        deadline: { not: null },
      },
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
        students: {
          select: {
            user_id: true,
            users: { select: { full_name: true, email: true } },
          },
        },
      },
      orderBy: { deadline: "asc" },
    }),
    prisma.mentor_custom_deadlines.findMany({
      where: {
        mentor_id: mentorId,
        student_id: { in: studentIds },
      },
      include: {
        students: {
          select: {
            user_id: true,
            users: { select: { full_name: true, email: true } },
          },
        },
      },
      orderBy: [{ deadline: "asc" }, { created_at: "desc" }],
    }),
  ]);

  type TaskRow = (typeof tasksWithDeadlines)[0];

  const checklistRows: MentorDeadlineRow[] = tasksWithDeadlines
    .filter((t: TaskRow): t is TaskRow => !!t.checklist_tasks && !!t.deadline)
    .filter((t: TaskRow) => t.checklist_tasks?.link_to !== CUSTOM_TASK_LINK_MARKER)
    .map((t: TaskRow) => {
      const deadlineStatus = getDeadlineStatus(t.deadline!, t.status);
      return {
        id: t.id,
        type: "checklist" as const,
        student_id: t.student_id,
        studentName: t.students?.users?.full_name || "Không rõ",
        studentEmail: t.students?.users?.email ?? null,
        title: t.checklist_tasks!.title,
        description: t.checklist_tasks!.description ?? null,
        stageName: t.checklist_tasks!.checklist_stages?.name ?? null,
        status: t.status,
        mentor_note: t.mentor_note ?? null,
        student_note: t.student_note ?? null,
        deadlineStatus,
        deadlineIso: t.deadline!.toISOString(),
        submissionUrl: t.submission_url ?? null,
      };
    });

  const customRows: MentorDeadlineRow[] = customDeadlines.map((c: CustomDeadlineDb) => {
    const deadline = c.deadline;
    const deadlineStatus = getCustomDeadlineStatus(deadline);
    return {
      id: c.id,
      type: "custom" as const,
      student_id: c.student_id,
      studentName: c.students?.users?.full_name || "Không rõ",
      studentEmail: c.students?.users?.email ?? null,
      title: c.title,
      description: c.description,
      stageName: toStageLabel(c.stage_order, c.stage),
      status: c.status,
      mentor_note: c.mentor_note ?? null,
      student_note: c.student_note ?? null,
      deadlineStatus,
      stageOrder: c.stage_order,
      deadlineIso: deadline?.toISOString() ?? null,
      submissionUrl: c.submission_url ?? null,
    };
  });

  const allRows = [...checklistRows, ...customRows].sort((a, b) => {
    if (a.deadlineStatus.priority !== b.deadlineStatus.priority) {
      return a.deadlineStatus.priority - b.deadlineStatus.priority;
    }
    const aTime = a.deadlineIso ? new Date(a.deadlineIso).getTime() : 0;
    const bTime = b.deadlineIso ? new Date(b.deadlineIso).getTime() : 0;
    return aTime - bTime;
  });

  const serializableRows = allRows.map((r) => ({
    ...r,
    deadlineStatus: { ...r.deadlineStatus },
  }));

  return (
    <div className="min-h-[60vh] bg-background">
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
          <div className="mx-auto max-w-6xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60">
              Deadline
            </p>
            <h1 className="mt-2 text-2xl font-bold leading-tight text-white sm:text-3xl md:text-4xl">
              Quản lý hạn chót
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/70">
              Theo dõi deadline của học viên được phân công — mở rộng dòng để chat feedback
              giống trang học viên.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm">
              <Link
                href="/mentor/students"
                className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/25"
              >
                <Users className="h-4 w-4" />
                Danh sách học viên
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-4 px-4 pb-6 pt-6 sm:px-6">
        <MentorDeadlinesTable rows={serializableRows} />
      </div>
    </div>
  );
}
