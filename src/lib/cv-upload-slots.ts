import type { SubscriptionPlan } from "@/lib/api/require-premium";

/**
 * Số ô upload CV tối đa theo gói (Quản lý tài liệu / upload-cv).
 * Free: 2 — Plus & Premium: 5.
 */
export function getMaxCvUploadSlots(plan: SubscriptionPlan): number {
  switch (plan) {
    case "FREE":
      return 2;
    case "PLUS":
    case "PREMIUM":
      return 5;
    default:
      return 2;
  }
}
