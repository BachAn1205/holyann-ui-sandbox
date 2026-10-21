import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Check current data
    const stagesCount = await prisma.checklist_stages.count();
    const tasksCount = await prisma.checklist_tasks.count();

    if (stagesCount > 0 && tasksCount > 0) {
      return NextResponse.json({
        success: true,
        message: 'Data already exists',
        data: { stages: stagesCount, tasks: tasksCount }
      });
    }

    // Clear existing data
    await prisma.student_task_progress.deleteMany({});
    await prisma.checklist_tasks.deleteMany({});
    await prisma.checklist_stages.deleteMany({});

    // Create stages
    const stages = await prisma.checklist_stages.createMany({
      data: [
        { name: 'Chuẩn bị hồ sơ cơ bản', description: 'Thu thập và chuẩn bị các tài liệu cần thiết cho hồ sơ du học', order_index: 1, is_default: true },
        { name: 'Viết essay & Personal Statement', description: 'Soạn thảo và hoàn thiện các bài essay, personal statement', order_index: 2, is_default: true },
        { name: 'Recommendation Letters', description: 'Liên hệ và nhận thư giới thiệu từ thầy cô', order_index: 3, is_default: true },
        { name: 'Nộp đơn đăng ký', description: 'Hoàn tất và nộp đơn vào các trường đại học', order_index: 4, is_default: true },
        { name: 'Phỏng vấn & Follow-up', description: 'Chuẩn bị phỏng vấn và theo dõi kết quả', order_index: 5, is_default: true },
        { name: 'Xin visa & Chuẩn bị xuất cảnh', description: 'Xin visa du học và chuẩn bị trước khi đi', order_index: 6, is_default: true },
      ]
    });

    // Get stage IDs
    const stageRecords = await prisma.checklist_stages.findMany({ orderBy: { order_index: 'asc' } });
    const [stage1, stage2, stage3, stage4, stage5, stage6] = stageRecords;

    // Create tasks (each needs id for UUID PK)
    const taskRows = [
        // Stage 1 - 5 tasks
        { stage_id: stage1.id, title: 'Scan bảng điểm học tập (Transcript)', description: 'Scan bảng điểm các năm học THPT, có xác nhận của nhà trường', is_required: true, order_index: 1 },
        { stage_id: stage1.id, title: 'Chuẩn bị chứng chỉ tiếng Anh', description: 'IELTS/TOEFL score report', link_to: 'https://www.ielts.org/', is_required: true, order_index: 2 },
        { stage_id: stage1.id, title: 'Scan hộ chiếu (Passport)', description: 'Hộ chiếu còn hạn ít nhất 6 tháng', is_required: true, order_index: 3 },
        { stage_id: stage1.id, title: 'Chuẩn bị CV/Resume', description: 'CV học thuật liệt kê các thành tích', is_required: true, order_index: 4 },
        { stage_id: stage1.id, title: 'Chứng chỉ SAT/ACT (nếu có)', description: 'Điểm thi chuẩn hóa SAT hoặc ACT', is_required: false, order_index: 5 },

        // Stage 2 - 6 tasks
        { stage_id: stage2.id, title: 'Brainstorm ideas cho Personal Statement', description: 'Lên ý tưởng về câu chuyện cá nhân', is_required: true, order_index: 1 },
        { stage_id: stage2.id, title: 'Viết bản thảo Personal Statement', description: 'Bản thảo đầu tiên, khoảng 500-650 từ', is_required: true, order_index: 2 },
        { stage_id: stage2.id, title: 'Review và chỉnh sửa Personal Statement lần 1', description: 'Mentor/Teacher review và đưa feedback', is_required: true, order_index: 3 },
        { stage_id: stage2.id, title: 'Hoàn thiện Personal Statement (Final Draft)', description: 'Bản hoàn chỉnh sau khi chỉnh sửa', is_required: true, order_index: 4 },
        { stage_id: stage2.id, title: 'Viết Supplemental Essays (nếu có)', description: 'Các essay bổ sung theo yêu cầu của từng trường', is_required: false, order_index: 5 },
        { stage_id: stage2.id, title: 'Viết Why This College Essay', description: 'Essay giải thích lý do chọn trường này', is_required: false, order_index: 6 },

        // Stage 3 - 5 tasks
        { stage_id: stage3.id, title: 'Chọn người viết thư giới thiệu', description: 'Chọn 2-3 thầy cô hoặc người có uy tín', is_required: true, order_index: 1 },
        { stage_id: stage3.id, title: 'Gửi yêu cầu viết thư giới thiệu', description: 'Gửi email lịch sự, đính kèm CV', is_required: true, order_index: 2 },
        { stage_id: stage3.id, title: 'Cung cấp thông tin hỗ trợ cho người viết', description: 'Gửi brag sheet, thành tích, mục tiêu', is_required: true, order_index: 3 },
        { stage_id: stage3.id, title: 'Follow-up và nhận thư giới thiệu', description: 'Nhắc nhở nhẹ nhàng nếu quá hạn', is_required: true, order_index: 4 },
        { stage_id: stage3.id, title: 'Upload thư giới thiệu lên portal', description: 'Upload hoặc submit thư qua hệ thống của trường', is_required: true, order_index: 5 },

        // Stage 4 - 7 tasks
        { stage_id: stage4.id, title: 'Tạo tài khoản Common App/Coalition App', description: 'Đăng ký tài khoản trên hệ thống nộp đơn chung', link_to: 'https://www.commonapp.org/', is_required: true, order_index: 1 },
        { stage_id: stage4.id, title: 'Điền thông tin cá nhân trên portal', description: 'Hoàn tất phần thông tin cá nhân, gia đình, học vấn', is_required: true, order_index: 2 },
        { stage_id: stage4.id, title: 'Chọn danh sách trường nộp đơn', description: 'Chọn 8-12 trường (Reach, Match, Safety)', is_required: true, order_index: 3 },
        { stage_id: stage4.id, title: 'Upload tất cả tài liệu lên portal', description: 'Transcript, test scores, essays, CV', is_required: true, order_index: 4 },
        { stage_id: stage4.id, title: 'Review lại toàn bộ đơn trước khi submit', description: 'Kiểm tra kỹ lưỡng, không có lỗi chính tả', is_required: true, order_index: 5 },
        { stage_id: stage4.id, title: 'Submit đơn và thanh toán phí', description: 'Nộp đơn và thanh toán application fee', is_required: true, order_index: 6 },
        { stage_id: stage4.id, title: 'Nhận email xác nhận từ trường', description: 'Kiểm tra email confirmation và portal', is_required: true, order_index: 7 },

        // Stage 5 - 6 tasks
        { stage_id: stage5.id, title: 'Đăng ký lịch phỏng vấn (nếu có)', description: 'Một số trường yêu cầu/khuyến khích phỏng vấn', is_required: false, order_index: 1 },
        { stage_id: stage5.id, title: 'Chuẩn bị câu hỏi phỏng vấn thường gặp', description: 'Tập trả lời các câu hỏi: Why this school?', is_required: false, order_index: 2 },
        { stage_id: stage5.id, title: 'Mock interview với Mentor', description: 'Luyện tập phỏng vấn giả định với Mentor', is_required: false, order_index: 3 },
        { stage_id: stage5.id, title: 'Tham gia phỏng vấn', description: 'Phỏng vấn online/offline', is_required: false, order_index: 4 },
        { stage_id: stage5.id, title: 'Gửi thank-you email sau phỏng vấn', description: 'Gửi email cảm ơn người phỏng vấn trong vòng 24h', is_required: false, order_index: 5 },
        { stage_id: stage5.id, title: 'Kiểm tra trạng thái đơn trên portal', description: 'Thường xuyên check portal', is_required: true, order_index: 6 },

        // Stage 6 - 10 tasks
        { stage_id: stage6.id, title: 'Nhận thư chấp nhận từ trường', description: 'Chọn trường và xác nhận nhập học', is_required: true, order_index: 1 },
        { stage_id: stage6.id, title: 'Nhận I-20 (Form cho visa F-1)', description: 'Trường gửi I-20, cần thiết để xin visa du học Mỹ', is_required: true, order_index: 2 },
        { stage_id: stage6.id, title: 'Đóng SEVIS Fee', description: 'Thanh toán phí SEVIS I-901 trước khi xin visa', link_to: 'https://www.fmjfee.com/', is_required: true, order_index: 3 },
        { stage_id: stage6.id, title: 'Điền form DS-160 (Visa application)', description: 'Điền đơn xin visa trực tuyến', link_to: 'https://ceac.state.gov/genniv/', is_required: true, order_index: 4 },
        { stage_id: stage6.id, title: 'Đặt lịch phỏng vấn visa', description: 'Book lịch phỏng vấn tại Đại sứ quán', is_required: true, order_index: 5 },
        { stage_id: stage6.id, title: 'Chuẩn bị tài liệu xin visa', description: 'Hộ chiếu, I-20, DS-160, chứng minh tài chính', is_required: true, order_index: 6 },
        { stage_id: stage6.id, title: 'Tham gia phỏng vấn visa', description: 'Phỏng vấn tại Đại sứ quán', is_required: true, order_index: 7 },
        { stage_id: stage6.id, title: 'Nhận visa và chuẩn bị hành lý', description: 'Sau khi được duyệt, nhận visa', is_required: true, order_index: 8 },
        { stage_id: stage6.id, title: 'Book vé máy bay và chỗ ở', description: 'Đặt vé máy bay, liên hệ với trường về dormitory', is_required: true, order_index: 9 },
        { stage_id: stage6.id, title: 'Tham gia Orientation (nếu có)', description: 'Đăng ký tham gia các buổi orientation', is_required: false, order_index: 10 },
    ];
    await prisma.checklist_tasks.createMany({
      data: taskRows.map((row) => ({ id: randomUUID(), ...row })),
    });

    // Verify
    const finalStagesCount = await prisma.checklist_stages.count();
    const finalTasksCount = await prisma.checklist_tasks.count();

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      data: {
        stages: finalStagesCount,
        tasks: finalTasksCount
      }
    });

  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
