'use client';

import { useAuthSession } from '@/hooks/useAuthSession';
import {
  PLAN_LIMITS,
  type SubscriptionFeature,
  type SubscriptionPlan,
  canAccess,
  getLimit,
  hasQuota as hasQuotaFn,
} from '@/lib/subscription';

export function useSubscription() {
  const { session } = useAuthSession();

  const plan: SubscriptionPlan =
    ((session?.user as any)?.subscriptionPlan as SubscriptionPlan | undefined) ?? 'FREE';

  const isFree = plan === 'FREE';
  const isPlus = plan === 'PLUS';
  const isPremium = plan === 'PREMIUM';
  const isPaid = !isFree;

  function can(feature: SubscriptionFeature): boolean {
    return canAccess(plan, feature);
  }

  function limit(feature: SubscriptionFeature): number | boolean {
    return getLimit(plan, feature);
  }

  function hasQuota(feature: SubscriptionFeature, usedCount: number | null | undefined): boolean {
    return hasQuotaFn(plan, feature, usedCount);
  }

  return {
    plan,
    isFree,
    isPlus,
    isPremium,
    isPaid,
    rawPlanConfig: PLAN_LIMITS[plan],
    can,
    limit,
    hasQuota,
  };
}

