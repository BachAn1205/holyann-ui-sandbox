import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { prisma } from '@/lib/prisma';

/** Plans that can be upgraded to (6‑month cycle; Premium is contact-sales). */
const ALLOWED_PLANS = ['PLUS', 'PREMIUM'] as const;
type AllowedPlan = (typeof ALLOWED_PLANS)[number];

/** Plus: 399k/6 months or 599k/year (VND). */
const PLUS_AMOUNT = { '6months': 399000, '1year': 599000 } as const;

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const plan = (body?.plan || body?.subscriptionPlan) as AllowedPlan | undefined;
    const billingCycle = body?.billingCycle === '1year' ? '1year' : '6months';

    if (!plan || !ALLOWED_PLANS.includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const now = new Date();
    const subscriptionEnd = new Date(now);
    if (plan === 'PLUS') {
      subscriptionEnd.setMonth(subscriptionEnd.getMonth() + (billingCycle === '1year' ? 12 : 6));
    } else {
      // Premium: default 6‑month cycle (contact-sales may set custom end)
      subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 6);
    }

    // TODO: Tích hợp payment gateway (Stripe/PayOS) trước khi xác nhận thanh toán

    const updatedUser = await prisma.users.update({
      where: { id: session.user.id as string },
      data: {
        subscription_plan: plan,
        subscription_start: now,
        subscription_end: subscriptionEnd,
      },
      select: {
        id: true,
        subscription_plan: true,
        subscription_start: true,
        subscription_end: true,
      },
    });

    // TODO: Add payments model to schema and uncomment when payment gateway is integrated
    // const amount = plan === 'PLUS' ? PLUS_AMOUNT[billingCycle] : 0;
    // await prisma.payments.create({ data: { user_id: updatedUser.id, plan, amount, currency: 'VND', status: 'success' } });

    return NextResponse.json({
      success: true,
      plan: plan,
      subscriptionStart: now,
      subscriptionEnd: subscriptionEnd,
    });
  } catch (error) {
    console.error('[subscription/upgrade] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

