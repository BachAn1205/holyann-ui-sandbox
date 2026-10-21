import {NextRequest, NextResponse} from 'next/server'
import {JWTService} from '@/lib/services/jwt.service'
import {prisma} from '@/lib/prisma'

/**
 * GET /api/checklist/progress
 * Lấy tiến độ checklist của học sinh dựa trên dữ liệu thực tế trong database
 */
export async function GET(request: NextRequest) {
    try {
        // Lấy token từ header hoặc cookie
        const authHeader = request.headers.get('Authorization')
        const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth-token')?.value

        if (!token) {
            return NextResponse.json(
                {success: false, message: 'Không tìm thấy token xác thực'},
                {status: 401}
            )
        }

        // Xác thực token
        const payload = JWTService.verifyToken(token)
        if (!payload) {
            return NextResponse.json(
                {success: false, message: 'Token không hợp lệ'},
                {status: 401}
            )
        }

        const userId = payload.userId

        // Lấy thông tin student và các tests
        const student = await prisma.students.findUnique({
            where: {user_id: userId},
            include: {
                grit_tests: true,
                mbti_tests: true,
                riasec_tests: true,
                student_backgrounds: {
                    include: {
                        academic_awards: true,
                        academic_extracurriculars: true,
                        non_academic_awards: true,
                        non_academic_extracurriculars: true,
                        research_experiences: true,
                        work_experiences: true,
                        subject_scores: true,
                    }
                },
                student_academic_profiles: true,
            }
        })

        if (!student) {
            return NextResponse.json(
                {success: false, message: 'Không tìm thấy thông tin học sinh'},
                {status: 404}
            )
        }

        // Tính toán tiến độ các task
        const progress = {
            // Task 1-3: MBTI Test
            mbtiCompleted: student.mbti_tests?.status === 'COMPLETED',

            // Task 1-4: Grit Test
            gritCompleted: student.grit_tests?.status === 'COMPLETED',

            // Task 1-5: RIASEC Test
            riasecCompleted: student.riasec_tests?.status === 'COMPLETED',

            // Task 2-1: Transcript (kiểm tra có subject_scores không)
            transcriptUploaded: student.student_backgrounds?.subject_scores &&
                               student.student_backgrounds.subject_scores.length > 0,

            // Task 2-2: English certificates
            englishCertUploaded: student.student_academic_profiles?.english_certificates &&
                                Object.keys(student.student_academic_profiles.english_certificates as object).length > 0,

            // Task 2-3: Skills (có extracurriculars hoặc awards)
            skillsUpdated: (student.student_backgrounds?.academic_extracurriculars?.length || 0) > 0 ||
                          (student.student_backgrounds?.non_academic_extracurriculars?.length || 0) > 0,

            // Task 2-9: SAT/ACT (kiểm tra standardized_tests)
            standardizedTestUploaded: student.student_academic_profiles?.standardized_tests &&
                                     Object.keys(student.student_academic_profiles.standardized_tests as object).length > 0,

            // Task 2-10: Extracurricular activities (vai trò lãnh đạo)
            leadershipActivities: (student.student_backgrounds?.academic_extracurriculars?.length || 0) > 0 ||
                                 (student.student_backgrounds?.non_academic_extracurriculars?.length || 0) > 0,

            // Thống kê tổng quan
            stats: {
                totalAwards: (student.student_backgrounds?.academic_awards?.length || 0) +
                            (student.student_backgrounds?.non_academic_awards?.length || 0),
                totalExtracurriculars: (student.student_backgrounds?.academic_extracurriculars?.length || 0) +
                                      (student.student_backgrounds?.non_academic_extracurriculars?.length || 0),
                totalResearch: student.student_backgrounds?.research_experiences?.length || 0,
                totalWorkExp: student.student_backgrounds?.work_experiences?.length || 0,
            }
        }

        return NextResponse.json({
            success: true,
            progress,
            student: {
                id: student.user_id,
                currentSchool: student.current_school,
                currentGrade: student.current_grade,
                targetCountry: null,
                intendedMajor: null,
            }
        })

    } catch (error) {
        console.error('❌ [Tiến độ Progress] Error:', error)
        return NextResponse.json(
            {success: false, message: 'Đã xảy ra lỗi khi lấy tiến độ'},
            {status: 500}
        )
    }
}
