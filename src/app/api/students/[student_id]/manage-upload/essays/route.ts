/**
 * GET  /api/students/[student_id]/manage-upload/essays: List essays by slot (for manage-upload slides).
 * PUT  /api/students/[student_id]/manage-upload/essays: Upsert essay by slot_index. Enforce plan limit (Free 2, Plus/Premium 5).
 */

import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { prisma } from '@/lib/prisma';
import type { SubscriptionPlan } from '@/lib/api/require-premium';

function normalizePlan(raw: string | null | undefined): SubscriptionPlan {
  const upper = (raw ?? 'FREE').toString().trim().toUpperCase();
  if (['FREE', 'PLUS', 'PREMIUM'].includes(upper)) return upper as SubscriptionPlan;
  return 'FREE';
}

function getMaxEssaySlots(plan: SubscriptionPlan): number {
  switch (plan) {
    case 'FREE':
      return 2;
    case 'PLUS':
    case 'PREMIUM':
      return 5;
    default:
      return 2;
  }
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
    const maxSlots = getMaxEssaySlots(plan);

    const essays = await prisma.essays.findMany({
      where: { student_id: studentId },
      orderBy: { slot_index: 'asc' },
      select: {
        id: true,
        slot_index: true,
        title: true,
        content: true,
        essay_prompt: true,
        target_words: true,
        target_culture: true,
        applicant_core_strengths: true,
        target_program_entities: true,
        target_major: true,
        target_goal_id: true,
        target_goal: {
          select: {
            id: true,
            faculty_name: true,
            university_name: true,
          },
        },
        created_at: true,
        updated_at: true,
      },
    });

    return NextResponse.json({
      essays,
      maxSlots,
      plan,
    });
  } catch (e) {
    console.error('[manage-upload/essays] GET', e);
    return NextResponse.json({ error: 'Lỗi tải danh sách essay' }, { status: 500 });
  }
}

export async function PUT(
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

    const user = await prisma.users.findUnique({
      where: { id: studentId },
      select: { subscription_plan: true },
    });
    const plan = normalizePlan(user?.subscription_plan as string);
    const maxSlots = getMaxEssaySlots(plan);

    const body = await request.json();
    const slotIndex = typeof body.slot_index === 'number' ? body.slot_index : parseInt(body.slot_index, 10);
    if (!Number.isInteger(slotIndex) || slotIndex < 1 || slotIndex > maxSlots) {
      return NextResponse.json(
        { error: `slot_index phải từ 1 đến ${maxSlots} theo gói của bạn` },
        { status: 400 }
      );
    }
    const title = typeof body.title === 'string' ? body.title : undefined;
    const content = typeof body.content === 'string' ? body.content : '';

    const toStrArray = (v: unknown): string[] => {
      if (Array.isArray(v)) {
        return v.filter((x): x is string => typeof x === 'string').map((s) => s.trim()).filter(Boolean);
      }
      if (typeof v === 'string') {
        return v.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
      }
      return [];
    };

    const essayPrompt =
      typeof body.essay_prompt === 'string' ? body.essay_prompt : undefined;
    const targetWordsRaw = body.target_words;
    const parsedWords =
      typeof targetWordsRaw === 'number' && Number.isFinite(targetWordsRaw)
        ? Math.floor(targetWordsRaw)
        : typeof targetWordsRaw === 'string' && targetWordsRaw.trim() !== ''
          ? parseInt(targetWordsRaw, 10)
          : NaN;
    const targetWords =
      Number.isFinite(parsedWords) && parsedWords >= 1
        ? Math.min(500_000, parsedWords)
        : undefined;
    const targetCulture =
      typeof body.target_culture === 'string' ? body.target_culture.trim() : undefined;
    const strengths = toStrArray(body.applicant_core_strengths);
    const entities = toStrArray(body.target_program_entities);

    type GoalPatch = { target_goal_id: string | null; target_major: string | null };
    let goalPatch: GoalPatch | undefined;
    if (body.target_goal_id !== undefined) {
      const raw = body.target_goal_id;
      if (raw === null || raw === '') {
        goalPatch = { target_goal_id: null, target_major: null };
      } else if (typeof raw === 'string') {
        const goal = await prisma.student_target_goals.findFirst({
          where: { id: raw, student_id: studentId },
        });
        if (!goal) {
          return NextResponse.json({ error: 'Mục tiêu ngành @ trường không hợp lệ' }, { status: 400 });
        }
        goalPatch = { target_goal_id: goal.id, target_major: goal.faculty_name };
      }
    }

    const existing = await prisma.essays.findUnique({
      where: {
        student_id_slot_index: { student_id: studentId, slot_index: slotIndex },
      },
    });

    if (existing) {
      const updated = await prisma.essays.update({
        where: { id: existing.id },
        data: {
          title: title ?? existing.title,
          content,
          ...(essayPrompt !== undefined ? { essay_prompt: essayPrompt || null } : {}),
          ...(targetWords !== undefined ? { target_words: targetWords } : {}),
          ...(targetCulture !== undefined ? { target_culture: targetCulture || null } : {}),
          ...(body.applicant_core_strengths !== undefined
            ? { applicant_core_strengths: strengths.length ? strengths : [] }
            : {}),
          ...(body.target_program_entities !== undefined
            ? { target_program_entities: entities.length ? entities : [] }
            : {}),
          ...(goalPatch !== undefined
            ? { target_goal_id: goalPatch.target_goal_id, target_major: goalPatch.target_major }
            : {}),
          updated_at: new Date(),
        },
      });
      return NextResponse.json({ success: true, data: updated });
    }

    const created = await prisma.essays.create({
      data: {
        id: randomUUID(),
        student_id: studentId,
        slot_index: slotIndex,
        title: title ?? null,
        content,
        essay_prompt: essayPrompt ?? null,
        target_words: targetWords ?? null,
        target_culture: targetCulture ?? null,
        applicant_core_strengths: strengths.length ? strengths : [],
        target_program_entities: entities.length ? entities : [],
        target_goal_id: goalPatch?.target_goal_id ?? null,
        target_major: goalPatch?.target_major ?? null,
      },
    });
    return NextResponse.json({ success: true, data: created });
  } catch (e) {
    console.error('[manage-upload/essays] PUT', e);
    return NextResponse.json({ error: 'Lỗi lưu essay' }, { status: 500 });
  }
}
