import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-config";
import { prisma } from "@/lib/prisma";
import { getLimit, resolveEffectiveSubscriptionPlan } from "@/lib/subscription";
import { randomUUID } from "crypto";

async function syncPrimaryTargetToStudent(studentId: string) {
  const first = await prisma.student_target_goals.findFirst({
    where: { student_id: studentId },
    orderBy: [{ sort_order: "asc" }, { created_at: "asc" }],
  });
  if (!first) {
    await prisma.students.update({
      where: { user_id: studentId },
      data: {
        target_faculty_name: null,
        target_university_id: null,
        target_university_name: null,
        target_set_at: null,
        updated_at: new Date(),
      },
    });
    return;
  }
  await prisma.students.update({
    where: { user_id: studentId },
    data: {
      target_faculty_name: first.faculty_name,
      target_university_id: first.university_id,
      target_university_name: first.university_name,
      target_set_at: first.created_at,
      updated_at: new Date(),
    },
  });
}

/** GET: danh sách mục tiêu + giới hạn theo gói */
export async function GET(
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
      select: { subscription_plan: true },
    });
    const sessionPlanRaw = (session?.user as { subscriptionPlan?: string })?.subscriptionPlan;
    const plan = resolveEffectiveSubscriptionPlan(
      user?.subscription_plan as string | undefined,
      sessionPlanRaw
    );

    const maxRaw = getLimit(plan, "targetGoalsLimit");
    const maxGoals = typeof maxRaw === "number" ? maxRaw : 2;

    const goals = await prisma.student_target_goals.findMany({
      where: { student_id: studentId },
      orderBy: [{ sort_order: "asc" }, { created_at: "asc" }],
      select: {
        id: true,
        faculty_name: true,
        university_id: true,
        university_name: true,
        sort_order: true,
        created_at: true,
      },
    });

    const primary = goals[0] ?? null;

    return NextResponse.json({
      goals: goals.map((g) => ({
        id: g.id,
        faculty_name: g.faculty_name,
        university_id: g.university_id,
        university_name: g.university_name,
        sort_order: g.sort_order,
        created_at: g.created_at.toISOString(),
      })),
      maxGoals,
      plan,
      primary: primary
        ? {
            target_faculty_name: primary.faculty_name,
            target_university_id: primary.university_id,
            target_university_name: primary.university_name,
            target_set_at: primary.created_at.toISOString(),
          }
        : null,
      already_set: goals.length > 0,
      target_faculty_name: primary?.faculty_name ?? null,
      target_university_id: primary?.university_id ?? null,
      target_university_name: primary?.university_name ?? null,
      target_set_at: primary?.created_at.toISOString() ?? null,
    });
  } catch (e) {
    console.error("[target-goal] GET error:", e);
    return NextResponse.json({ error: "Lỗi tải mục tiêu" }, { status: 500 });
  }
}

/** POST: thêm một mục tiêu */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ student_id: string }> }
) {
  const { student_id: studentId } = await context.params;
  const session = await getServerSession(authOptions);
  const sessionUserId = (session?.user as { id?: string })?.id ?? (session?.user as { user_id?: string })?.user_id;
  if (!sessionUserId || String(sessionUserId) !== String(studentId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { faculty_name?: string; university_id?: number | null; university_name?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const faculty_name = String(body.faculty_name ?? "").trim();
  const university_name = String(body.university_name ?? "").trim();
  let university_id: number | null = null;
  if (body.university_id != null) {
    const n = Number(body.university_id);
    if (Number.isFinite(n)) university_id = n;
  }

  if (!faculty_name || !university_name) {
    return NextResponse.json({ error: "Cần chọn ngành và tên trường" }, { status: 400 });
  }

  try {
    const user = await prisma.users.findUnique({
      where: { id: studentId },
      select: { subscription_plan: true },
    });
    const sessionPlanRaw = (session?.user as { subscriptionPlan?: string })?.subscriptionPlan;
    const plan = resolveEffectiveSubscriptionPlan(
      user?.subscription_plan as string | undefined,
      sessionPlanRaw
    );

    const maxRaw = getLimit(plan, "targetGoalsLimit");
    const maxGoals = typeof maxRaw === "number" ? maxRaw : 2;

    const student = await prisma.students.findUnique({
      where: { user_id: studentId },
      select: { user_id: true },
    });
    if (!student) {
      return NextResponse.json({ error: "Không tìm thấy hồ sơ" }, { status: 404 });
    }

    const existing = await prisma.student_target_goals.findMany({
      where: { student_id: studentId },
    });
    if (existing.length >= maxGoals) {
      return NextResponse.json(
        {
          error: `Đã đạt tối đa ${maxGoals} mục tiêu cho gói ${plan} (Free: 2, Plus: 5, Premium: 10).`,
        },
        { status: 403 }
      );
    }

    const dup = existing.some(
      (e) =>
        e.faculty_name.trim().toLowerCase() === faculty_name.toLowerCase() &&
        e.university_name.trim().toLowerCase() === university_name.toLowerCase()
    );
    if (dup) {
      return NextResponse.json({ error: "Mục tiêu này đã có trong danh sách." }, { status: 400 });
    }

    const sort_order = existing.length;

    const uniId =
      university_id != null && Number.isFinite(Number(university_id)) ? Number(university_id) : null;

    await prisma.student_target_goals.create({
      data: {
        id: randomUUID(),
        student_id: studentId,
        faculty_name,
        university_id: uniId,
        university_name,
        sort_order,
      },
    });

    await syncPrimaryTargetToStudent(studentId);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[target-goal] POST error:", e);
    return NextResponse.json({ error: "Lỗi lưu mục tiêu" }, { status: 500 });
  }
}

/** DELETE: xóa một mục (?goalId=) hoặc xóa hết (làm lại) */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ student_id: string }> }
) {
  const { student_id: studentId } = await context.params;
  const session = await getServerSession(authOptions);
  const sessionUserId = (session?.user as { id?: string })?.id ?? (session?.user as { user_id?: string })?.user_id;
  if (!sessionUserId || String(sessionUserId) !== String(studentId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const goalId = request.nextUrl.searchParams.get("goalId")?.trim();

  try {
    if (goalId) {
      const row = await prisma.student_target_goals.findFirst({
        where: { id: goalId, student_id: studentId },
      });
      if (!row) {
        return NextResponse.json({ error: "Không tìm thấy mục tiêu" }, { status: 404 });
      }
      await prisma.student_target_goals.delete({ where: { id: goalId } });
      const rest = await prisma.student_target_goals.findMany({
        where: { student_id: studentId },
        orderBy: [{ sort_order: "asc" }, { created_at: "asc" }],
      });
      if (rest.length > 0) {
        await prisma.$transaction(
          rest.map((r, i) =>
            prisma.student_target_goals.update({
              where: { id: r.id },
              data: { sort_order: i },
            })
          )
        );
      }
    } else {
      await prisma.student_target_goals.deleteMany({ where: { student_id: studentId } });
    }

    await syncPrimaryTargetToStudent(studentId);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[target-goal] DELETE error:", e);
    return NextResponse.json({ error: "Lỗi xóa mục tiêu" }, { status: 500 });
  }
}

/** PATCH: cập nhật thứ tự mục tiêu — nhận { orderedIds: string[] } */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ student_id: string }> }
) {
  const { student_id: studentId } = await context.params;
  const session = await getServerSession(authOptions);
  const sessionUserId = (session?.user as { id?: string })?.id ?? (session?.user as { user_id?: string })?.user_id;
  if (!sessionUserId || String(sessionUserId) !== String(studentId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { orderedIds?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const orderedIds = body.orderedIds;
  if (!Array.isArray(orderedIds) || orderedIds.some((id) => typeof id !== "string")) {
    return NextResponse.json({ error: "orderedIds phải là mảng string" }, { status: 400 });
  }

  try {
    await prisma.$transaction(
      (orderedIds as string[]).map((id, i) =>
        prisma.student_target_goals.updateMany({
          where: { id, student_id: studentId },
          data: { sort_order: i },
        })
      )
    );

    await syncPrimaryTargetToStudent(studentId);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[target-goal] PATCH error:", e);
    return NextResponse.json({ error: "Lỗi cập nhật thứ tự" }, { status: 500 });
  }
}

