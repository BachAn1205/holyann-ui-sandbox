import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { prisma } from '@/lib/prisma';

const CUSTOM_TASK_LINK_MARKER = '__CUSTOM_TASK__';

/**
 * GET /api/students/me/deadlines
 * Returns all deadline rows for the current student (checklist + custom).
 * Used by client to re-sync after mutations without a full page reload.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
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
        orderBy: { deadline: 'asc' },
      }),
      prisma.mentor_custom_deadlines.findMany({
        where: { student_id: studentId },
        orderBy: { deadline: 'asc' },
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

    const checklistRows = tasksWithDeadlines
      .filter((t) => t.checklist_tasks && t.deadline)
      .filter((t) => t.checklist_tasks?.link_to !== CUSTOM_TASK_LINK_MARKER)
      .map((t) => ({
        id: t.id,
        type: 'checklist' as const,
        title: t.checklist_tasks!.title,
        description: t.checklist_tasks!.description,
        stageName: t.checklist_tasks!.checklist_stages?.name ?? null,
        deadline: t.deadline!.toISOString(),
        status: t.status,
        mentor_note: t.mentor_note ?? null,
        student_note: t.student_note ?? null,
        submission_url: t.submission_url ?? null,
      }));

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

    function mergeNotes(a: string | null, b: string | null): string | null {
      if (a && b) return `${a}\n${b}`;
      return a ?? b ?? null;
    }

    const customRows = customDeadlines.map((c) => {
      const progressData = customProgressMap.get(c.id);
      return {
        id: c.id,
        type: 'custom' as const,
        title: c.title,
        description: c.description,
        stageName: null,
        deadline: c.deadline?.toISOString() ?? null,
        status: c.status,
        mentor_note: mergeNotes(c.mentor_note ?? null, progressData?.mentor_note ?? null),
        student_note: mergeNotes(c.student_note ?? null, progressData?.student_note ?? null),
        submission_url: c.submission_url ?? progressData?.submission_url ?? null,
      };
    });

    return NextResponse.json({ rows: [...checklistRows, ...customRows] });
  } catch (e) {
    console.error('GET /api/students/me/deadlines:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
