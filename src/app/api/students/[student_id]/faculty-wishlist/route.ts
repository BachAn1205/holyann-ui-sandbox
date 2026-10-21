import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-config";
import { prisma } from "@/lib/prisma";
import { getLimit, type SubscriptionPlan } from "@/lib/subscription";
import { randomUUID } from "crypto";

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

    const items = await prisma.faculty_wishlist.findMany({
      where: { student_id: studentId },
      orderBy: { sort_order: "asc" },
      select: { faculty_name: true, sort_order: true },
    });

    return NextResponse.json({
      items: items.map((r) => ({ faculty_name: r.faculty_name, sort_order: r.sort_order })),
    });
  } catch {
    return NextResponse.json({ error: "Lỗi tải nguyện vọng" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ student_id: string }> }
) {
  const { student_id: studentId } = await context.params;
  const session = await getServerSession(authOptions);
  const sessionUserId = (session?.user as { id?: string })?.id ?? (session?.user as { user_id?: string })?.user_id;
  if (!sessionUserId || String(sessionUserId) !== String(studentId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const raw = body?.items;
    if (!Array.isArray(raw)) {
      return NextResponse.json({ error: "Thiếu hoặc sai định dạng items" }, { status: 400 });
    }

    const items = raw
      .filter((x: unknown) => x && typeof x === "object" && typeof (x as { faculty_name?: unknown }).faculty_name === "string")
      .map((x: { faculty_name: string; sort_order?: number }, i: number) => ({
        faculty_name: String((x.faculty_name || "").trim()).slice(0, 500),
        sort_order: typeof x.sort_order === "number" ? x.sort_order : i,
      }))
      .filter((x) => x.faculty_name.length > 0);

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
    const limitRaw = getLimit(plan, "facultyWishlistLimit");
    const limit = typeof limitRaw === "number" ? limitRaw : 0;
    if (limit >= 0 && items.length > limit) {
      return NextResponse.json(
        { error: `Gói của bạn chỉ được chọn tối đa ${limit} ngành. (Free: 2, Plus: 5, Premium: 10)` },
        { status: 403 }
      );
    }

    await prisma.faculty_wishlist.deleteMany({ where: { student_id: studentId } });
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      await prisma.faculty_wishlist.create({
        data: {
          id: randomUUID(),
          student_id: studentId,
          faculty_name: item.faculty_name,
          sort_order: item.sort_order,
        },
      });
    }

    const list = await prisma.faculty_wishlist.findMany({
      where: { student_id: studentId },
      orderBy: { sort_order: "asc" },
      select: { faculty_name: true, sort_order: true },
    });
    return NextResponse.json({
      success: true,
      items: list.map((r) => ({ faculty_name: r.faculty_name, sort_order: r.sort_order })),
    });
  } catch (e) {
    console.error("[faculty-wishlist]", e);
    return NextResponse.json({ error: "Lỗi lưu nguyện vọng" }, { status: 500 });
  }
}

