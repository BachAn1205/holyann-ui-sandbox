import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { prisma } from '@/lib/prisma';
import { formatYearlyBudgetLabel } from '@/lib/yearly-budget';

function toIsoDate(date?: Date | null) {
  if (!date) return null;
  return date.toISOString().split('T')[0];
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId } = await params;

    const assignment = await prisma.mentor_assignments.findFirst({
      where: { mentor_id: session.user.id, student_id: studentId, status: 'ACTIVE' },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [student, academicProfile, background, targetGoals, schoolWishlist, facultyWishlist, parents] =
      await Promise.all([
        prisma.students.findUnique({
          where: { user_id: studentId },
          include: {
            users: {
              select: {
                id: true,
                full_name: true,
                email: true,
                phone_number: true,
                avatar_url: true,
              },
            },
          },
        }),
        prisma.student_academic_profiles.findUnique({
          where: { student_id: studentId },
        }),
        prisma.student_backgrounds.findUnique({
          where: { student_id: studentId },
          include: {
            subject_scores: true,
            academic_awards: true,
            non_academic_awards: true,
            academic_extracurriculars: true,
            non_academic_extracurriculars: true,
            research_experiences: true,
            work_experiences: true,
            personal_projects: true,
          },
        }),
        prisma.student_target_goals.findMany({
          where: { student_id: studentId },
          orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
        }),
        prisma.school_wishlist.findMany({
          where: { student_id: studentId },
          orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
          include: {
            university_rankings: {
              select: {
                id: true,
                name: true,
                country: true,
                qs_rank: true,
              },
            },
          },
        }),
        prisma.faculty_wishlist.findMany({
          where: { student_id: studentId },
          orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
        }),
        prisma.student_parents.findMany({
          where: { student_id: studentId },
          orderBy: { created_at: 'asc' },
        }),
      ]);

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({
      student: {
        id: student.users.id,
        full_name: student.users.full_name,
        email: student.users.email,
        phone_number: student.users.phone_number,
        avatar_url: student.users.avatar_url,
        date_of_birth: toIsoDate(student.date_of_birth),
        current_address: student.current_address,
        current_school: student.current_school,
        current_grade: student.current_grade,
        yearly_budget: student.yearly_budget != null ? Number(student.yearly_budget) : null,
        yearly_budget_currency: student.yearly_budget_currency,
        talents: student.talents,
        hobbies: student.hobbies,
        personal_desire: student.personal_desire,
        yearly_budget_label: formatYearlyBudgetLabel(
          student.yearly_budget != null ? Number(student.yearly_budget) : null,
          student.yearly_budget_currency,
        ),
      },
      parents: parents.map((p) => ({
        id: p.id,
        full_name: p.full_name,
        relationship: p.relationship,
        phone_number: p.phone_number,
        email: p.email,
        job_title: p.job_title,
      })),
      academicProfile: academicProfile
        ? {
            gpa_transcript_details: academicProfile.gpa_transcript_details,
            english_certificates: academicProfile.english_certificates,
            standardized_tests: academicProfile.standardized_tests,
            proof_images: academicProfile.proof_images,
          }
        : null,
      targetGoals: targetGoals.map((goal) => ({
        id: goal.id,
        faculty_name: goal.faculty_name,
        university_name: goal.university_name,
        university_id: goal.university_id,
        sort_order: goal.sort_order,
      })),
      schoolWishlist: schoolWishlist.map((item) => ({
        id: item.id,
        university_id: item.university_id,
        sort_order: item.sort_order,
        university_name: item.university_rankings?.name ?? null,
        country: item.university_rankings?.country ?? null,
        qs_rank: item.university_rankings?.qs_rank ?? null,
      })),
      facultyWishlist: facultyWishlist.map((item) => ({
        id: item.id,
        faculty_name: item.faculty_name,
        sort_order: item.sort_order,
      })),
      subjectScores: (background?.subject_scores ?? []).map((s) => ({
        id: s.id,
        subject: s.subject,
        score: s.score,
        year: s.year,
        semester: s.semester,
        group: s.group,
      })),
      activities: {
        academic_extracurriculars: background?.academic_extracurriculars ?? [],
        non_academic_extracurriculars: background?.non_academic_extracurriculars ?? [],
        research_experiences: background?.research_experiences ?? [],
        work_experiences: background?.work_experiences ?? [],
        personal_projects: background?.personal_projects ?? [],
      },
      achievements: {
        academic_awards: background?.academic_awards ?? [],
        non_academic_awards: background?.non_academic_awards ?? [],
      },
    });
  } catch (error) {
    console.error('[mentor profile-detail] GET', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

