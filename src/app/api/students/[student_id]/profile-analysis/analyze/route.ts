import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { getLimit, type SubscriptionPlan } from "@/lib/subscription";
import { callProfileAnalysis } from "@/lib/ai-api-client";
import { buildProfilePayloadFromDb } from "@/lib/build-profile-payload";
import type { Feature1AnalysisOutput } from "@/lib/schemas/profile-analysis-v2.schema";
import { requireStudentRouteAccess } from "@/lib/auth-utils";
import { unwrapFastApiBody } from "@/lib/fast-api-response";

export const maxDuration = 300;

function normalizePlan(raw: string | null | undefined): SubscriptionPlan {
  const upper = (raw ?? "FREE")?.toString?.().trim?.().toUpperCase?.() ?? "FREE";
  if (upper === "ADVANCED") return "PREMIUM";
  if (["FREE", "PLUS", "PREMIUM"].includes(upper)) return upper as SubscriptionPlan;
  return "FREE";
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ student_id: string }> }
) {
  const { student_id: studentId } = await context.params;
  try {
    const currentUser = await requireStudentRouteAccess(studentId);

    const user = await prisma.users.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true,
        subscription_plan: true,
        students: {
          select: { user_id: true },
        },
      },
    });
    if (!user?.students) {
      return NextResponse.json({ error: "Không tìm thấy học sinh" }, { status: 404 });
    }

    const plan = normalizePlan(user.subscription_plan as string);
    const limitRaw = getLimit(plan, "profileAnalysisLimit");
    const limit = typeof limitRaw === "number" ? limitRaw : limitRaw === true ? 1 : 0;
    const used = await prisma.profile_analyses.count({ where: { student_id: currentUser.id } });

    if (limit !== -1 && used >= limit) {
      return NextResponse.json(
        { error: "Bạn đã dùng hết số lần đánh giá theo gói. Vui lòng nâng cấp.", limit, used },
        { status: 403 }
      );
    }

    const built = await buildProfilePayloadFromDb(currentUser.id);
    if (!built) {
      return NextResponse.json({ error: "Không tìm thấy hồ sơ học sinh" }, { status: 404 });
    }
    const body = built.payload;
    if (body.gpa?.value_10 == null) {
      return NextResponse.json(
        { error: "Vui lòng cập nhật GPA trong Cập nhật hồ sơ trước khi phân tích." },
        { status: 400 }
      );
    }

    const rawResult = await callProfileAnalysis(body);
    const result = unwrapFastApiBody<Feature1AnalysisOutput>(rawResult);

    if (!result?.pillar_scores || !result?.areas || !result?.swot) {
      return NextResponse.json(
        { error: "Dữ liệu phân tích không hợp lệ từ AI" },
        { status: 500 }
      );
    }

    const ps = result.pillar_scores;
    const ar = result.areas;
    const suit = (v: unknown) =>
      typeof v === "number" && !Number.isNaN(v) ? v : null;
    const now = new Date();
    await prisma.profile_analyses.create({
      data: {
        id: randomUUID(),
        student_id: currentUser.id,
        input_data: body as unknown as object,
        full_result: result as unknown as object,
        swot_data: result.swot as unknown as object,
        areas: result.areas as unknown as object,
        score_aca: typeof ps.academic === "number" ? (ps.academic <= 1 ? ps.academic * 100 : ps.academic) : null,
        score_lan: typeof ps.language === "number" ? (ps.language <= 1 ? ps.language * 100 : ps.language) : null,
        score_hdnk: typeof ps.extracurricular === "number" ? (ps.extracurricular <= 1 ? ps.extracurricular * 100 : ps.extracurricular) : null,
        score_skill: typeof ps.skills === "number" ? (ps.skills <= 1 ? ps.skills * 100 : ps.skills) : null,
        suitability_a: suit(ar?.A?.suitability),
        suitability_b: suit(ar?.B?.suitability),
        suitability_c: suit(ar?.C?.suitability),
        updated_at: now,
      },
    });

    return NextResponse.json(result);
  } catch (e) {
    const status = e instanceof Error && (e.message === "UNAUTHORIZED" || e.message === "FORBIDDEN") ? 401 : 500;
    const msg = status === 401 ? "Unauthorized" : e instanceof Error ? e.message : "Lỗi phân tích hồ sơ";
    return NextResponse.json({ error: msg }, { status });
  }
}
