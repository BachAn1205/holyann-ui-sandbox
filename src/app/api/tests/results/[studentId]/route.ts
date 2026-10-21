import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TestStatus } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;

    // Validate studentId
    if (!studentId || studentId === 'undefined' || studentId === 'null' || studentId.trim() === '') {
      console.warn('⚠️ Invalid studentId received:', studentId);
      return NextResponse.json(
        { success: false, error: 'Missing student_id' },
        { status: 400 }
      );
    }

    // Fetching test results for student

    // Fetch all test results
    const mbti = await prisma.mbti_tests.findUnique({
      where: { student_id: studentId },
    });

    const grit = await prisma.grit_tests.findUnique({
      where: { student_id: studentId },
    });

    const riasec = await prisma.riasec_tests.findUnique({
      where: { student_id: studentId },
    });

    // Count completed tests
    const completedCount = [mbti, grit, riasec].filter(
      (test) => test && test.status === TestStatus.COMPLETED
    ).length;

    const allCompleted = completedCount >= 3;

    // Format results
    const results: any = {};

    if (mbti && mbti.status === TestStatus.COMPLETED) {
      results.mbti = {
        result_type: mbti.result_type,
        result_description: mbti.result_description ?? undefined,
        detail_test_explain: mbti.detail_test_explain ?? undefined,
        scores: {
          E: mbti.score_e ?? 0,
          I: mbti.score_i ?? 0,
          S: mbti.score_s ?? 0,
          N: mbti.score_n ?? 0,
          T: mbti.score_t ?? 0,
          F: mbti.score_f ?? 0,
          J: mbti.score_j ?? 0,
          P: mbti.score_p ?? 0,
        },
        completed_at: mbti.completed_at,
      };
    }

    if (grit && grit.status === TestStatus.COMPLETED) {
      const totalScore = grit.total_score || 0;
      let level;
      if (totalScore >= 4.0) level = 'Rất cao';
      else if (totalScore >= 3.5) level = 'Cao';
      else if (totalScore >= 2.5) level = 'Trung bình';
      else level = 'Thấp';

      results.grit = {
        total_score: totalScore,
        passion_score: grit.passion_score,
        perseverance_score: grit.perseverance_score,
        level: grit.level || level,
        description: grit.description || `Điểm Grit của bạn ở mức ${level}`,
        detail_test_explain: grit.detail_test_explain ?? undefined,
        completed_at: grit.completed_at,
      };
    }

    if (riasec && riasec.status === TestStatus.COMPLETED) {
      const scores = {
        R: riasec.score_realistic ?? 0,
        I: riasec.score_investigative ?? 0,
        A: riasec.score_artistic ?? 0,
        S: riasec.score_social ?? 0,
        E: riasec.score_enterprising ?? 0,
        C: riasec.score_conventional ?? 0,
      };

      const sortedScores = Object.entries(scores)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 3);

      let top3: [string, number][] = sortedScores.map(([key, value]) => [key, value as number]);
      const saved = riasec.top_3_types;
      if (saved && Array.isArray(saved) && saved.length > 0) {
        const arr = saved as unknown[];
        const parsed = arr
          .filter((x: unknown): x is unknown[] => Array.isArray(x) && x.length >= 2)
          .map((x) => [String(x[0]), Number(x[1])] as [string, number]);
        if (parsed.length > 0) top3 = parsed.slice(0, 3);
      }

      const resultCode = riasec.result_code || top3.map(([key]) => key).join('');

      results.riasec = {
        scores,
        result_code: resultCode,
        result_description: riasec.result_description ?? undefined,
        detail_test_explain: riasec.detail_test_explain ?? undefined,
        top3,
        top_interests: top3.map(([code, score]) => ({ code, score })),
        completed_at: riasec.completed_at,
      };
    }

    // Found completed tests

    return NextResponse.json({
      success: true,
      results,
      progress: {
        completed_count: completedCount,
        all_completed: allCompleted,
        mbti_completed: mbti?.status === TestStatus.COMPLETED,
        grit_completed: grit?.status === TestStatus.COMPLETED,
        riasec_completed: riasec?.status === TestStatus.COMPLETED,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching test results:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
