import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { getMentorStudents } from '@/actions/mentor';

/**
 * GET /api/mentor/students
 * Lay danh sach hoc vien duoc gan cho Cố vấn
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const students = await getMentorStudents(session.user.id);

    return NextResponse.json(students);
  } catch (error) {
    console.error('Error fetching assigned students:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
