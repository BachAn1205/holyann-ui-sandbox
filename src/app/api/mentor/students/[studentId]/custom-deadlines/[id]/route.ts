import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { prisma } from '@/lib/prisma';
import { tryDeleteStudentSubmissionFilesFromUrls } from '@/lib/s3-storage';

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

function appendFeedbackEntry(existing: string | null, message: string | null, author: 'MENTOR' | 'STUDENT') {
  if (!message) return existing ?? null;
  const now = new Date();
  const stamp = now.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const label = author === 'MENTOR' ? 'Mentor' : 'Học viên';
  const entry = `[${stamp}] ${label}: ${message}`;
  return existing ? `${entry}\n${existing}` : entry;
}

async function ensureCustomDeadlineOwnership(
  actorId: string,
  actorRole: string,
  studentId: string,
  recordId: string
) {
  const record = await prisma.mentor_custom_deadlines.findUnique({
    where: { id: recordId },
  });
  if (!record || record.student_id !== studentId) return null;
  if (actorRole !== 'ADMIN' && record.mentor_id !== actorId) return null;
  return record;
}

/**
 * PATCH /api/mentor/students/[studentId]/custom-deadlines/[id]
 * Cập nhật custom deadline (title, description, deadline, status)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ studentId: string; id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const actorRole = normalizeRole(session.user.role);
    const { studentId, id: recordId } = await params;
    const existing = await ensureCustomDeadlineOwnership(session.user.id, actorRole, studentId, recordId);
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await request.json();
    const data: {
      title?: string;
      description?: string | null;
      mentor_note?: string | null;
      student_note?: string | null;
      deadline?: Date | null;
      stage?: string | null;
      stage_order?: number | null;
      priority?: CustomPriority;
      status?: 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'COMPLETED' | 'NEEDS_REVISION';
    } = {};

    if (typeof body.title === 'string') {
      const t = body.title.trim();
      if (t) data.title = t;
    }
    if (body.description !== undefined) {
      data.description = typeof body.description === 'string' ? body.description.trim() || null : null;
    }
    if (body.mentor_note !== undefined) {
      const note = typeof body.mentor_note === 'string' ? body.mentor_note.trim() || null : null;
      if (body.mentor_note_mode === 'replace') {
        data.mentor_note = note;
      } else {
        data.mentor_note = appendFeedbackEntry(existing.mentor_note, note, 'MENTOR');
      }
    }
    if (body.student_note !== undefined) {
      const note = typeof body.student_note === 'string' ? body.student_note.trim() || null : null;
      data.student_note = appendFeedbackEntry(existing.student_note, note, 'STUDENT');
    }
    if (body.deadline !== undefined) {
      data.deadline = body.deadline == null || body.deadline === '' ? null : new Date(body.deadline);
      if (data.deadline != null && isNaN(data.deadline.getTime())) {
        return NextResponse.json({ error: 'Invalid deadline date' }, { status: 400 });
      }
    }
    if (body.stage !== undefined) {
      data.stage = typeof body.stage === 'string' ? body.stage.trim() || null : null;
    }
    if (body.stage_order !== undefined) {
      const parsed = Number(body.stage_order);
      if (Number.isFinite(parsed) && parsed > 0) {
        data.stage_order = Math.floor(parsed);
      }
    }
    if (body.priority !== undefined) {
      const parsedPriority = parsePriority(body.priority);
      if (!parsedPriority) {
        return NextResponse.json({ error: 'priority must be LOW, MEDIUM or HIGH' }, { status: 400 });
      }
      data.priority = parsedPriority;
    }
    if (['PENDING', 'IN_PROGRESS', 'SUBMITTED', 'COMPLETED', 'NEEDS_REVISION'].includes(body.status)) {
      data.status = body.status;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const stageOrder = data.stage_order ?? extractStageOrder(data.stage ?? existing.stage) ?? existing.stage_order;
      const stages = await tx.checklist_stages.findMany({
        orderBy: { order_index: 'asc' },
        select: { id: true, name: true, order_index: true },
      });
      const resolvedStage =
        (stageOrder == null
          ? stages[0]
          : stages.find((s) => s.order_index === stageOrder) ?? stages[0]) ?? null;

      if (!resolvedStage) {
        throw new Error('Tiến độ stages not found');
      }

      const updatedCustom = await tx.mentor_custom_deadlines.update({
        where: { id: recordId },
        data: {
          ...data,
          stage_order: resolvedStage?.order_index ?? stageOrder ?? existing.stage_order,
          stage: data.stage ?? existing.stage,
          updated_at: new Date(),
        },
      });

      const checklistUpdateData: {
        title?: string;
        description?: string | null;
        link_to?: string;
        stage_id?: number;
        order_index?: number;
        updated_at: Date;
      } = { updated_at: new Date() };

      if (data.title !== undefined) checklistUpdateData.title = data.title;
      if (data.description !== undefined) checklistUpdateData.description = data.description;
      checklistUpdateData.stage_id = resolvedStage.id;
      checklistUpdateData.link_to = CUSTOM_TASK_LINK_MARKER;
      const lastOrder = await tx.checklist_tasks.findFirst({
        where: { stage_id: resolvedStage.id },
        orderBy: { order_index: 'desc' },
        select: { order_index: true },
      });
      checklistUpdateData.order_index = Math.max(CUSTOM_TASK_ORDER_BASE, lastOrder?.order_index ?? CUSTOM_TASK_ORDER_BASE);

      await tx.checklist_tasks.upsert({
        where: { id: recordId },
        create: {
          id: recordId,
          stage_id: checklistUpdateData.stage_id ?? resolvedStage.id,
          title: checklistUpdateData.title ?? updatedCustom.title,
          description: checklistUpdateData.description ?? updatedCustom.description,
          link_to: CUSTOM_TASK_LINK_MARKER,
          is_required: false,
          order_index: checklistUpdateData.order_index ?? CUSTOM_TASK_ORDER_BASE,
          created_at: new Date(),
          updated_at: new Date(),
        },
        update: checklistUpdateData,
      });

      await tx.student_task_progress.upsert({
        where: {
          student_id_task_id: {
            student_id: studentId,
            task_id: recordId,
          },
        },
        create: {
          id: crypto.randomUUID(),
          student_id: studentId,
          task_id: recordId,
          status: updatedCustom.status,
          mentor_note: updatedCustom.mentor_note,
          student_note: updatedCustom.student_note,
          deadline: updatedCustom.deadline,
          completed_at: updatedCustom.status === 'COMPLETED' ? new Date() : null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        update: {
          status: updatedCustom.status,
          mentor_note: updatedCustom.mentor_note,
          student_note: updatedCustom.student_note,
          deadline: updatedCustom.deadline,
          completed_at: updatedCustom.status === 'COMPLETED' ? new Date() : null,
          updated_at: new Date(),
        },
      });

      return updatedCustom;
    });

    return NextResponse.json({
      id: updated.id,
      title: updated.title,
      description: updated.description ?? null,
      priority: updated.priority,
      mentor_note: updated.mentor_note ?? null,
      student_note: updated.student_note ?? null,
      deadline: updated.deadline?.toISOString() ?? null,
      status: updated.status,
      stage: updated.stage ?? null,
      stage_order: updated.stage_order ?? null,
      created_at: updated.created_at.toISOString(),
      updated_at: updated.updated_at.toISOString(),
    });
  } catch (e: any) {
    console.error('PATCH custom-deadlines:', e);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: e?.message,
        code: e?.code,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/mentor/students/[studentId]/custom-deadlines/[id]
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ studentId: string; id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const actorRole = normalizeRole(session.user.role);
    const { studentId, id: recordId } = await params;
    const existing = await ensureCustomDeadlineOwnership(session.user.id, actorRole, studentId, recordId);
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const [customRow, progressRows] = await Promise.all([
      prisma.mentor_custom_deadlines.findFirst({
        where: { id: recordId, student_id: studentId },
        select: { submission_url: true },
      }),
      prisma.student_task_progress.findMany({
        where: { student_id: studentId, task_id: recordId },
        select: { submission_url: true },
      }),
    ]);
    const urls = [
      customRow?.submission_url,
      ...progressRows.map((p) => p.submission_url),
    ];
    await tryDeleteStudentSubmissionFilesFromUrls(studentId, urls);

    await prisma.$transaction(async (tx) => {
      await tx.mentor_custom_deadlines.delete({ where: { id: recordId } });
      await tx.student_task_progress.deleteMany({
        where: {
          student_id: studentId,
          task_id: recordId,
        },
      });
      await tx.checklist_tasks.deleteMany({ where: { id: recordId } });
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('DELETE custom-deadlines:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
