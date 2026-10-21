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

    const items = await prisma.school_wishlist.findMany({
      where: { student_id: studentId },
      orderBy: { sort_order: "asc" },
      include: {
        university_rankings: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      items: items.map((r) => ({
        university_id: r.university_id,
        name: r.university_rankings?.name ?? "",
        sort_order: r.sort_order,
      })),
    });
  } catch (e) {
    console.error("[school-wishlist] GET", e);
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
      .filter(
        (x: unknown) =>
          x && typeof x === "object" && typeof (x as { university_id?: unknown }).university_id === "number"
      )
      .map(
        (
          x: { university_id: number; sort_order?: number },
          i: number
        ) => ({
          university_id: Number((x.university_id as number)),
          sort_order: typeof x.sort_order === "number" ? x.sort_order : i,
        })
      );

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
    const limitRaw = getLimit(plan, "schoolWishlistLimit");
    const limit = typeof limitRaw === "number" ? limitRaw : 0;
    if (limit >= 0 && items.length > limit) {
      return NextResponse.json(
        { error: `Gói của bạn chỉ được chọn tối đa ${limit} trường. (Free: 2, Plus: 5, Premium: 10)` },
        { status: 403 }
      );
    }

    const uniqueIds = [...new Set(items.map((x) => x.university_id))];
    const existing = await prisma.university_rankings.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, status: true, created_by_user_id: true },
    });
    const allowedIds = new Set(
      existing
        .filter(
          (u) =>
            u.status === "APPROVED" ||
            (u.status === "PENDING" && String(u.created_by_user_id ?? "") === String(studentId))
        )
        .map((u) => u.id)
    );
    const deniedIds = uniqueIds.filter((id) => !allowedIds.has(id));
    if (deniedIds.length > 0) {
      return NextResponse.json(
        { error: "Có trường không hợp lệ hoặc bạn không có quyền thêm vào wishlist", denied_ids: deniedIds },
        { status: 403 }
      );
    }
    const validItems = items.filter((x) => allowedIds.has(x.university_id));

    await prisma.school_wishlist.deleteMany({ where: { student_id: studentId } });
    for (let i = 0; i < validItems.length; i++) {
      const item = validItems[i];
      await prisma.school_wishlist.create({
        data: {
          id: randomUUID(),
          student_id: studentId,
          university_id: item.university_id,
          sort_order: item.sort_order,
        },
      });
    }

    const list = await prisma.school_wishlist.findMany({
      where: { student_id: studentId },
      orderBy: { sort_order: "asc" },
      include: {
        university_rankings: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json({
      success: true,
      items: list.map((r) => ({
        university_id: r.university_id,
        name: r.university_rankings?.name ?? "",
        sort_order: r.sort_order,
      })),
    });
  } catch (e) {
    console.error("[school-wishlist]", e);
    return NextResponse.json({ error: "Lỗi lưu nguyện vọng" }, { status: 500 });
  }
}

