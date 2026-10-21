import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/dashboard-stats
 * Thống kê dashboard admin: total users, students, mentors, marketing, admins, active assignments, new users 7 days.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      students,
      mentors,
      admins,
      marketing,
      activeAssignments,
      newUsersLast7Days,
      subscriptionFree,
      subscriptionPlus,
      subscriptionPremium,
      usersByDay,
    ] = await Promise.all([
      prisma.users.count(),
      prisma.users.count({ where: { role: 'STUDENT' } }),
      prisma.users.count({ where: { role: 'MENTOR' } }),
      prisma.users.count({ where: { role: 'ADMIN' } }),
      prisma.users.count({ where: { role: 'MARKETING' } }),
      prisma.mentor_assignments.count({ where: { status: 'ACTIVE' } }),
      prisma.users.count({
        where: { created_at: { gte: sevenDaysAgo } },
      }),
      prisma.users.count({
        where: {
          role: 'STUDENT',
          OR: [
            { subscription_plan: 'FREE' },
            { subscription_plan: null },
          ],
        },
      }),
      prisma.users.count({
        where: { role: 'STUDENT', subscription_plan: 'PLUS' },
      }),
      prisma.users.count({
        where: { role: 'STUDENT', subscription_plan: 'PREMIUM' },
      }),
      prisma.users.findMany({
        where: { created_at: { gte: sevenDaysAgo } },
        select: { created_at: true },
      }),
    ]);

    const dayMap: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      dayMap[d.toISOString().slice(0, 10)] = 0;
    }
    ;(usersByDay as { created_at: Date }[]).forEach((row) => {
      const key = row.created_at.toISOString().slice(0, 10);
      if (key in dayMap) dayMap[key]++;
    });
    const newUsersPerDay = Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    return NextResponse.json({
      totalUsers,
      students,
      mentors,
      admins,
      marketing,
      activeAssignments,
      newUsersLast7Days,
      subscriptionFree,
      subscriptionPlus,
      subscriptionPremium,
      newUsersPerDay,
    });
  } catch (error) {
    console.error('[admin/dashboard-stats]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}