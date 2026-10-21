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
      select: { id: true, subscription_plan: true },
    });
    if (!user) {
      return NextResponse.json({ error: "Không tìm thấy người dùng" }, { status: 404 });
    }
    const dbPlan = normalizePlan(user.subscription_plan as string);
    const sessionPlan = (session?.user as { subscriptionPlan?: string })?.subscriptionPlan?.toString?.().trim?.().toUpperCase?.();
    const plan: SubscriptionPlan =
      dbPlan !== "FREE"
        ? dbPlan
        : sessionPlan && ["PLUS", "PREMIUM"].includes(sessionPlan)
          ? (sessionPlan as SubscriptionPlan)
          : dbPlan;

    const limitRaw = getLimit(plan, "admissionChanceLimit");
    const limit = typeof limitRaw === "number" ? limitRaw : 0;
    let used = 0;
    try {
      used = await prisma.admission_chance_results.count({ where: { student_id: studentId } });
    } catch (countErr) {
      console.error("[admission-chance/limits] count failed", countErr);
    }

    const remaining = limit === -1 ? null : Math.max(0, limit - used);

    const [facultyCount, schoolCount] = await Promise.all([
      prisma.faculty_wishlist.count({ where: { student_id: studentId } }),
      prisma.school_wishlist.count({ where: { student_id: studentId } }),
    ]);

    return NextResponse.json({
      plan,
      limit: limit === -1 ? null : limit,
      used,
      remaining,
      has_faculty_wishlist: facultyCount > 0,
      has_school_wishlist: schoolCount > 0,
    });
  } catch (e) {
    console.error("[admission-chance/limits]", e);
    return NextResponse.json({ error: "Lỗi lấy giới hạn" }, { status: 500 });
  }
}

