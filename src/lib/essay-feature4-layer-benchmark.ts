/**
 * Tiêu đề / trần điểm / mô tả tầng — khớp `fast-api-server-ai`:
 * - `app/module/feature4/benchmark_vi_mapping.py` (`LAYER_LABEL_VI`)
 * - `app/docs/benmark/feature4/benmark.md` (mục 2 & 4)
 */

export const ESSAY_LAYER_MAX_POINTS: Record<string, number> = {
  Layer_1: 15,
  Layer_2: 15,
  Layer_3: 30,
  Layer_4: 20,
  Layer_5: 10,
  Layer_6: 10,
};

/** Giống `LAYER_LABEL_VI` trong benchmark_vi_mapping.py */
export const ESSAY_LAYER_TITLE_VI: Record<string, string> = {
  Layer_1: "Tầng 1 - Bộ lọc vòng ngoài",
  Layer_2: "Tầng 2 - Cấu trúc & luồng logic",
  Layer_3: "Tầng 3 - Tính cá nhân hóa",
  Layer_4: "Tầng 4 - Tương thích hồ sơ - chương trình",
  Layer_5: "Tầng 5 - Định chuẩn văn hóa khu vực",
  Layer_6: "Tầng 6 - Tầm nhìn tương lai & tác động cộng đồng",
};

/** Tóm tắt mục đích tầng theo benmark.md (rút gọn cho UI) */
export const ESSAY_LAYER_DESCRIPTION_VI: Record<string, string> = {
  Layer_1:
    "Lọc hợp lệ trước khi chấm sâu: khớp đề, độ dài so với mục tiêu, lỗi ngữ pháp/cú pháp và các chỉ số cổng kiểm tra.",
  Layer_2:
    "Tổ chức bài và luồng logic: hiệu quả câu mở (hook), liền mạch đoạn, rõ ràng diễn đạt, khung STAR-R khi kể trải nghiệm.",
  Layer_3:
    "Độ “người thật”, tránh sáo rỗng: cụ thể hóa, hạn chế cliché, nhất quán giọng điệu xuyên suốt bài.",
  Layer_4:
    "Phù hợp ứng viên–chương trình: cốt lõi hồ sơ so với cách kể trong bài, từ vựng chuyên ngành, thực thể trường/lớp/lab.",
  Layer_5:
    "Định chuẩn theo vùng tuyển sinh (US / UK-AUS-EU / ASIA): trọng số và yêu cầu như diversity, study plan, giọng khiêm tốn, v.v.",
  Layer_6:
    "Tương lai có thể hành động (gắn mốc thời gian/địa điểm) và tác động cộng đồng (từ vựng impact).",
};

const LAYER_ORDER = [
  "Layer_1",
  "Layer_2",
  "Layer_3",
  "Layer_4",
  "Layer_5",
  "Layer_6",
] as const;

export function sortLayerEntries(layers: Record<string, number>): [string, number][] {
  const known = LAYER_ORDER.filter((k) => k in layers).map(
    (k) => [k, layers[k] as number] as [string, number],
  );
  const rest = Object.entries(layers).filter(
    ([k]) => !LAYER_ORDER.includes(k as (typeof LAYER_ORDER)[number]),
  ) as [string, number][];
  return [...known, ...rest];
}

export function getEssayLayerBenchmark(layerKey: string): {
  title: string;
  maxPoints: number;
  description: string;
} {
  return {
    title: ESSAY_LAYER_TITLE_VI[layerKey] ?? layerKey,
    maxPoints: ESSAY_LAYER_MAX_POINTS[layerKey] ?? 0,
    description: ESSAY_LAYER_DESCRIPTION_VI[layerKey] ?? "",
  };
}
