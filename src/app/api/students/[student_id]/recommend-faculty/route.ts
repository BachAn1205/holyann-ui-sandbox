import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-config";
import { prisma } from "@/lib/prisma";
import { getLimit, hasQuota, type SubscriptionPlan } from "@/lib/subscription";
import { MBTI_QUESTIONS_SORTED } from "@/data/mbti-questions";
import { randomUUID } from "crypto";

const getBaseUrl = () => {
  const base = process.env.AI_SERVER_URL || process.env.AI_API_URL || "http://127.0.0.1:8000";
  return base.replace(/\/+$/, "");
};

function normalizePlan(raw: string | null | undefined): SubscriptionPlan {
  const upper = (raw ?? "FREE")?.toString?.().trim?.().toUpperCase?.() ?? "FREE";
  if (upper === "ADVANCED") return "PREMIUM";
  if (["FREE", "PLUS", "PREMIUM"].includes(upper)) return upper as SubscriptionPlan;
  return "FREE";
}

function toArray(answers: unknown, count: number, keysAsIndices: boolean): number[] | null {
  if (Array.isArray(answers)) {
    if (answers.length !== count) return null;
    return answers.map((v) => Number(v)).filter((n) => !Number.isNaN(n));
  }
  if (answers && typeof answers === "object" && keysAsIndices) {
    const arr: number[] = [];
    for (let i = 1; i <= count; i++) {
      const v = (answers as Record<string, unknown>)[String(i)] ?? (answers as Record<string, unknown>)[i];
      if (v === undefined || v === null) return null;
      const n = Number(v);
      if (Number.isNaN(n)) return null;
      arr.push(n);
    }
    return arr;
  }
  return null;
}

/** POST: Chạy gợi ý ngành (server-AI), kiểm tra limit, lưu vào faculty_recommendations. */
export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ student_id: string }> }
) {
  const { student_id: studentId } = await context.params;
  const session = await getServerSession(authOptions);
  const sessionUserId = (session?.user as { id?: string })?.id ?? (session?.user as { user_id?: string })?.user_id;
  if (!sessionUserId || String(sessionUserId) !== String(studentId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.users.findUnique({
      where: { id: studentId },
      select: { id: true, subscription_plan: true },
    });
    if (!user) {
      return NextResponse.json({ error: "Không tìm thấy người dùng" }, { status: 404 });
    }

    let plan = normalizePlan(user.subscription_plan as string);
    if (plan === "FREE") {
      const sessionPlan = (session?.user as { subscriptionPlan?: string })?.subscriptionPlan?.toString?.().trim?.().toUpperCase?.();
      if (sessionPlan && ["PLUS", "PREMIUM"].includes(sessionPlan)) {
        plan = sessionPlan as SubscriptionPlan;
      }
    }

    const used = await prisma.faculty_recommendations.count({ where: { student_id: studentId } });
    if (!hasQuota(plan, "recommendFacultyLimit", used)) {
      return NextResponse.json(
        { error: "Bạn đã dùng hết số lần xem gợi ý ngành. Vui lòng nâng cấp gói (Plus: 5 lần, Premium: không giới hạn)." },
        { status: 403 }
      );
    }

    const [mbti, grit, riasec] = await Promise.all([
      prisma.mbti_tests.findFirst({
        where: { student_id: studentId, status: "COMPLETED" },
        orderBy: { completed_at: "desc" },
        select: { answers: true },
      }),
      prisma.grit_tests.findFirst({
        where: { student_id: studentId, status: "COMPLETED" },
        orderBy: { completed_at: "desc" },
        select: { answers: true },
      }),
      prisma.riasec_tests.findFirst({
        where: { student_id: studentId, status: "COMPLETED" },
        orderBy: { completed_at: "desc" },
        select: { answers: true },
      }),
    ]);

    if (!mbti?.answers || !grit?.answers || !riasec?.answers) {
      return NextResponse.json(
        { error: "Cần hoàn thành đủ 3 bài test (MBTI, GRIT, RIASEC) để xem gợi ý ngành." },
        { status: 400 }
      );
    }

    const rawMbti = mbti.answers as Record<string, unknown> | unknown[];
    const mbtiIds = MBTI_QUESTIONS_SORTED.map((q) => q.id);
    const mbtiArr: number[] = [];
    if (Array.isArray(rawMbti)) {
      if (rawMbti.length !== 60) {
        return NextResponse.json({ error: "Dữ liệu MBTI không đủ 60 câu." }, { status: 400 });
      }
      rawMbti.forEach((v) => mbtiArr.push(Number(v)));
    } else {
      for (const id of mbtiIds) {
        const v = (rawMbti as Record<string, unknown>)?.[String(id)] ?? (rawMbti as Record<string, unknown>)?.[id];
        if (v === undefined || v === null) {
          return NextResponse.json({ error: "Dữ liệu MBTI không đủ." }, { status: 400 });
        }
        mbtiArr.push(Number(v));
      }
    }

    const gritArr = toArray(grit.answers, 12, true);
    const riasecArr = toArray(riasec.answers, 48, true);
    if (!gritArr || !riasecArr) {
      return NextResponse.json(
        { error: "Dữ liệu GRIT hoặc RIASEC không hợp lệ (cần đủ 12 và 48 câu)." },
        { status: 400 }
      );
    }

    // FastAPI feature2 recommend-faculty → { success, data: { ok, message?, assessment_summary?, faculties } }
    const url = `${getBaseUrl()}/api/v1/feature2/recommend-faculty`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mbti_answers: mbtiArr,
        grit_answers: gritArr,
        riasec_answers: riasecArr,
        top_faculties: 10,
      }),
    });
    const raw = await res.json();
    const data = raw?.data ?? raw;

    if (!res.ok) {
      return NextResponse.json(
        { error: raw?.detail ?? data?.message ?? data?.error ?? "Không thể lấy gợi ý ngành từ server AI." },
        { status: res.status >= 500 ? 502 : res.status }
      );
    }

    if (!data?.ok) {
      return NextResponse.json(
        { error: data?.message ?? data?.error ?? "Gợi ý ngành không khả dụng (cần MBTI model)." },
        { status: 503 }
      );
    }

    const record = await prisma.faculty_recommendations.create({
      data: {
        id: randomUUID(),
        student_id: studentId,
        assessment_summary: data.assessment_summary ?? undefined,
        faculties: data.faculties ?? undefined,
      },
    });

    return NextResponse.json({
      ok: true,
      id: record.id,
      assessment_summary: record.assessment_summary,
      faculties: record.faculties,
      created_at: record.created_at,
    });
  } catch (e) {
    console.error("[recommend-faculty]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Lỗi khi gọi gợi ý ngành." },
      { status: 500 }
    );
  }
}

