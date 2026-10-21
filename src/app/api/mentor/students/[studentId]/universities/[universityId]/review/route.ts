import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ studentId: string; universityId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId, universityId } = await params;
    const uniNumId = parseInt(universityId, 10);
    if (isNaN(uniNumId)) {
      return NextResponse.json({ error: 'Invalid university ID' }, { status: 400 });
    }
    
    // Verify mentor has access to this student
    const assignment = await prisma.mentor_assignments.findFirst({
      where: { mentor_id: session.user.id, student_id: studentId },
    });
    if (!assignment) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const action = body.action as 'APPROVE' | 'REJECT';

    if (action === 'APPROVE') {
      await prisma.university_rankings.update({
        where: { id: uniNumId },
        data: { status: 'APPROVED' },
      });
    } else if (action === 'REJECT') {
      await prisma.university_rankings.delete({
        where: { id: uniNumId },
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Invalidate Redis Cache
    if (redis) {
      try {
        await redis.del('universities:approved');
        await redis.del('universities:countries:approved');
        await redis.del(`university:detail:${uniNumId}`);
      } catch (err) {
        console.error('[Redis] Failed to clear university caches on mentor review:', err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[university review] PATCH', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
