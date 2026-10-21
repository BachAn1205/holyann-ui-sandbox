/**
 * GET /api/students/[student_id]/manage-upload/cv-documents: List CV documents by slot (from DB).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { prisma } from '@/lib/prisma';
import type { SubscriptionPlan } from '@/lib/api/require-premium';
import { getMaxCvUploadSlots } from '@/lib/cv-upload-slots';

function normalizePlan(raw: string | null | undefined): SubscriptionPlan {
  const upper = (raw ?? 'FREE').toString().trim().toUpperCase();
  if (['FREE', 'PLUS', 'PREMIUM'].includes(upper)) return upper as SubscriptionPlan;
  return 'FREE';
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ student_id: string }> }
) {
  try {
    const { student_id: studentId } = await context.params;
    const session = await getServerSession(authOptions);
    const sessionUserId = (session?.user as { id?: string })?.id ?? (session?.user as { user_id?: string })?.user_id;
    if (!sessionUserId || String(sessionUserId) !== String(studentId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { id: studentId },
      select: { subscription_plan: true },
    });
    const plan = normalizePlan(user?.subscription_plan as string);
    const maxSlots = getMaxCvUploadSlots(plan);

    // Không dùng `select` từng field — tránh lỗi "Unknown field storage_path" khi process
    // vẫn giữ PrismaClient cũ (trước `prisma generate`) cho tới khi restart `npm run dev`.
    const documents = await prisma.student_cv_documents.findMany({
      where: { student_id: studentId },
      orderBy: { slot_index: 'asc' },
    });

    return NextResponse.json({
      documents,
      maxSlots,
      plan,
    });
  } catch (e) {
    console.error('[manage-upload/cv-documents] GET', e);
    return NextResponse.json({ error: 'Lỗi tải danh sách CV' }, { status: 500 });
  }
}

/**
 * DELETE /api/students/[student_id]/manage-upload/cv-documents?slot_index=1
 * Gỡ CV khỏi ô (xóa bản ghi trong DB, slot trống lại).
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ student_id: string }> }
) {
  try {
    const { student_id: studentId } = await context.params;
    const session = await getServerSession(authOptions);
    const sessionUserId = (session?.user as { id?: string })?.id ?? (session?.user as { user_id?: string })?.user_id;
    if (!sessionUserId || String(sessionUserId) !== String(studentId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const slotRaw = searchParams.get('slot_index');
    const slotIndex = slotRaw != null ? parseInt(slotRaw, 10) : NaN;
    if (!Number.isInteger(slotIndex) || slotIndex < 1) {
      return NextResponse.json({ error: 'slot_index không hợp lệ' }, { status: 400 });
    }

    const user = await prisma.users.findUnique({
      where: { id: studentId },
      select: { subscription_plan: true },
    });
    const plan = normalizePlan(user?.subscription_plan as string);
    const maxSlots = getMaxCvUploadSlots(plan);
    if (slotIndex > maxSlots) {
      return NextResponse.json({ error: 'slot_index vượt quá giới hạn gói' }, { status: 400 });
    }

    await prisma.student_cv_documents.deleteMany({
      where: {
        student_id: studentId,
        slot_index: slotIndex,
      },
    });

    return NextResponse.json({ success: true, message: 'Đã gỡ CV' });
  } catch (e) {
    console.error('[manage-upload/cv-documents] DELETE', e);
    return NextResponse.json({ error: 'Lỗi gỡ CV' }, { status: 500 });
  }
}
