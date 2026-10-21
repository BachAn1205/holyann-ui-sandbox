import { subMonths } from "date-fns"
import type { PrismaClient } from "@prisma/client"
import {
  normalizeSubscriptionPlan,
  type SubscriptionPlan,
} from "@/lib/subscription"
import {
  getVnCalendarDateKey,
  parseVnDateKeyToUtcStart,
} from "@/lib/vn-calendar"

/** Free: tổng số phiên đã hoàn thành tối đa. */
export const MOCK_INTERVIEW_FREE_LIFETIME_COMPLETED_MAX = 1
/** Plus/Premium: tối đa số phiên hoàn thành mỗi ngày (theo giờ VN). */
export const MOCK_INTERVIEW_PAID_MAX_PER_VN_DAY = 1
/** Plus/Premium: tối đa số phiên hoàn thành trong cửa sổ 6 tháng lăn. */
export const MOCK_INTERVIEW_PAID_ROLLING_6M_MAX = 60

export type MockInterviewQuotaSnapshot = {
  plan: SubscriptionPlan
  canStartNew: boolean
  reason: string | null
  completedLifetime: number
  completedLast6Months: number
  completedTodayVn: number
  rollingWindowMax: number | null
  dailyMax: number | null
  freeLifetimeMax: number | null
  vnTodayKey: string
}

export async function getMockInterviewQuotaSnapshot(
  db: PrismaClient,
  userId: string,
  subscriptionPlanRaw: string | null | undefined,
): Promise<MockInterviewQuotaSnapshot> {
  const plan = normalizeSubscriptionPlan(subscriptionPlanRaw)
  const now = new Date()
  const vnTodayKey = getVnCalendarDateKey(now)
  const startVnToday = parseVnDateKeyToUtcStart(vnTodayKey)
  const endVnToday = new Date(startVnToday.getTime() + 24 * 60 * 60 * 1000)
  const sixMonthsAgo = subMonths(now, 6)

  const [completedLifetime, completedLast6Months, completedTodayVn] =
    await Promise.all([
      db.student_interview_sessions.count({
        where: { user_id: userId, status: "completed" },
      }),
      db.student_interview_sessions.count({
        where: {
          user_id: userId,
          status: "completed",
          updated_at: { gte: sixMonthsAgo },
        },
      }),
      db.student_interview_sessions.count({
        where: {
          user_id: userId,
          status: "completed",
          updated_at: { gte: startVnToday, lt: endVnToday },
        },
      }),
    ])

  if (plan === "FREE") {
    const canStart =
      completedLifetime < MOCK_INTERVIEW_FREE_LIFETIME_COMPLETED_MAX
    return {
      plan,
      canStartNew: canStart,
      reason: canStart
        ? null
        : "Bạn đã dùng hết lượt phỏng vấn thử miễn phí (1 lần). Nâng cấp Plus hoặc Premium để luyện mỗi ngày (tối đa 60 buổi / 6 tháng).",
      completedLifetime,
      completedLast6Months,
      completedTodayVn,
      rollingWindowMax: null,
      dailyMax: null,
      freeLifetimeMax: MOCK_INTERVIEW_FREE_LIFETIME_COMPLETED_MAX,
      vnTodayKey,
    }
  }

  const rollingOk =
    completedLast6Months < MOCK_INTERVIEW_PAID_ROLLING_6M_MAX
  const dailyOk =
    completedTodayVn < MOCK_INTERVIEW_PAID_MAX_PER_VN_DAY
  const canStart = rollingOk && dailyOk
  let reason: string | null = null
  if (!dailyOk) {
    reason =
      "Bạn đã hoàn thành 1 buổi phỏng vấn thử hôm nay (giờ Việt Nam). Mỗi ngày một buổi; hãy quay lại vào ngày mai."
  } else if (!rollingOk) {
    reason =
      "Bạn đã đạt giới hạn 60 buổi phỏng vấn thử trong 6 tháng gần nhất. Các buổi cũ sẽ lần lượt ra khỏi cửa sổ 6 tháng để mở thêm lượt."
  }

  return {
    plan,
    canStartNew: canStart,
    reason,
    completedLifetime,
    completedLast6Months,
    completedTodayVn,
    rollingWindowMax: MOCK_INTERVIEW_PAID_ROLLING_6M_MAX,
    dailyMax: MOCK_INTERVIEW_PAID_MAX_PER_VN_DAY,
    freeLifetimeMax: null,
    vnTodayKey,
  }
}
