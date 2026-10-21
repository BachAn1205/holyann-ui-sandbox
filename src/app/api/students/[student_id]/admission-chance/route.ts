import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-config";
import { prisma } from "@/lib/prisma";
import { getLimit, hasQuota, type SubscriptionPlan } from "@/lib/subscription";
import { callAdmissionChance } from "@/lib/ai-api-client";
import { randomUUID } from "crypto";
import { unwrapFastApiBody } from "@/lib/fast-api-response";
import type { AdmissionChanceApiResult } from "@/lib/ai-api-client";
import { buildFeature3AdmissionPayload } from "@/lib/feature3-admission-payload";
import { mergeAreasColumnIntoFullResult } from "@/lib/profile-analysis-normalize";

function normalizePlan(raw: string | null | undefined): SubscriptionPlan {
  const upper = (raw ?? "FREE")?.toString?.().trim?.().toUpperCase?.() ?? "FREE";
  if (upper === "ADVANCED") return "PREMIUM";
  if (["FREE", "PLUS", "PREMIUM"].includes(upper)) return upper as SubscriptionPlan;
  return "FREE";
}

/** POST: Gọi Feature 3 admission-chance (FastAPI), lưu reach / match / safety. */
export async function POST(
  request: Request,
  context: { params: Promise<{ student_id: string }> }
) {
  const { student_id: studentId } = await context.params;
  const session = await getServerSession(authOptions);
  const sessionUserId = (session?.user as { id?: string })?.id ?? (session?.user as { user_id?: string })?.user_id;
  if (!sessionUserId || String(sessionUserId) !== String(studentId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let preferredAreas: Array<"A" | "B" | "C"> = [];
    try {
      const body = (await request.json()) as {
        preferred_areas?: unknown;
      };
      if (Array.isArray(body?.preferred_areas)) {
        preferredAreas = body.preferred_areas
          .map((x) => String(x).trim().toUpperCase())
          .filter((x): x is "A" | "B" | "C" => x === "A" || x === "B" || x === "C");
      }
    } catch {
      // body optional
    }

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

    const used = await prisma.admission_chance_results.count({ where: { student_id: studentId } });
    const limitRaw = getLimit(plan, "admissionChanceLimit");
    const limit = typeof limitRaw === "number" ? limitRaw : 0;
    if (limit !== -1 && used >= limit) {
      return NextResponse.json(
        {
          error:
            "Bạn đã dùng hết số lần xem gợi ý trường (Reach/Match/Safe). Free: 2 lần, Plus: 5 lần, Premium: không giới hạn.",
        },
        { status: 403 }
      );
    }

    const [latestProfile, facultyWishlist, schoolWishlist, latestRec] = await Promise.all([
      prisma.profile_analyses.findFirst({
        where: { student_id: studentId },
        orderBy: { created_at: "desc" },
        select: {
          full_result: true,
          areas: true,
          score_aca: true,
          score_lan: true,
          score_hdnk: true,
          score_skill: true,
        },
      }),
      prisma.faculty_wishlist.findMany({
        where: { student_id: studentId },
        orderBy: { sort_order: "asc" },
        select: { faculty_name: true, sort_order: true },
      }),
      prisma.school_wishlist.findMany({
        where: { student_id: studentId },
        orderBy: { sort_order: "asc" },
        include: { university_rankings: { select: { name: true } } },
      }),
      prisma.faculty_recommendations.findFirst({
        where: { student_id: studentId },
        orderBy: { created_at: "desc" },
        select: { faculties: true },
      }),
    ]);

    if (facultyWishlist.length === 0 || schoolWishlist.length === 0) {
      return NextResponse.json(
        {
          error:
            "Bạn cần chọn ít nhất 1 ngành trong nguyện vọng ngành và ít nhất 1 trường trong nguyện vọng trường trước khi chạy đánh giá. Vào Hồ sơ để thêm.",
        },
        { status: 400 }
      );
    }

    const latestProfileMerged = latestProfile
      ? {
          ...latestProfile,
          full_result: mergeAreasColumnIntoFullResult(
            latestProfile.full_result,
            latestProfile.areas,
          ),
        }
      : null;

    const payload = buildFeature3AdmissionPayload({
      facultyWishlist,
      schoolWishlist,
      latestProfile: latestProfileMerged,
      latestFacultyRecommendation: latestRec,
      preferredAreas,
      preferredAreaBoost: preferredAreas.length > 0 ? 1.5 : undefined,
    });

    const rawResult = await callAdmissionChance(payload as unknown as Record<string, unknown>);
    const result = unwrapFastApiBody<AdmissionChanceApiResult>(rawResult);

    const reach = Array.isArray(result?.reach) ? result.reach : [];
    const match = Array.isArray(result?.match) ? result.match : [];
    const safety = Array.isArray(result?.safety) ? result.safety : [];

    const p = payload.pillars;
    const studentScoreAvg =
      p &&
      typeof p.academic === "number" &&
      typeof p.language === "number" &&
      typeof p.extracurricular === "number" &&
      typeof p.skills === "number"
        ? Math.round(((p.academic + p.language + p.extracurricular + p.skills) / 4) * 10) / 10
        : undefined;

    const summary = {
      pillars: payload.pillars,
      wishlist_counts: {
        faculties: facultyWishlist.length,
        universities: schoolWishlist.filter((s) => s.university_rankings?.name).length,
      },
      ...(studentScoreAvg != null ? { student_score: studentScoreAvg } : {}),
    };

    try {
      await prisma.admission_chance_results.create({
        data: {
          id: randomUUID(),
          student_id: studentId,
          summary: summary as object,
          faculties: { reach, match, safety } as object,
        },
      });
    } catch (dbErr) {
      console.error("[admission-chance] Lưu DB thất bại:", dbErr);
    }

    return NextResponse.json({
      ok: true,
      summary,
      faculties: { reach, match, safety },
    });
  } catch (e) {
    console.error("[admission-chance]", e);
    const message = e instanceof Error ? e.message : "Lỗi khi gọi đánh giá cơ hội trúng tuyển.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
