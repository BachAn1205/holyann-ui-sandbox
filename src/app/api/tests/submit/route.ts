import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TestStatus } from '@prisma/client';
import { autoCompleteChecklistTask } from '@/lib/checklist-helper';
import { callMBTI, callGRIT, callRIASEC } from '@/lib/server-ai-assessment';
import { MBTI_QUESTIONS_SORTED, MBTI_TYPE_DESCRIPTIONS } from '@/data/mbti-questions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { test_id, student_id, test_type, answers, save_progress_only, current_step } = body;

    if (!test_id || !student_id || !test_type || !answers) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: test_id, student_id, test_type, answers' },
        { status: 400 }
      );
    }

    const testType = test_type.toLowerCase();

    let existingTest: any = null;
    if (testType === 'mbti') {
      existingTest = await prisma.mbti_tests.findUnique({ where: { id: test_id } });
    } else if (testType === 'grit') {
      existingTest = await prisma.grit_tests.findUnique({ where: { id: test_id } });
    } else if (testType === 'riasec') {
      existingTest = await prisma.riasec_tests.findUnique({ where: { id: test_id } });
    }

    if (!existingTest) {
      return NextResponse.json({ success: false, error: 'Test not found' }, { status: 404 });
    }
    if (existingTest.student_id !== student_id) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Test does not belong to user' }, { status: 403 });
    }

    // Chỉ lưu tiến độ: cập nhật answers (và current_step nếu có), không gọi server AI, giữ IN_PROGRESS
    if (save_progress_only === true) {
      const progressData: any = {
        answers,
        updated_at: new Date(),
      };
      if (typeof current_step === 'number' && current_step >= 0) {
        progressData.current_step = current_step;
      }
      if (testType === 'mbti') {
        await prisma.mbti_tests.update({ where: { id: test_id }, data: progressData });
      } else if (testType === 'grit') {
        await prisma.grit_tests.update({ where: { id: test_id }, data: progressData });
      } else if (testType === 'riasec') {
        await prisma.riasec_tests.update({ where: { id: test_id }, data: progressData });
      }
      return NextResponse.json({
        success: true,
        message: 'Progress saved. You can continue later.',
      });
    }

    const updateData: any = {
      answers,
      status: TestStatus.COMPLETED,
      completed_at: new Date(),
      updated_at: new Date(),
    };

    let apiResult: any = { test_id, answers_count: Object.keys(answers).length };

    // Gọi server-ai và map kết quả vào DB + response
    try {
      if (testType === 'mbti') {
        const mbtiIds = MBTI_QUESTIONS_SORTED.map((q) => q.id);
        const mbti = await callMBTI(answers, mbtiIds);
        const ds = mbti.dimension_scores || {};
        const toPct = (v: number) => Math.round(Number(v) * 100);
        updateData.result_type = mbti.personality_type;
        const typeInfo = MBTI_TYPE_DESCRIPTIONS[mbti.personality_type];
        updateData.result_description = typeInfo
          ? `${typeInfo.title} (${typeInfo.nickname}) - ${typeInfo.description}`
          : mbti.personality_type;
        updateData.score_e = ds.E != null ? toPct(ds.E) : null;
        updateData.score_i = ds.I != null ? toPct(ds.I) : null;
        updateData.score_s = ds.S != null ? toPct(ds.S) : null;
        updateData.score_n = ds.N != null ? toPct(ds.N) : null;
        updateData.score_t = ds.T != null ? toPct(ds.T) : null;
        updateData.score_f = ds.F != null ? toPct(ds.F) : null;
        updateData.score_j = ds.J != null ? toPct(ds.J) : null;
        updateData.score_p = ds.P != null ? toPct(ds.P) : null;
        if (mbti.detail_test_explain) {
          updateData.detail_test_explain = mbti.detail_test_explain;
        }
        apiResult = {
          ...apiResult,
          result_type: mbti.personality_type,
          result_description: updateData.result_description,
          detail_test_explain: mbti.detail_test_explain ?? undefined,
          scores: {
            E: ds.E != null ? toPct(ds.E) : 0,
            I: ds.I != null ? toPct(ds.I) : 0,
            S: ds.S != null ? toPct(ds.S) : 0,
            N: ds.N != null ? toPct(ds.N) : 0,
            T: ds.T != null ? toPct(ds.T) : 0,
            F: ds.F != null ? toPct(ds.F) : 0,
            J: ds.J != null ? toPct(ds.J) : 0,
            P: ds.P != null ? toPct(ds.P) : 0,
          },
        };
      } else if (testType === 'grit') {
        const grit = await callGRIT(answers);
        updateData.total_score = grit.score;
        updateData.level = grit.level;
        if (grit.passion_score != null) updateData.passion_score = grit.passion_score;
        if (grit.perseverance_score != null) updateData.perseverance_score = grit.perseverance_score;
        if (grit.detail_test_explain) {
          updateData.detail_test_explain = grit.detail_test_explain;
        }
        apiResult = {
          ...apiResult,
          total_score: grit.score,
          level: grit.level,
          description: grit.description,
          passion_score: grit.passion_score ?? null,
          perseverance_score: grit.perseverance_score ?? null,
          detail_test_explain: grit.detail_test_explain ?? undefined,
        };
      } else if (testType === 'riasec') {
        const riasec = await callRIASEC(answers);
        const s = riasec.scores || {};
        updateData.score_realistic = s.R ?? null;
        updateData.score_investigative = s.I ?? null;
        updateData.score_artistic = s.A ?? null;
        updateData.score_social = s.S ?? null;
        updateData.score_enterprising = s.E ?? null;
        updateData.score_conventional = s.C ?? null;
        updateData.result_code = riasec.code;
        const top3 = riasec.top3 || [];
        updateData.top_3_types = top3.length ? top3 : null;
        updateData.result_description = top3.length
          ? `Xu hướng chính: ${top3.map(([code]) => code).join(', ')}`
          : riasec.code || null;
        if (riasec.detail_test_explain) {
          updateData.detail_test_explain = riasec.detail_test_explain;
        }
        apiResult = {
          ...apiResult,
          result_code: riasec.code,
          scores: { ...s },
          top3,
          result_description: updateData.result_description ?? undefined,
          detail_test_explain: riasec.detail_test_explain ?? undefined,
        };
      }
    } catch (aiError: any) {
      console.error('❌ Server-AI assessment error:', aiError);
      return NextResponse.json(
        {
          success: false,
          error: aiError?.message || 'Không thể kết nối server AI. Vui lòng thử lại.',
        },
        { status: 502 }
      );
    }

    if (testType === 'mbti') {
      await prisma.mbti_tests.update({ where: { id: test_id }, data: updateData });
    } else if (testType === 'grit') {
      await prisma.grit_tests.update({ where: { id: test_id }, data: updateData });
    } else if (testType === 'riasec') {
      await prisma.riasec_tests.update({ where: { id: test_id }, data: updateData });
    }

    if (testType === 'mbti' || testType === 'grit' || testType === 'riasec') {
      await autoCompleteChecklistTask(student_id, testType);
    }

    return NextResponse.json({
      success: true,
      message: 'Test submitted and completed successfully',
      result: apiResult,
    });
  } catch (error) {
    console.error('❌ Error saving test answers:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
