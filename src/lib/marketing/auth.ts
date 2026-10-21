import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

import { authOptions } from '@/lib/auth/auth-config';

export type MarketingActor = {
  id: string;
  email?: string | null;
  name?: string | null;
  role: 'ADMIN' | 'MARKETING';
};

export function normalizeRole(role?: string | null) {
  return role?.toString().trim().toUpperCase() ?? '';
}

export function hasMarketingAccess(role?: string | null) {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === 'ADMIN' || normalizedRole === 'MARKETING';
}

export async function requireMarketingPageAccess(): Promise<MarketingActor> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const role = normalizeRole(session.user.role);
  if (!hasMarketingAccess(role)) {
    redirect('/dashboard');
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: role as MarketingActor['role'],
  };
}

export async function requireMarketingApiAccess(): Promise<
  | { user: MarketingActor; response?: never }
  | { user?: never; response: NextResponse }
> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const role = normalizeRole(session.user.role);
  if (!hasMarketingAccess(role)) {
    return {
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: role as MarketingActor['role'],
    },
  };
}

