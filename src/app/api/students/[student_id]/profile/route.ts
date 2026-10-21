import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStudentRouteAccess, SAFE_USER_PROFILE_SELECT } from '@/lib/auth-utils';
import { parseYearlyBudgetFromStudentInfo } from '@/lib/yearly-budget';

function safeDate(date: any): string | null {
    if (!date) return null;
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return null;
        return d.toISOString().split('T')[0];
    } catch {
        return null;
    }
}

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ student_id: string }> }
) {
    try {
        const { student_id } = await params;
        const currentUser = await requireStudentRouteAccess(student_id);

        const user = await prisma.users.findUnique({
            where: { id: currentUser.id },
            select: SAFE_USER_PROFILE_SELECT,
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Không tìm thấy người dùng' },
                { status: 404 }
            );
        }

        let studentRecord = await prisma.students.findUnique({
            where: { user_id: currentUser.id }
        });

        if (!studentRecord) {
            try {
                studentRecord = await prisma.students.create({
                    data: {
                        user_id: currentUser.id,
                    },
                });
            } catch (createError) {
                console.error('❌ [API] Failed to create student record:', createError);
            }
        }

        let background = null;
        let academicProfile = null;
        let parents: any[] = [];
        let skills: any[] = [];

        if (studentRecord) {
            [background, academicProfile, parents, skills] = await Promise.all([
                prisma.student_backgrounds.findUnique({
                    where: { student_id: currentUser.id },
                    include: {
                        academic_awards: true,
                        academic_extracurriculars: true,
                        non_academic_awards: true,
                        non_academic_extracurriculars: true,
                        research_experiences: true,
                        work_experiences: true,
                        subject_scores: true,
                        personal_projects: true,
                    }
                }),
                prisma.student_academic_profiles.findUnique({
                    where: { student_id: currentUser.id }
                }),
                prisma.student_parents.findMany({
                    where: { student_id: currentUser.id }
                }),
                prisma.student_skills.findMany({
                    where: { student_id: currentUser.id }
                }),
            ]);
        }

        const basicInfoComplete = !!(
            user.full_name &&
            user.email &&
            user.phone_number &&
            studentRecord?.date_of_birth
        );

        const hasAcademicInfo = !!(
            academicProfile?.gpa_transcript_details ||
            academicProfile?.english_certificates ||
            academicProfile?.standardized_tests
        );

        const hasExtracurriculars = !!(
            background?.academic_extracurriculars?.length ||
            background?.non_academic_extracurriculars?.length ||
            background?.academic_awards?.length ||
            background?.non_academic_awards?.length ||
            background?.work_experiences?.length ||
            background?.research_experiences?.length
        );

        const targetGoalsRows = await prisma.student_target_goals.findMany({
            where: { student_id: currentUser.id },
            orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
            select: {
                id: true,
                faculty_name: true,
                university_id: true,
                university_name: true,
                sort_order: true,
            },
        });

        return NextResponse.json({
            basicInfo: {
                full_name: user.full_name || null,
                email: user.email || null,
                phone_number: user.phone_number || null,
                date_of_birth: safeDate(studentRecord?.date_of_birth),
                current_address: studentRecord?.current_address || null,
                avatar_url: user.avatar_url || null,
                status: basicInfoComplete ? 'Hoàn tất' : 'Cần bổ sung'
            },
            studentInfo: {
                current_school: studentRecord?.current_school || null,
                current_grade: studentRecord?.current_grade || null,
                yearly_budget:
                    studentRecord?.yearly_budget != null
                        ? Number(studentRecord.yearly_budget)
                        : null,
                yearly_budget_currency: studentRecord?.yearly_budget_currency ?? null,
                talents: studentRecord?.talents || null,
                hobbies: studentRecord?.hobbies || null,
                personal_desire: studentRecord?.personal_desire || null,
                target_faculty_name: studentRecord?.target_faculty_name || null,
                target_university_id: studentRecord?.target_university_id ?? null,
                target_university_name: studentRecord?.target_university_name || null,
                target_set_at: studentRecord?.target_set_at?.toISOString() ?? null,
            },
            targetGoals: targetGoalsRows.map((g) => ({
                id: g.id,
                faculty_name: g.faculty_name,
                university_id: g.university_id,
                university_name: g.university_name,
                sort_order: g.sort_order,
            })),
            academicProfile: academicProfile || null,
            background: background || null,
            parents,
            skills,
            status: {
                basicInfoComplete,
                hasAcademicInfo,
                hasExtracurriculars,
                overallStatus: (basicInfoComplete && hasAcademicInfo && hasExtracurriculars)
                    ? 'Hoàn tất'
                    : 'Cần bổ sung',
                isNewStudent: !studentRecord || (!hasAcademicInfo && !hasExtracurriculars)
            }
        });
    } catch (error: any) {
        const status = error instanceof Error && (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') ? 401 : 500;
        return NextResponse.json(
            { error: status === 401 ? 'Unauthorized' : 'Lỗi khi lấy thông tin học sinh', details: error?.message },
            { status }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ student_id: string }> }
) {
    try {
        const { student_id } = await params;
        const currentUser = await requireStudentRouteAccess(student_id);
        const body = await request.json();
        const { basicInfo, studentInfo, avatarUrl } = body;

        if (avatarUrl !== undefined) {
            await prisma.users.update({
                where: { id: currentUser.id },
                data: {
                    avatar_url: avatarUrl
                }
            });
        }

        if (basicInfo) {
            const userUpdate: any = {};
            if (basicInfo.full_name) userUpdate.full_name = basicInfo.full_name;
            if (basicInfo.phone_number) userUpdate.phone_number = basicInfo.phone_number;
            if (basicInfo.email) userUpdate.email = basicInfo.email;
            if (basicInfo.avatar_url !== undefined) userUpdate.avatar_url = basicInfo.avatar_url;

            if (Object.keys(userUpdate).length > 0) {
                await prisma.users.update({
                    where: { id: currentUser.id },
                    data: userUpdate
                });
            }

            const studentBasicUpdate: any = {};
            if (basicInfo.current_school) studentBasicUpdate.current_school = basicInfo.current_school;
            if (basicInfo.current_grade) studentBasicUpdate.current_grade = basicInfo.current_grade;
            if (basicInfo.current_address) studentBasicUpdate.current_address = basicInfo.current_address;
            if (basicInfo.talents) studentBasicUpdate.talents = basicInfo.talents;
            if (basicInfo.hobbies) studentBasicUpdate.hobbies = basicInfo.hobbies;
            if (basicInfo.date_of_birth) {
                const dob = new Date(basicInfo.date_of_birth);
                if (!Number.isNaN(dob.getTime())) studentBasicUpdate.date_of_birth = dob;
            }

            if (Object.keys(studentBasicUpdate).length > 0) {
                await prisma.students.update({
                    where: { user_id: currentUser.id },
                    data: studentBasicUpdate
                });
            }
        }

        if (studentInfo) {
            const parseDob = (val: string | undefined) => {
                if (!val) return undefined;
                const d = new Date(val);
                return Number.isNaN(d.getTime()) ? undefined : d;
            };
            const si = studentInfo as Record<string, unknown>;
            let budgetPatch: ReturnType<typeof parseYearlyBudgetFromStudentInfo> | undefined;
            if ('yearly_budget' in si || 'yearly_budget_currency' in si) {
                try {
                    budgetPatch = parseYearlyBudgetFromStudentInfo(si);
                } catch (e) {
                    if (e instanceof Error && e.message === 'INVALID_BUDGET_AMOUNT') {
                        return NextResponse.json(
                            {
                                success: false,
                                error:
                                    'Ngân sách phải là số dương (ví dụ 30000). Không ghi chữ hay đơn vị tiền trong ô số — chọn USD hoặc VND ở ô bên cạnh.',
                            },
                            { status: 400 }
                        );
                    }
                    if (e instanceof Error && e.message === 'INVALID_CURRENCY') {
                        return NextResponse.json(
                            {
                                success: false,
                                error: 'Loại tiền chỉ hỗ trợ USD hoặc VND.',
                            },
                            { status: 400 }
                        );
                    }
                    throw e;
                }
            }
            await prisma.students.upsert({
                where: { user_id: currentUser.id },
                update: {
                    date_of_birth: parseDob(studentInfo.date_of_birth),
                    current_address: studentInfo.current_address || undefined,
                    current_school: studentInfo.current_school || undefined,
                    current_grade: studentInfo.current_grade || undefined,
                    ...(budgetPatch
                        ? {
                              yearly_budget: budgetPatch.yearly_budget,
                              yearly_budget_currency: budgetPatch.yearly_budget_currency,
                          }
                        : {}),
                    talents: studentInfo.talents || undefined,
                    hobbies: studentInfo.hobbies || undefined,
                    personal_desire: studentInfo.personal_desire || undefined,
                },
                create: {
                    user_id: currentUser.id,
                    date_of_birth: parseDob(studentInfo.date_of_birth),
                    current_address: studentInfo.current_address || undefined,
                    current_school: studentInfo.current_school || undefined,
                    current_grade: studentInfo.current_grade || undefined,
                    ...(budgetPatch
                        ? {
                              yearly_budget: budgetPatch.yearly_budget,
                              yearly_budget_currency: budgetPatch.yearly_budget_currency,
                          }
                        : {}),
                    talents: studentInfo.talents || undefined,
                    hobbies: studentInfo.hobbies || undefined,
                    personal_desire: studentInfo.personal_desire || undefined,
                }
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Cập nhật thông tin thành công',
            updatedFields: body
        });
    } catch (error) {
        const status = error instanceof Error && (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') ? 401 : 500;
        return NextResponse.json(
            {
                success: false,
                error: status === 401 ? 'Unauthorized' : error instanceof Error ? error.message : 'Lỗi khi cập nhật thông tin'
            },
            { status }
        );
    }
}
