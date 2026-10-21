import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { prisma } from '@/lib/prisma';
import { requirePremium } from '@/lib/api/require-premium';
import { tryDeleteStudentSubmissionFilesFromUrls } from '@/lib/s3-storage';
import { TaskStatus } from '@prisma/client';

const ALLOWED_STUDENT_STATUS = 'SUBMITTED' as const;

function normalizeSubmissionUrl(raw: unknown): string | undefined {
  if (raw == null) return undefined;
  if (typeof raw !== 'string') return undefined;
  const s = raw.trim();
  if (!s) return undefined;
  if (!/^https?:\/\//i.test(s)) return undefined;
  return s;
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

/**
 * PATCH /api/students/me/deadlines/custom/[id]
 * Học viên cập nhật ghi chú và/hoặc chuyển trạng thái sang Chờ review (SUBMITTED): Premium only
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const forbidden = await requirePremium(request);
    if (forbidden) return forbidden;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const studentId = session.user.id;
    const { id: recordId } = await params;

    const body = await request.json().catch(() => ({}));
    const student_note =
      body.student_note == null
        ? null
        : typeof body.student_note === 'string'
          ? body.student_note.trim() || null
          : undefined;
    const studentNoteMode = body?.student_note_mode === 'replace' ? 'replace' : 'append';
    const status = body.status === ALLOWED_STUDENT_STATUS ? ALLOWED_STUDENT_STATUS : undefined;
    const hasSubmissionUrlKey = Object.prototype.hasOwnProperty.call(body, 'submission_url');
    const submission_url = normalizeSubmissionUrl(body.submission_url);

    const record = await prisma.mentor_custom_deadlines.findFirst({
      where: { id: recordId, student_id: studentId },
    });
    if (!record) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const data: {
      student_note?: string | null;
      status?: typeof ALLOWED_STUDENT_STATUS;
      submission_url?: string | null;
    } = {};
    if (student_note !== undefined) {
      data.student_note =
        studentNoteMode === 'replace'
          ? student_note
          : appendFeedbackEntry(record.student_note, student_note, 'STUDENT');
    }
    if (status !== undefined) {
      data.status = status;
      if (hasSubmissionUrlKey) {
        data.submission_url = submission_url ?? null;
      }
    } else if (hasSubmissionUrlKey) {
      data.submission_url = submission_url ?? null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'Không có thay đổi hợp lệ' },
        { status: 400 },
      );
    }

    if (hasSubmissionUrlKey) {
      const nextStored = submission_url ?? null;
      const progressRow = await prisma.student_task_progress.findUnique({
        where: {
          student_id_task_id: {
            student_id: studentId,
            task_id: recordId,
          },
        },
        select: { submission_url: true },
      });
      const candidates = [record.submission_url, progressRow?.submission_url].filter(
        Boolean,
      ) as string[];
      const toDelete = [...new Set(candidates.filter((u) => !nextStored || u !== nextStored))];
      if (toDelete.length > 0) {
        await tryDeleteStudentSubmissionFilesFromUrls(studentId, toDelete);
      }
    }

    const updated = await prisma.mentor_custom_deadlines.update({
      where: { id: recordId },
      data,
    });

    if (status === ALLOWED_STUDENT_STATUS) {
      await prisma.student_task_progress.upsert({
        where: {
          student_id_task_id: {
            student_id: studentId,
            task_id: recordId,
          },
        },
        update: {
          status: TaskStatus.SUBMITTED,
          ...(hasSubmissionUrlKey ? { submission_url: submission_url ?? null } : {}),
          updated_at: new Date(),
        },
        create: {
          id: randomUUID(),
          student_id: studentId,
          task_id: recordId,
          status: TaskStatus.SUBMITTED,
          submission_url: hasSubmissionUrlKey ? submission_url ?? null : null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
    } else if (hasSubmissionUrlKey) {
      await prisma.student_task_progress.upsert({
        where: {
          student_id_task_id: {
            student_id: studentId,
            task_id: recordId,
          },
        },
        update: {
          submission_url: submission_url ?? null,
          updated_at: new Date(),
        },
        create: {
          id: randomUUID(),
          student_id: studentId,
          task_id: recordId,
          status: updated.status,
          submission_url: submission_url ?? null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
    }

    return NextResponse.json({
      id: updated.id,
      student_note: updated.student_note ?? null,
      status: updated.status,
      submission_url: updated.submission_url ?? null,
    });
  } catch (e) {
    console.error('PATCH custom deadline:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
