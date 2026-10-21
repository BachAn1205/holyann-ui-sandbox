import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/mentor/profile
 * Lấy thông tin hồ sơ mentor từ database
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Lấy thông tin mentor từ database
    const mentor = await prisma.mentors.findUnique({
      where: { user_id: userId },
      include: {
        users: {
          select: {
            full_name: true,
            email: true,
            phone_number: true,
            avatar_url: true,
          },
        },
      },
    });

    if (!mentor) {
      return NextResponse.json(
        { error: 'Hồ sơ Cố vấn not found' },
        { status: 404 }
      );
    }

    // Format response data
    const profileData = {
      user_id: mentor.user_id,
      user: {
        full_name: mentor.users.full_name,
        email: mentor.users.email,
        phone_number: mentor.users.phone_number,
        avatar_url: mentor.users.avatar_url,
      },
      specialization: mentor.specialization,
      bio: mentor.bio,
      linkedin_url: mentor.linkedin_url,
      website_url: mentor.website_url,
      university_name: mentor.university_name,
      degree: mentor.degree,
      major: mentor.major,
      graduation_year: mentor.graduation_year,
      current_company: mentor.current_company,
      current_job_title: mentor.current_job_title,
      years_of_experience: mentor.years_of_experience,
      expertises: mentor.expertises || [],
      outstanding_achievements: mentor.outstanding_achievements || [],
      is_accepting_students: mentor.is_accepting_students,
      max_students: mentor.max_students,
      rating: mentor.rating,
    };

    return NextResponse.json(profileData);
  } catch (error) {
    console.error('Error fetching mentor profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/mentor/profile
 * Cập nhật thông tin hồ sơ mentor
 */
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();

    // Validate mentor exists
    const existingMentor = await prisma.mentors.findUnique({
      where: { user_id: userId },
    });

    if (!existingMentor) {
      return NextResponse.json(
        { error: 'Hồ sơ Cố vấn not found' },
        { status: 404 }
      );
    }

    // Update users table (basic info)
    if (body.user) {
      await prisma.users.update({
        where: { id: userId },
        data: {
          full_name: body.user.full_name,
          phone_number: body.user.phone_number,
          avatar_url: body.user.avatar_url,
        },
      });
    }

    // Update mentors table (professional info)
    const updatedMentor = await prisma.mentors.update({
      where: { user_id: userId },
      data: {
        bio: body.bio,
        linkedin_url: body.linkedin_url,
        website_url: body.website_url,
        university_name: body.university_name,
        degree: body.degree,
        major: body.major,
        graduation_year: body.graduation_year,
        current_company: body.current_company,
        current_job_title: body.current_job_title,
        years_of_experience: body.years_of_experience,
        expertises: body.expertises,
        outstanding_achievements: body.outstanding_achievements,
        updated_at: new Date(),
      },
      include: {
        users: {
          select: {
            full_name: true,
            email: true,
            phone_number: true,
            avatar_url: true,
          },
        },
      },
    });

    // Format response
    const profileData = {
      user_id: updatedMentor.user_id,
      user: {
        full_name: updatedMentor.users.full_name,
        email: updatedMentor.users.email,
        phone_number: updatedMentor.users.phone_number,
        avatar_url: updatedMentor.users.avatar_url,
      },
      specialization: updatedMentor.specialization,
      bio: updatedMentor.bio,
      linkedin_url: updatedMentor.linkedin_url,
      website_url: updatedMentor.website_url,
      university_name: updatedMentor.university_name,
      degree: updatedMentor.degree,
      major: updatedMentor.major,
      graduation_year: updatedMentor.graduation_year,
      current_company: updatedMentor.current_company,
      current_job_title: updatedMentor.current_job_title,
      years_of_experience: updatedMentor.years_of_experience,
      expertises: updatedMentor.expertises,
      outstanding_achievements: updatedMentor.outstanding_achievements,
      rating: updatedMentor.rating,
    };

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: profileData,
    });
  } catch (error) {
    console.error('Error updating mentor profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

