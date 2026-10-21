import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export type SubscriptionPlan = 'FREE' | 'PLUS' | 'PREMIUM';

const PREMIUM_PLANS: SubscriptionPlan[] = ['PLUS', 'PREMIUM'];

/**
 * Lấy subscription plan của user từ session hoặc Bearer token.
 * Dùng cho API cần kiểm tra gói (premium-only).
 */
export async function getSubscriptionPlanFromRequest(
  request?: NextRequest
): Promise<{ plan: SubscriptionPlan; userId: string } | null> {
  let userId: string | null = null;

  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    userId = session.user.id as string;
  }

  if (!userId && request) {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (token) {
      const decoded = verifyToken(token);
      if (decoded?.userId) userId = decoded.userId as string;
    }
  }

  if (!userId) return null;

  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { role: true, subscription_plan: true },
  });
  if (!user) return null;

  // ADMIN / MENTOR: treat as premium; STUDENT: use subscription_plan from DB
  let plan: SubscriptionPlan = 'FREE';
  if (user.role === 'ADMIN' || user.role === 'MENTOR') {
    plan = 'PREMIUM';
  } else if (user.subscription_plan && ['FREE', 'PLUS', 'PREMIUM'].includes(user.subscription_plan.toUpperCase())) {
    plan = user.subscription_plan.toUpperCase() as SubscriptionPlan;
  }
  return { plan, userId };
}

/**
 * Trả về 403 nếu user chưa đăng nhập hoặc đang dùng gói FREE.
 * Gọi ở đầu handler premium-only API.
 * @returns NextResponse (403) nếu không được truy cập, null nếu được phép.
 */
export async function requirePremium(
  request?: NextRequest
): Promise<NextResponse | null> {
  const result = await getSubscriptionPlanFromRequest(request);
  if (!result) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }
  if (!PREMIUM_PLANS.includes(result.plan)) {
    return NextResponse.json(
      {
        error: 'Tính năng này yêu cầu gói Premium. Vui lòng nâng cấp.',
        code: 'PREMIUM_REQUIRED',
      },
      { status: 403 }
    );
  }
  return null;
}
