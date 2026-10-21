import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { prisma } from '@/lib/prisma';

const CUSTOM_TASK_ORDER_BASE = 9000;
const CUSTOM_TASK_LINK_MARKER = '__CUSTOM_TASK__';

type CustomPriority = 'LOW' | 'MEDIUM' | 'HIGH';

function normalizeRole(role?: string | null) {
  return role?.toString().trim().toUpperCase() ?? '';
}

function parsePriority(value: unknown): CustomPriority | null {
  if (value == null || value === '') return 'MEDIUM';
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  if (normalized === 'LOW' || normalized === 'MEDIUM' || normalized === 'HIGH') {
    return normalized;
  }
  return null;
}

function extractStageOrder(stageText: string | null | undefined) {
  if (!stageText) return null;
  const match = stageText.match(/giai\s*doan\s*(\d+)/i);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

async function resolveStage(stageOrder: number) {
  const stages = await prisma.checklist_stages.findMany({
    orderBy: { order_index: 'asc' },
    select: { id: true, name: true, order_index: true },
  });

  if (!stages.length) return null;

  return (
    stages.find((s) => s.order_index === stageOrder) ??
    stages[0]
  );
}

async function ensureMentorAccess(mentorId: string, studentId: string) {
  const assignment = await prisma.mentor_assignments.findFirst({
    where: { mentor_id: mentorId, student_id: studentId },
  });
  if (!assignment) return null;
  return assignment;
}

async function ensureCustomDeadlineAccess(actorId: string, actorRole: string, studentId: string) {
  if (actorRole === 'ADMIN') {
    const assignment = await prisma.mentor_assignments.findFirst({
      where: { student_id: studentId, status: 'ACTIVE' },
      orderBy: { assigned_at: 'desc' },
      select: { mentor_id: true },
    });

    return {
      isAdmin: true,
      mentorIdForWrite: assignment?.mentor_id ?? null,
    };
  }

  const assignment = await ensureMentorAccess(actorId, studentId);
  if (!assignment) return null;

  return {
    isAdmin: false,
    mentorIdForWrite: actorId,
  };
}

/**
 * GET /api/mentor/students/[studentId]/custom-deadlines
 * Danh sách custom deadlines do Cố vấn tạo cho học viên
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
    const actorRole = normalizeRole(session.user.role);
    const access = await ensureCustomDeadlineAccess(session.user.id, actorRole, studentId);
    if (!access) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const list = await prisma.mentor_custom_deadlines.findMany({
      where: access.isAdmin
        ? { student_id: studentId }
        : { student_id: studentId, mentor_id: session.user.id },
      orderBy: [{ deadline: 'asc' }, { created_at: 'desc' }],
    });

    const taskIds = list.map((r) => r.id);
    const progressList = taskIds.length
      ? await prisma.student_task_progress.findMany({
          where: {
            student_id: studentId,
            task_id: { in: taskIds },
          },
          select: {
            task_id: true,
            submission_url: true,
            status: true,
            deadline: true,
            mentor_note: true,
            student_note: true,
            completed_at: true,
            updated_at: true,
          },
        })
      : [];

    const progressByTaskId = new Map(progressList.map((p) => [p.task_id, p]));

    const data = list.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description ?? null,
      priority: row.priority,
      stage: row.stage ?? 'Giai đoạn 1: Khởi động',
      stage_order: row.stage_order ?? extractStageOrder(row.stage) ?? 1,
      mentor_note: progressByTaskId.get(row.id)?.mentor_note ?? row.mentor_note ?? null,
      student_note: progressByTaskId.get(row.id)?.student_note ?? row.student_note ?? null,
      submission_url:
        progressByTaskId.get(row.id)?.submission_url ?? row.submission_url ?? null,
      deadline: progressByTaskId.get(row.id)?.deadline?.toISOString() ?? row.deadline?.toISOString() ?? null,
      status: progressByTaskId.get(row.id)?.status ?? row.status,
      created_at: row.created_at.toISOString(),
      updated_at: (progressByTaskId.get(row.id)?.updated_at ?? row.updated_at).toISOString(),
      completed_at:
        progressByTaskId.get(row.id)?.completed_at?.toISOString() ??
        (row.status === 'COMPLETED' ? row.updated_at.toISOString() : null),
    }));

    return NextResponse.json(data);
  } catch (e) {
    console.error('GET custom-deadlines:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/mentor/students/[studentId]/custom-deadlines
 * Tạo custom deadline mới
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { studentId } = await params;
    const actorRole = normalizeRole(session.user.role);
    const access = await ensureCustomDeadlineAccess(session.user.id, actorRole, studentId);
    if (!access) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const mentorIdForWrite = access.mentorIdForWrite;
    if (!mentorIdForWrite) {
      return NextResponse.json(
        { error: 'Học viên chưa có Cố vấn được gán, chưa thể tạo deadline tùy chỉnh.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }
    const description =
      typeof body.description === 'string' ? body.description.trim() || null : null;
    const stage =
      typeof body.stage === 'string' ? body.stage.trim() || 'Giai đoạn 1: Khởi động' : 'Giai đoạn 1: Khởi động';
    const stageOrderFromBody =
      typeof body.stage_order === 'number' && Number.isFinite(body.stage_order)
        ? Math.max(1, Math.floor(body.stage_order))
        : null;
    const stage_order = stageOrderFromBody ?? extractStageOrder(stage) ?? 1;
    const priority = parsePriority(body.priority);
    if (!priority) {
      return NextResponse.json({ error: 'priority must be LOW, MEDIUM or HIGH' }, { status: 400 });
    }
    const deadline =
      body.deadline != null && body.deadline !== ''
        ? new Date(body.deadline)
        : null;
    if (deadline != null && isNaN(deadline.getTime())) {
      return NextResponse.json({ error: 'Invalid deadline date' }, { status: 400 });
    }

    const resolvedStage = await resolveStage(stage_order);
    if (!resolvedStage) {
      return NextResponse.json({ error: 'Tiến độ stages not found' }, { status: 400 });
    }

    const id = randomUUID();
    const now = new Date();

    const created = await prisma.$transaction(async (tx) => {
      const createdCustom = await tx.mentor_custom_deadlines.create({
        data: {
          id,
          student_id: studentId,
          mentor_id: mentorIdForWrite,
          title,
          description,
          priority,
          stage: stage || resolvedStage.name,
          stage_order: resolvedStage.order_index,
          deadline,
          status: 'PENDING',
          updated_at: now,
        },
      });

      const lastOrderInStage = await tx.checklist_tasks.findFirst({
        where: { stage_id: resolvedStage.id },
        orderBy: { order_index: 'desc' },
        select: { order_index: true },
      });

      const nextOrder = Math.max(CUSTOM_TASK_ORDER_BASE, (lastOrderInStage?.order_index ?? 0) + 1);

      await tx.checklist_tasks.create({
        data: {
          id,
          stage_id: resolvedStage.id,
          title,
          description,
          link_to: CUSTOM_TASK_LINK_MARKER,
          is_required: false,
          order_index: nextOrder,
          created_at: now,
          updated_at: now,
        },
      });

      await tx.student_task_progress.upsert({
        where: {
          student_id_task_id: {
            student_id: studentId,
            task_id: id,
          },
        },
        create: {
          id: randomUUID(),
          student_id: studentId,
          task_id: id,
          status: 'PENDING',
          deadline,
          mentor_note: null,
          student_note: null,
          created_at: now,
          updated_at: now,
        },
        update: {
          deadline,
          status: 'PENDING',
          updated_at: now,
        },
      });

      return createdCustom;
    });

    return NextResponse.json({
      id: created.id,
      title: created.title,
      description: created.description ?? null,
      priority: created.priority,
      stage: created.stage ?? 'Giai đoạn 1: Khởi động',
      stage_order: created.stage_order ?? extractStageOrder(created.stage) ?? 1,
      mentor_note: created.mentor_note ?? null,
      student_note: created.student_note ?? null,
      deadline: created.deadline?.toISOString() ?? null,
      status: created.status,
      created_at: created.created_at.toISOString(),
      updated_at: created.updated_at.toISOString(),
    });
  } catch (e: any) {
    console.error('POST custom-deadlines:', e);
    return NextResponse.json({ error: 'Internal server error', details: e?.message }, { status: 500 });
  }
}
