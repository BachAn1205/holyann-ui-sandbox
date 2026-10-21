/**
 * Điểm 4 trụ cột từ API có thể là 0–1 hoặc 0–100 → chuẩn hóa hiển thị thang 100.
 */
export function normalizePillarScoreTo100(v: number | undefined | null): number {
  if (v == null || typeof v !== "number" || Number.isNaN(v)) return 0;
  if (v <= 1) return Math.round(v * 1000) / 10;
  return Math.round(Math.min(100, v) * 10) / 10;
}
