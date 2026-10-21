import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-config";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const studentId = session.user.id;

    // Parallel queries for all 7 steps + terms check
    const [
      student,
      termsTask,
      profileAnalysisCount,
      riasecTest,
      mbtiTest,
      gritTest,
      targetGoalCount,
      cvDocCount,
      essayCount,
    ] = await Promise.all([
      // Step 2: Check personal info (date_of_birth)
      prisma.students.findUnique({
        where: { user_id: studentId },
        select: { date_of_birth: true },
      }),
      // Step 1: Find Terms Task and Progress
      prisma.checklist_tasks.findFirst({
        where: {
          link_to: {
            contains: "terms",
            mode: "insensitive",
          },
        },
        include: {
          student_task_progress: {
            where: { student_id: studentId },
          },
        },
      }),
      // Step 3: Profile analysis
      prisma.profile_analyses.count({
        where: { student_id: studentId },
      }),
      // Step 4: RIASEC test
      prisma.riasec_tests.findUnique({
        where: { student_id: studentId },
        select: { status: true },
      }),
      // Step 4: MBTI test
      prisma.mbti_tests.findUnique({
        where: { student_id: studentId },
        select: { status: true },
      }),
      // Step 4: GRIT test
      prisma.grit_tests.findUnique({
        where: { student_id: studentId },
        select: { status: true },
      }),
      // Step 5: Target goals (faculty targets)
      prisma.student_target_goals.count({
        where: { student_id: studentId },
      }),
      // Step 6: CV documents
      prisma.student_cv_documents.count({
        where: { student_id: studentId },
      }),
      // Step 7: Essays
      prisma.essays.count({
        where: { student_id: studentId },
      }),
    ]);

    const isTermsCompleted =
      termsTask?.student_task_progress?.[0]?.status === "COMPLETED";
    const testCompleted =
      riasecTest?.status === "COMPLETED" ||
      mbtiTest?.status === "COMPLETED" ||
      gritTest?.status === "COMPLETED";

    const steps = [
      {
        id: 1,
        title: "Đọc nội quy",
        description:
          "Hiểu rõ quy định sử dụng nền tảng để bắt đầu hành trình đúng cách.",
        is_completed: isTermsCompleted,
        href: "/student/terms-of-service",
      },
      {
        id: 2,
        title: "Điền thông tin cá nhân",
        description:
          "Hoàn thiện hồ sơ cá nhân để Holie Mate có thể phân tích chính xác hơn.",
        is_completed: !!student?.date_of_birth,
        href: "/student/profile",
      },
      {
        id: 3,
        title: "Phân tích hồ sơ",
        description:
          "Nhận đánh giá toàn diện về điểm mạnh và tiềm năng của bạn.",
        is_completed: profileAnalysisCount > 0,
        href: "/student/profile-analysis",
      },
      {
        id: 4,
        title: "Làm bài kiểm tra",
        description:
          "Khám phá tính cách và xu hướng nghề nghiệp với RIASEC, MBTI hoặc GRIT.",
        is_completed: testCompleted,
        href: "/student/tests",
      },
      {
        id: 5,
        title: "Phân tích ngành học",
        description:
          "Holie Mate gợi ý ngành phù hợp dựa trên hồ sơ và kết quả bài thi của bạn.",
        is_completed: targetGoalCount > 0,
        href: "/student/target",
      },
      {
        id: 6,
        title: "Đăng tải CV",
        description:
          "Đăng tải CV để nhận phân tích và cải thiện chuyên sâu từ Holie Mate.",
        is_completed: cvDocCount > 0,
        href: "/student/manage-upload",
      },
      {
        id: 7,
        title: "Đăng tải Bài luận",
        description:
          "Nộp bài luận để được Holie Mate và Cố vấn hỗ trợ chỉnh sửa tốt nhất.",
        is_completed: essayCount > 0,
        href: "/student/manage-upload",
      },
    ];

    const completedCount = steps.filter((s) => s.is_completed).length;
    const progress_percentage = Math.round(
      (completedCount / steps.length) * 100,
    );

    return NextResponse.json({
      steps,
      progress_percentage,
      completed_count: completedCount,
    });
  } catch (e) {
    console.error("[Onboarding Progress API]", e);
    return NextResponse.json(
      { error: "Lỗi tải tiến trình onboarding" },
      { status: 500 },
    );
  }
}
