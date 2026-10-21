import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/mentor/dashboard/urgent-deadlines
 * Các deadline sắp đến hạn (trong 5 ngày tới) hoặc quá hạn (7 ngày gần đây).
 * Bao gồm cả checklist tasks và Cố vấn custom deadlines.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mentorId = session.user.id;

    const assignments = await prisma.mentor_assignments.findMany({
      where: { mentor_id: mentorId, status: 'ACTIVE' },
      select: { student_id: true },
    });

    const studentIds = assignments.map((a) => a.student_id);
    if (studentIds.length === 0) return NextResponse.json([]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const fiveDaysFromNow = new Date();
    fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);
    fiveDaysFromNow.setHours(23, 59, 59, 999);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // ── 1. Tiến độ tasks với deadline ──────────────────────────────────
    const checklistTasks = await prisma.student_task_progress.findMany({
      where: {
        student_id: { in: studentIds },
        deadline: { gte: sevenDaysAgo, lte: fiveDaysFromNow },
        status: { in: ['PENDING', 'IN_PROGRESS', 'NEEDS_REVISION'] },
      },
      include: {
        checklist_tasks: { select: { id: true, title: true } },
        students: {
          select: { user_id: true, users: { select: { full_name: true } } },
        },
      },
      orderBy: { deadline: 'asc' },
      take: 15,
    });

    // ── 2. Custom deadlines do Cố vấn tạo ────────────────────────────────
    const customDeadlines = await prisma.mentor_custom_deadlines.findMany({
      where: {
        student_id: { in: studentIds },
        mentor_id: mentorId,
        deadline: { gte: sevenDaysAgo, lte: fiveDaysFromNow },
        status: { in: ['PENDING', 'IN_PROGRESS', 'NEEDS_REVISION'] },
      },
      include: {
        students: {
          select: { user_id: true, users: { select: { full_name: true } } },
        },
      },
      orderBy: { deadline: 'asc' },
      take: 15,
    });

    const calcDays = (deadline: Date) => {
      const d = new Date(deadline);
      d.setHours(0, 0, 0, 0);
      return Math.ceil((d.getTime() - today.getTime()) / 86400000);
    };

    const checklistRows = checklistTasks
      .filter((t) => t.checklist_tasks && t.deadline)
      .map((t) => ({
        id: t.id,
        render_id: `checklist-${t.id}`,
        type: 'checklist' as const,
        task_title: t.checklist_tasks!.title,
        student_name: t.students.users?.full_name ?? '—',
        student_id: t.student_id,
        deadline: t.deadline!.toISOString(),
        status: t.status,
        days_remaining: calcDays(t.deadline!),
      }));

    const customRows = customDeadlines
      .filter((c) => c.deadline)
      .map((c) => ({
        id: c.id,
        render_id: `custom-${c.id}`,
        type: 'custom' as const,
        task_title: c.title,
        student_name: c.students.users?.full_name ?? '—',
        student_id: c.student_id,
        deadline: c.deadline!.toISOString(),
        status: c.status,
        days_remaining: calcDays(c.deadline!),
      }));

    const all = [...checklistRows, ...customRows].sort(
      (a, b) => a.days_remaining - b.days_remaining
    );

    // Loại bỏ bản ghi trùng hiển thị (thường do checklist và custom cùng nội dung).
    const deduped = all.filter((item, index, arr) => {
      const normalizedDate = new Date(item.deadline).toISOString().slice(0, 10);
      const key = `${item.student_id}|${item.task_title.trim().toLowerCase()}|${normalizedDate}`;
      return index === arr.findIndex((candidate) => {
        const candidateDate = new Date(candidate.deadline).toISOString().slice(0, 10);
        const candidateKey = `${candidate.student_id}|${candidate.task_title.trim().toLowerCase()}|${candidateDate}`;
        return candidateKey === key;
      });
    });

    return NextResponse.json(deduped);
  } catch (error) {
    console.error('Error fetching urgent deadlines:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
