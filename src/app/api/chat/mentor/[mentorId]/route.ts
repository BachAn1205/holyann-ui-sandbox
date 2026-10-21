import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth/get-user';

/**
 * GET /api/chat/mentor/[mentorId]
 * Lấy thông tin chi tiết mentor cho học viên trong trang chat
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mentorId: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { mentorId } = await params;

    // Get mentor info with user details
    const mentor = await prisma.mentors.findUnique({
      where: {
        user_id: mentorId
      },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone_number: true,
            avatar_url: true,
            role: true
          }
        }
      }
    });

    if (!mentor) {
      return NextResponse.json(
        { error: 'Mentor not found' },
        { status: 404 }
      );
    }

    // Format achievements from JSON
    let achievements: string[] = [];
    if (mentor.outstanding_achievements) {
      try {
        const parsed = mentor.outstanding_achievements as any[];
        achievements = parsed.map((a: any) =>
          typeof a === 'string' ? a : (a.title || a.description || JSON.stringify(a))
        );
      } catch {
        achievements = [];
      }
    }

    // Format expertises from JSON
    let expertises: string[] = [];
    if (mentor.expertises) {
      try {
        expertises = mentor.expertises as string[];
      } catch {
        expertises = [];
      }
    }

    // Format response
    const formattedMentor = {
      id: mentor.user_id,
      full_name: mentor.users.full_name,
      email: mentor.users.email,
      phone_number: mentor.users.phone_number,
      avatar_url: mentor.users.avatar_url,
      specialization: mentor.specialization,
      bio: mentor.bio,
      linkedin_url: mentor.linkedin_url,
      university_name: mentor.university_name,
      degree: mentor.degree,
      major: mentor.major,
      graduation_year: mentor.graduation_year,
      current_company: mentor.current_company,
      current_job_title: mentor.current_job_title,
      years_of_experience: mentor.years_of_experience,
      expertises: expertises,
      achievements: achievements
    };

    return NextResponse.json({
      success: true,
      mentor: formattedMentor
    });

  } catch (error) {
    console.error('Error fetching mentor info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
