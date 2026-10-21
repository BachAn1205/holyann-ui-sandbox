import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { prisma } from '@/lib/prisma';
import { requirePremium } from '@/lib/api/require-premium';
import { tryDeleteStudentSubmissionFilesFromUrls } from '@/lib/s3-storage';
import crypto from 'crypto';

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
 * PATCH /api/students/me/deadlines/checklist/[progressId]
 * Học viên cập nhật ghi chú và/hoặc nộp review: Premium only
 * progressId hỗ trợ cả progress.id hoặc task.id (fallback tạo điều kiện nhắn feedback sớm)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ progressId: string }> }
) {
  try {
    const forbidden = await requirePremium(request);
    if (forbidden) return forbidden;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const studentId = session.user.id;
    const { progressId } = await params;

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

    let progress = await prisma.student_task_progress.findFirst({
      where: {
        student_id: studentId,
        OR: [{ id: progressId }, { task_id: progressId }],
      },
    });

    if (!progress) {
      const taskExists = await prisma.checklist_tasks.findUnique({
        where: { id: progressId },
        select: { id: true },
      });
      if (!taskExists) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      progress = await prisma.student_task_progress.create({
        data: {
          id: crypto.randomUUID(),
          student_id: studentId,
          task_id: progressId,
          status: status ?? 'PENDING',
          submission_url: hasSubmissionUrlKey ? submission_url ?? null : null,
          student_note:
            student_note !== undefined
              ? appendFeedbackEntry(null, student_note, 'STUDENT')
              : null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      return NextResponse.json({
        id: progress.id,
        student_note: progress.student_note ?? null,
        status: progress.status,
        submission_url: progress.submission_url ?? null,
      });
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
          : appendFeedbackEntry(progress.student_note, student_note, 'STUDENT');
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

    if (hasSubmissionUrlKey && progress.submission_url) {
      const nextStored = submission_url ?? null;
      if (!nextStored || nextStored !== progress.submission_url) {
        await tryDeleteStudentSubmissionFilesFromUrls(studentId, [progress.submission_url]);
      }
    }

    const updated = await prisma.student_task_progress.update({
      where: { id: progress.id },
      data,
    });

    return NextResponse.json({
      id: updated.id,
      student_note: updated.student_note ?? null,
      status: updated.status,
      submission_url: updated.submission_url ?? null,
    });
  } catch (e) {
    console.error('PATCH tiến đọ deadline:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
