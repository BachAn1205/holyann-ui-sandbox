import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { prisma } from '@/lib/prisma';

async function ensureMentorAccess(mentorId: string, studentId: string) {
  return prisma.mentor_assignments.findFirst({
    where: { mentor_id: mentorId, student_id: studentId },
  });
}

/**
 * GET /api/mentor/students/[studentId]/deadlines
 * Trả về toàn bộ deadline của học viên — gồm:
 *   - Tiến độ tasks có deadline (student_task_progress)
 *   - Custom deadlines do Cố vấn tạo (mentor_custom_deadlines)
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId } = await params;

    const access = await ensureMentorAccess(session.user.id, studentId);
    if (!access) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [checklistTasks, customDeadlines] = await Promise.all([
      // Tasks từ checklist có deadline
      prisma.student_task_progress.findMany({
        where: { student_id: studentId, deadline: { not: null } },
        include: {
          checklist_tasks: {
            select: {
              id: true,
              title: true,
              description: true,
              checklist_stages: { select: { name: true } },
            },
          },
        },
        orderBy: { deadline: 'asc' },
      }),
      // Custom deadlines do Cố vấn tạo
      prisma.mentor_custom_deadlines.findMany({
        where: { student_id: studentId },
        orderBy: [{ deadline: 'asc' }, { created_at: 'desc' }],
      }),
    ]);

    const checklistRows = checklistTasks
      .filter((t) => t.checklist_tasks && t.deadline)
      .map((t) => ({
        id: t.id,
        type: 'checklist' as const,
        title: t.checklist_tasks!.title,
        description: t.checklist_tasks!.description ?? null,
        stage_name: t.checklist_tasks!.checklist_stages?.name ?? null,
        deadline: t.deadline!.toISOString(),
        status: t.status,
        mentor_note: t.mentor_note ?? null,
        student_note: t.student_note ?? null,
        submission_url: t.submission_url ?? null,
      }));

    const customRows = customDeadlines.map((c) => ({
      id: c.id,
      type: 'custom' as const,
      title: c.title,
      description: c.description ?? null,
      stage_name: null,
      deadline: c.deadline?.toISOString() ?? null,
      status: c.status,
      mentor_note: c.mentor_note ?? null,
      student_note: c.student_note ?? null,
      submission_url: null,
    }));

    return NextResponse.json({
      checklist: checklistRows,
      custom: customRows,
      all: [...checklistRows, ...customRows].sort((a, b) => {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }),
    });
  } catch (e) {
    console.error('[mentor deadlines] GET', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
