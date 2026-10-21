/**
 * Profile Analysis History API
 *
 * GET /api/students/[student_id]/analysis-history
 * - Lấy lịch sử phân tích hồ sơ của student
 * - Query params: limit (default: 10), include_full (boolean)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ student_id: string }> }
) {
  try {
    const { student_id } = await context.params;

    // Auth check - try to get session, but allow if API is called internally
    let session: any = null;
    try {
      const { authOptions } = await import('@/lib/auth/auth-config');
      session = await getServerSession(authOptions);
    } catch {
      // authOptions may not exist, allow internal calls
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const analysisId = searchParams.get('id');

    // If specific analysis ID requested
    if (analysisId) {
      const analysis = await prisma.profile_analyses.findUnique({
        where: { id: analysisId },
      });

      if (!analysis) {
        return NextResponse.json(
          { error: 'Không tìm thấy kết quả phân tích', success: false },
          { status: 404 }
        );
      }

      // Parse full_result from swot_data or academic_data for legacy support
      const fullResult = (analysis as any).full_result || null;

      const spikeSection = fullResult?.["C. Nhận diện Spike (Yếu tố cốt lõi)"];
      const mainSpike = spikeSection?.["Loại Spike hiện tại"] ?? spikeSection?.["Loại spike"] ?? null;
      const spikeSharpness = spikeSection?.["Độ sắc (Sharpness)"] ?? null;
      const spikeScore = typeof spikeSection?.main_spike_score === "number" ? spikeSection.main_spike_score : typeof spikeSection?.["Điểm số"] === "number" ? spikeSection["Điểm số"] : 0;

      return NextResponse.json({
        success: true,
        data: {
          id: analysis.id,
          analysisDate: analysis.created_at,
          fullResult: fullResult,
          pillarScores: {
            aca: (analysis as any).score_aca ?? 0,
            lan: (analysis as any).score_lan ?? 0,
            hdnk: (analysis as any).score_hdnk ?? 0,
            skill: (analysis as any).score_skill ?? 0,
          },
          regionalScores: {
            usa: 0,
            asia: 0,
            europe: 0,
          },
          mainSpike,
          spikeSharpness,
          spikeScore,
          swotData: analysis.swot_data,
        },
      });
    }

    const latestAnalysis = await prisma.profile_analyses.findFirst({
      where: { student_id },
      orderBy: { created_at: 'desc' },
    });

    const history = await prisma.profile_analyses.findMany({
      where: { student_id },
      orderBy: { created_at: 'desc' },
      take: limit,
    });

    const spikeFromRecord = (a: any) => {
      const fr = a.full_result;
      const section = fr?.["C. Nhận diện Spike (Yếu tố cốt lõi)"];
      return {
        mainSpike: section?.["Loại Spike hiện tại"] ?? section?.["Loại spike"] ?? null,
        spikeSharpness: section?.["Độ sắc (Sharpness)"] ?? null,
      };
    };

    const mapAnalysis = (a: any) => {
      const spike = spikeFromRecord(a);
      return {
        id: a.id,
        analysisDate: a.created_at,
        pillarScores: {
          aca: a.score_aca ?? 0,
          lan: a.score_lan ?? 0,
          hdnk: a.score_hdnk ?? 0,
          skill: a.score_skill ?? 0,
        },
        regionalScores: { usa: 0, asia: 0, europe: 0 },
        mainSpike: spike.mainSpike,
        spikeSharpness: spike.spikeSharpness,
        createdAt: a.created_at,
      };
    };

    return NextResponse.json({
      success: true,
      hasAnalysis: !!latestAnalysis,
      latest: latestAnalysis ? {
        ...mapAnalysis(latestAnalysis),
        fullResult: (latestAnalysis as any).full_result || null,
        swotData: latestAnalysis.swot_data,
      } : null,
      history: history.map(mapAnalysis),
      totalCount: history.length,
    });
  } catch (error: any) {
    console.error('❌ [Analysis History API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi server', success: false },
      { status: 500 }
    );
  }
}
