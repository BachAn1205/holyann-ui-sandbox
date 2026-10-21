export type SubscriptionPlan = 'FREE' | 'PLUS' | 'PREMIUM';

const PLAN_RANK: Record<SubscriptionPlan, number> = { FREE: 0, PLUS: 1, PREMIUM: 2 };

/** Normalize DB/session strings to a known plan (ADVANCED → PREMIUM). */
export function normalizeSubscriptionPlan(raw: string | null | undefined): SubscriptionPlan {
  const upper = (raw ?? 'FREE')?.toString?.().trim?.().toUpperCase?.() ?? 'FREE';
  if (upper === 'ADVANCED') return 'PREMIUM';
  if (['FREE', 'PLUS', 'PREMIUM'].includes(upper)) return upper as SubscriptionPlan;
  return 'FREE';
}

/** Use the higher tier so UI matches Premium when either DB or session is correct (fixes stale JWT or stale DB). */
export function resolveEffectiveSubscriptionPlan(
  dbRaw: string | null | undefined,
  sessionRaw: string | null | undefined
): SubscriptionPlan {
  const a = normalizeSubscriptionPlan(dbRaw);
  const b = normalizeSubscriptionPlan(sessionRaw);
  return PLAN_RANK[a] >= PLAN_RANK[b] ? a : b;
}

/** Plans shown on pricing page. */
export const DISPLAY_PLANS: SubscriptionPlan[] = ['FREE', 'PLUS', 'PREMIUM'];

export type SubscriptionFeature =
  | 'profileAnalysisDetail'
  | 'profileAnalysisLimit'
  | 'profileEnhanceLimit'
  | 'recommendFacultyLimit'
  | 'facultyWishlistLimit'
  | 'schoolWishlistLimit'
  | 'admissionChanceLimit'
  | 'majorListCount'
  | 'majorFitShowCount'
  | 'classificationCount'
  | 'classificationAttemptsLimit'
  | 'matchScoreDetail'
  | 'roadmapDetail'
  | 'enhanceCount'
  | 'cvAnalysisCount'
  | 'essayAnalysisCount'
  | 'essayMentor'
  | 'reportsCount'
  | 'targetGoalsLimit';

type PlanConfig = Record<SubscriptionFeature, number | boolean>;

/** Plus Feature 3: 15 attempts per month (exception to 6‑month cycle). */
export const PLUS_CLASSIFICATION_PERIOD_MONTHLY = true;

export const PLAN_LIMITS: Record<SubscriptionPlan, PlanConfig> = {
  FREE: {
    profileAnalysisDetail: false,
    profileAnalysisLimit: 1,
    profileEnhanceLimit: 1,
    recommendFacultyLimit: 1,
    facultyWishlistLimit: 3,
    schoolWishlistLimit: 2,
    admissionChanceLimit: 2,
    majorListCount: 3,
    majorFitShowCount: 1,
    classificationCount: 5,
    classificationAttemptsLimit: 1,
    matchScoreDetail: false,
    roadmapDetail: false,
    enhanceCount: 1,
    cvAnalysisCount: 1,
    essayAnalysisCount: 1,
    essayMentor: false,
    reportsCount: 1,
    targetGoalsLimit: 2,
  },
  PLUS: {
    profileAnalysisDetail: true,
    profileAnalysisLimit: 5,
    profileEnhanceLimit: 5,
    recommendFacultyLimit: 5,
    facultyWishlistLimit: 5,
    schoolWishlistLimit: 5,
    admissionChanceLimit: 5,
    majorListCount: 15,
    majorFitShowCount: 15,
    classificationCount: 30,
    classificationAttemptsLimit: 15,
    matchScoreDetail: true,
    roadmapDetail: true,
    enhanceCount: 10,
    cvAnalysisCount: 10,
    essayAnalysisCount: 10,
    essayMentor: false,
    reportsCount: -1,
    targetGoalsLimit: 5,
  },
  PREMIUM: {
    profileAnalysisDetail: true,
    profileAnalysisLimit: -1,
    profileEnhanceLimit: -1,
    recommendFacultyLimit: -1,
    facultyWishlistLimit: 10,
    schoolWishlistLimit: 10,
    admissionChanceLimit: -1,
    majorListCount: 15,
    majorFitShowCount: 15,
    classificationCount: 30,
    classificationAttemptsLimit: -1,
    matchScoreDetail: true,
    roadmapDetail: true,
    enhanceCount: -1,
    cvAnalysisCount: -1,
    essayAnalysisCount: -1,
    essayMentor: true,
    reportsCount: -1,
    targetGoalsLimit: 10,
  },
};

export function canAccess(plan: SubscriptionPlan, feature: SubscriptionFeature): boolean {
  const value = PLAN_LIMITS[plan][feature];
  if (typeof value === 'boolean') {
    return value;
  }
  // numeric: any non-zero limit means feature exists; -1 is unlimited
  return value !== 0;
}

export function getLimit(plan: SubscriptionPlan, feature: SubscriptionFeature): number | boolean {
  return PLAN_LIMITS[plan][feature];
}

export function hasQuota(
  plan: SubscriptionPlan,
  feature: SubscriptionFeature,
  usedCount: number | null | undefined
): boolean {
  const value = PLAN_LIMITS[plan][feature];

  if (typeof value === 'boolean') {
    // boolean-valued features do not use counters
    return value;
  }

  if (value === -1) {
    return true;
  }

  const used = typeof usedCount === 'number' && usedCount >= 0 ? usedCount : 0;
  return used < value;
}

