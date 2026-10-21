/**
 * GET /api/student/improve/profile-data
 * Trả về feature1_output, feature2_output, feature3_output từ DB để gọi Profile Improver (Feature 4).
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { prisma } from '@/lib/prisma';
import { TestStatus } from '@prisma/client';

function buildFeature1FromProfile(analysis: {
  full_result?: unknown;
  swot_data: unknown;
  score_aca?: number | null;
  score_lan?: number | null;
  score_hdnk?: number | null;
  score_skill?: number | null;
}) {
  const to100 = (v: number | null | undefined) =>
    v == null ? 70 : v <= 1 ? Math.round(v * 100) : Math.round(Math.min(100, Math.max(0, v)));
  const aca = to100(analysis.score_aca);
  const lan = to100(analysis.score_lan);
  const hdnk = to100(analysis.score_hdnk);
  const skill = to100(analysis.score_skill);
  const fr = analysis.full_result as Record<string, unknown> | undefined;
  const spikeSection = fr?.["C. Nhận diện Spike (Yếu tố cốt lõi)"] as Record<string, unknown> | null | undefined;
  const mainSpike = (spikeSection?.["Loại Spike hiện tại"] ?? spikeSection?.["Loại spike"]) as string | undefined ?? 'Academic Excellence';
  const sharpness = (spikeSection?.["Độ sắc (Sharpness)"] as string | undefined) ?? ((aca + lan + hdnk + skill) / 4 >= 80 ? 'High' : (aca + lan + hdnk + skill) / 4 >= 60 ? 'Medium' : 'Low');
  return {
    summary: {
      success: true,
      total_pillar_scores: { aca, lan, hdnk, skill },
      main_spike: mainSpike,
      sharpness: sharpness,
    },
    ...(analysis.swot_data && typeof analysis.swot_data === 'object'
      ? { 'B. Phân tích SWOT': analysis.swot_data }
      : {}),
  };
}

function buildFeature2FromTests(
  mbti: { result_type: string | null; score_e: number | null; score_i: number | null; score_s: number | null; score_n: number | null; score_t: number | null; score_f: number | null; score_j: number | null; score_p: number | null } | null,
  grit: { total_score: number | null; passion_score: number | null; perseverance_score: number | null; level: string | null; description: string | null } | null,
  riasec: { result_code: string | null; score_realistic: number | null; score_investigative: number | null; score_artistic: number | null; score_social: number | null; score_enterprising: number | null; score_conventional: number | null; top_3_types: unknown } | null
) {
  const assessment: Record<string, unknown> = {};
  if (mbti && mbti.result_type) {
    assessment.mbti = {
      personality_type: mbti.result_type,
      dimension_scores: {
        E: (mbti.score_e ?? 0) / 100,
        I: (mbti.score_i ?? 0) / 100,
        S: (mbti.score_s ?? 0) / 100,
        N: (mbti.score_n ?? 0) / 100,
        T: (mbti.score_t ?? 0) / 100,
        F: (mbti.score_f ?? 0) / 100,
        J: (mbti.score_j ?? 0) / 100,
        P: (mbti.score_p ?? 0) / 100,
      },
      confidence: 0.9,
    };
  } else {
    assessment.mbti = { personality_type: 'INTJ', dimension_scores: { E: 0.2, I: 0.8, S: 0.3, N: 0.7, T: 0.7, F: 0.3, J: 0.8, P: 0.2 }, confidence: 0.5 };
  }
  if (grit) {
    assessment.grit = {
      score: grit.total_score ?? 3.5,
      level: grit.level ?? 'Trung bình',
      description: grit.description ?? 'Điểm Grit từ bài test.',
      passion_score: grit.passion_score,
      perseverance_score: grit.perseverance_score,
    };
  } else {
    assessment.grit = { score: 3.5, level: 'Trung bình', description: 'Chưa có điểm Grit.', passion_score: 3.5, perseverance_score: 3.5 };
  }
  if (riasec) {
    const scores = {
      Realistic: riasec.score_realistic ?? 0,
      Investigative: riasec.score_investigative ?? 0,
      Artistic: riasec.score_artistic ?? 0,
      Social: riasec.score_social ?? 0,
      Enterprising: riasec.score_enterprising ?? 0,
      Conventional: riasec.score_conventional ?? 0,
    };
    let top3: [string, number][] = [];
    const saved = riasec.top_3_types;
    if (Array.isArray(saved) && saved.length > 0) {
      top3 = saved
        .filter((x): x is unknown[] => Array.isArray(x) && x.length >= 2)
        .map((x) => [String(x[0]), Number(x[1])] as [string, number])
        .slice(0, 3);
    }
    if (top3.length === 0) {
      top3 = Object.entries(scores)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 3) as [string, number][];
    }
    assessment.riasec = { code: riasec.result_code ?? top3.map(([c]) => c).join(''), scores, top3 };
  } else {
    assessment.riasec = { code: 'RIA', scores: { Realistic: 80, Investigative: 100, Artistic: 60, Social: 40, Enterprising: 30, Conventional: 50 }, top3: [['Investigative', 100], ['Realistic', 80], ['Artistic', 60]] };
  }
  return { success: true, assessment, recommendations: [] };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const studentId = session.user.id;

    const [latestAnalysis, mbti, grit, riasec] = await Promise.all([
      prisma.profile_analyses.findFirst({
        where: { student_id: studentId },
        orderBy: { created_at: 'desc' },
        select: {
          full_result: true,
          swot_data: true,
          score_aca: true,
          score_lan: true,
          score_hdnk: true,
          score_skill: true,
        },
      }),
      prisma.mbti_tests.findUnique({ where: { student_id: studentId } }),
      prisma.grit_tests.findUnique({ where: { student_id: studentId } }),
      prisma.riasec_tests.findUnique({ where: { student_id: studentId } }),
    ]);

    const mbtiOk = mbti?.status === TestStatus.COMPLETED ? mbti : null;
    const gritOk = grit?.status === TestStatus.COMPLETED ? grit : null;
    const riasecOk = riasec?.status === TestStatus.COMPLETED ? riasec : null;

    const feature1_output = latestAnalysis
      ? buildFeature1FromProfile(latestAnalysis)
      : buildFeature1FromProfile({
          full_result: null,
          swot_data: null,
          score_aca: null,
          score_lan: null,
          score_hdnk: null,
          score_skill: null,
        });

    const feature2_output = buildFeature2FromTests(mbtiOk, gritOk, riasecOk);

    const feature3_output = {
      success: true,
      universities: {} as Record<string, unknown>,
      roadmap: {} as Record<string, unknown>,
      summary: {} as Record<string, unknown>,
    };

    return NextResponse.json({
      success: true,
      feature1_output,
      feature2_output,
      feature3_output,
    });
  } catch (error) {
    console.error('❌ [improve/profile-data] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Lỗi khi lấy dữ liệu profile' },
      { status: 500 }
    );
  }
}
