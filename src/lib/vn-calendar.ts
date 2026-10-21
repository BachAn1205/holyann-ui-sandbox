/** Múi giờ cố định cho học sinh VN (không DST). */
export const VN_IANA = "Asia/Ho_Chi_Minh" as const
const VN_OFFSET = "+07:00"

/** YYYY-MM-DD theo lịch VN tại thời điểm `d`. */
export function getVnCalendarDateKey(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: VN_IANA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d)
}

/** 00:00:00 ngày `dateKey` (YYYY-MM-DD) theo VN, biểu diễn UTC. */
export function parseVnDateKeyToUtcStart(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00${VN_OFFSET}`)
}
