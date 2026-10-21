import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-config";
import { prisma } from "@/lib/prisma";
import { getLimit, type SubscriptionPlan } from "@/lib/subscription";

function normalizePlan(raw: string | null | undefined): SubscriptionPlan {
  const upper = (raw ?? "FREE")?.toString?.().trim?.().toUpperCase?.() ?? "FREE";
  if (upper === "ADVANCED") return "PREMIUM";
  if (["FREE", "PLUS", "PREMIUM"].includes(upper)) return upper as SubscriptionPlan;
  return "FREE";
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ student_id: string }> }
) {
  const { student_id: studentId } = await context.params;
  try {
    const session = await getServerSession(authOptions);
    const sessionUserId = (session?.user as { id?: string })?.id ?? (session?.user as { user_id?: string })?.user_id;
    if (!sessionUserId || String(sessionUserId) !== String(studentId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { id: studentId },
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

    const limitRaw = getLimit(plan, "recommendFacultyLimit");
    const limit = typeof limitRaw === "number" ? limitRaw : limitRaw === true ? 1 : 0;
    const used = await prisma.faculty_recommendations.count({ where: { student_id: studentId } });
    const remaining = limit === -1 ? null : Math.max(0, limit - used);

    return NextResponse.json({
      plan,
      limit: limit === -1 ? null : limit,
      used,
      remaining,
    });
  } catch {
    return NextResponse.json({ error: "Lỗi lấy giới hạn" }, { status: 500 });
  }
}

