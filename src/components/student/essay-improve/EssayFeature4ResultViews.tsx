"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileAnalysisLockedOverlay } from "@/components/student/profile-analysis/ProfileAnalysisUpgradePrompt";
import {
  getEssayLayerBenchmark,
  sortLayerEntries,
} from "@/lib/essay-feature4-layer-benchmark";
import { softenEnhanceCoachingCopy } from "@/lib/essay-feature4";

/** Màu thanh tiến độ / viền trái theo tầng */
const LAYER_PROGRESS: Record<
  string,
  { fill: string; ring: string; badge: string }
> = {
  Layer_1: {
    fill: "bg-sky-500 dark:bg-sky-400",
    ring: "ring-sky-500/30",
    badge: "border-sky-400/40 bg-sky-500/15 text-sky-950 dark:text-sky-100",
  },
  Layer_2: {
    fill: "bg-violet-500 dark:bg-violet-400",
    ring: "ring-violet-500/30",
    badge:
      "border-violet-400/40 bg-violet-500/15 text-violet-950 dark:text-violet-100",
  },
  Layer_3: {
    fill: "bg-fuchsia-500 dark:bg-fuchsia-400",
    ring: "ring-fuchsia-500/30",
    badge:
      "border-fuchsia-400/40 bg-fuchsia-500/15 text-fuchsia-950 dark:text-fuchsia-100",
  },
  Layer_4: {
    fill: "bg-amber-500 dark:bg-amber-400",
    ring: "ring-amber-500/30",
    badge:
      "border-amber-400/40 bg-amber-500/15 text-amber-950 dark:text-amber-100",
  },
  Layer_5: {
    fill: "bg-emerald-500 dark:bg-emerald-400",
    ring: "ring-emerald-500/30",
    badge:
      "border-emerald-400/40 bg-emerald-500/15 text-emerald-950 dark:text-emerald-100",
  },
  Layer_6: {
    fill: "bg-cyan-500 dark:bg-cyan-400",
    ring: "ring-cyan-500/30",
    badge: "border-cyan-400/40 bg-cyan-500/15 text-cyan-950 dark:text-cyan-100",
  },
};

function layerShortTitle(fullTitle: string): string {
  const t = fullTitle.trim();
  if (t.includes(" — ")) return t.split(" — ").slice(1).join(" — ").trim();
  return t;
}

const METRIC_ROW_ACCENT = [
  "border-l-sky-500/70 bg-sky-500/5",
  "border-l-violet-500/70 bg-violet-500/5",
  "border-l-fuchsia-500/70 bg-fuchsia-500/5",
  "border-l-amber-500/70 bg-amber-500/5",
  "border-l-emerald-500/70 bg-emerald-500/5",
  "border-l-rose-500/70 bg-rose-500/5",
  "border-l-cyan-500/70 bg-cyan-500/5",
  "border-l-indigo-500/70 bg-indigo-500/5",
  "border-l-orange-500/70 bg-orange-500/5",
];

function fmtNum(v: unknown, digits = 2): string {
  if (typeof v === "number" && !Number.isNaN(v)) return v.toFixed(digits);
  return "—";
}

function actionBadgeClass(action: string): string {
  const a = action.toLowerCase();
  if (a === "fail")
    return "bg-red-500/25 text-red-900 ring-1 ring-red-500/40 dark:text-red-100";
  if (a === "flagged")
    return "bg-amber-500/25 text-amber-950 ring-1 ring-amber-500/40 dark:text-amber-100";
  return "bg-emerald-500/25 text-emerald-900 ring-1 ring-emerald-500/40 dark:text-emerald-100";
}

/** Chuẩn hoá payload phân tích (JSON string, envelope { data }, v.v.) */
export function normalizeAnalysisOutput(
  raw: unknown,
): Record<string, unknown> | null {
  if (raw == null) return null;
  let cur: unknown = raw;
  if (typeof cur === "string") {
    try {
      cur = JSON.parse(cur) as unknown;
    } catch {
      return null;
    }
  }
  if (typeof cur !== "object" || cur === null || Array.isArray(cur))
    return null;
  let o = cur as Record<string, unknown>;
  if (o.data && typeof o.data === "object" && !Array.isArray(o.data)) {
    const d = o.data as Record<string, unknown>;
    if (d.final_assessment != null || d.hard_gate_status != null) o = d;
  } else if (
    o.success === true &&
    o.data &&
    typeof o.data === "object" &&
    !Array.isArray(o.data)
  ) {
    o = o.data as Record<string, unknown>;
  }
  return o;
}

/** Chuẩn hoá payload cải thiện */
export function normalizeEnhanceOutput(
  raw: unknown,
): Record<string, unknown> | null {
  if (raw == null) return null;
  let cur: unknown = raw;
  if (typeof cur === "string") {
    try {
      cur = JSON.parse(cur) as unknown;
    } catch {
      return null;
    }
  }
  if (typeof cur !== "object" || cur === null || Array.isArray(cur))
    return null;
  let o = cur as Record<string, unknown>;
  if (o.data && typeof o.data === "object" && !Array.isArray(o.data)) {
    const d = o.data as Record<string, unknown>;
    const looksLikeEnhance =
      "revision_suggestions" in d ||
      "enhanced_essay" in d ||
      "change_matrix" in d ||
      "projected_metrics" in d ||
      "human_input_required" in d;
    if (looksLikeEnhance) o = d;
  }
  return o;
}

/** Kết quả phân tích (feature 4) — hiển thị có cấu trúc, không raw JSON. */
export function EssayAnalysisResultDetail({
  output,
  showFullDetail = true,
}: {
  output: unknown;
  /** Free: hiện tổng quan; che chỉ số kỹ thuật + nhật ký trừ điểm */
  showFullDetail?: boolean;
}) {
  const normalized = normalizeAnalysisOutput(output);
  if (!normalized) {
    return (
      <p className="text-sm text-muted-foreground">
        Không có dữ liệu phân tích.
      </p>
    );
  }
  const o = normalized;
  const hgs = o.hard_gate_status as Record<string, unknown> | undefined;
  const fa = o.final_assessment as Record<string, unknown> | undefined;
  const layers = fa?.Layer_Breakdown as Record<string, number> | undefined;
  const metrics = fa?.Metric_Diagnostics as Record<string, unknown> | undefined;
  const deductionLog = fa?.Deduction_Log;
  const deductions = Array.isArray(deductionLog)
    ? (deductionLog as Record<string, unknown>[])
    : [];

  const total = fa?.Total_Score;
  const cls = fa?.Classification;

  const metricKeys: [string, string][] = [
    ["prompt_alignment_score", "Khớp đề"],
    ["specificity_index", "Độ cụ thể"],
    ["tone_consistency_score", "Nhất quán giọng"],
    ["lexicon_density", "Mật độ từ vựng"],
    ["paragraph_cohesion_score", "Liền mạch đoạn"],
    ["clarity_and_expression_score", "Rõ ràng & diễn đạt"],
    ["logical_framework_star_r_score", "Khung STAR/R"],
    ["grammar_syntax_error_rate", "Lỗi ngữ pháp"],
    ["hook_type", "Kiểu mở bài"],
  ];

  return (
    <div className="space-y-5 text-sm">
      {hgs && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-violet-400/35 bg-gradient-to-br from-violet-500/15 via-fuchsia-500/8 to-transparent p-4 shadow-sm ring-1 ring-violet-500/10">
          <div
            className="absolute -right-8 -top-8 size-24 rounded-full bg-fuchsia-400/20 blur-2xl"
            aria-hidden
          />
          <h4 className="relative font-semibold text-foreground flex items-center gap-2">
            <span className="inline-flex size-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />
            Cổng kiểm tra (Hard gate)
          </h4>
          <div className="relative mt-3 flex flex-wrap gap-3 items-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-1 text-xs font-medium text-violet-900 shadow-sm dark:bg-violet-950/50 dark:text-violet-100">
              <span className="text-violet-500/80">Đạo văn</span>
              <span className="font-mono tabular-nums">
                {fmtNum(hgs.plagiarism_rate, 3)}
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-1 text-xs font-medium text-fuchsia-900 shadow-sm dark:bg-fuchsia-950/50 dark:text-fuchsia-100">
              <span className="text-fuchsia-500/80">AI</span>
              <span className="font-mono tabular-nums">
                {fmtNum(hgs.ai_probability, 3)}
              </span>
            </span>
            {typeof hgs.action === "string" && (
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${actionBadgeClass(hgs.action)}`}
              >
                {hgs.action}
              </span>
            )}
          </div>
        </div>
      )}

      {fa && (
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-2xl border-2 border-sky-400/40 bg-gradient-to-br from-sky-500/20 via-cyan-500/10 to-indigo-500/15 p-4 sm:p-5 shadow-md ring-1 ring-sky-400/20">
            <div
              className="absolute right-0 top-0 h-32 w-32 translate-x-1/3 -translate-y-1/3 rounded-full bg-cyan-400/25 blur-3xl"
              aria-hidden
            />
            <div className="relative flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <h4 className="font-bold text-lg tracking-tight text-sky-950 dark:text-sky-50">
                Đánh giá tổng
              </h4>
              <div className="flex flex-wrap items-center gap-2">
                {typeof cls === "string" && (
                  <span className="rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-1.5 text-sm font-semibold text-white shadow-md">
                    {cls}
                  </span>
                )}
                {typeof total === "number" && (
                  <span className="inline-flex items-baseline gap-1 rounded-xl bg-white/80 px-4 py-2 text-2xl font-black tabular-nums text-sky-700 shadow-inner dark:bg-sky-950/60 dark:text-sky-200">
                    {total.toFixed(1)}
                    <span className="text-sm font-semibold text-sky-500/90">
                      /100
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {layers && (
            <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/90 via-white/40 to-transparent shadow-sm dark:border-slate-700/70 dark:from-slate-950/50 dark:via-slate-950/20">
              <div className="border-b border-slate-200/80 bg-gradient-to-r from-indigo-500/8 via-sky-500/6 to-transparent px-4 py-3 dark:border-slate-700/80 dark:from-indigo-500/10">
                <h4 className="font-heading text-base font-bold tracking-tight text-foreground">
                  Chi tiết từng tầng điểm
                </h4>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                  Thanh màu thể hiện mức độ hoàn thiện của từng tầng.
                </p>
              </div>
              <ul className="divide-y divide-slate-200/70 p-3 dark:divide-slate-700/80 sm:p-4">
                {sortLayerEntries(layers as Record<string, number>).map(
                  ([k, v], idx) => {
                    const meta = getEssayLayerBenchmark(k);
                    const maxPts = meta.maxPoints > 0 ? meta.maxPoints : 0;
                    const score =
                      typeof v === "number" && !Number.isNaN(v) ? v : 0;
                    const pct =
                      maxPts > 0
                        ? Math.min(100, Math.max(0, (score / maxPts) * 100))
                        : 0;
                    const palette =
                      LAYER_PROGRESS[k] ??
                      LAYER_PROGRESS[`Layer_${(idx % 6) + 1}`] ??
                      LAYER_PROGRESS.Layer_1;
                    const shortTitle = layerShortTitle(meta.title);
                    const layerNum =
                      /^Layer_(\d+)$/.exec(k)?.[1] ?? String(idx + 1);
                    return (
                      <li
                        key={k}
                        className="flex flex-col gap-2.5 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:gap-4"
                      >
                        <div className="flex shrink-0 items-start gap-2.5 sm:w-[min(100%,14rem)]">
                          <span
                            className={`inline-flex size-8 shrink-0 items-center justify-center rounded-xl border text-xs font-bold tabular-nums ring-2 ${palette.badge} ${palette.ring}`}
                            aria-hidden
                          >
                            {layerNum}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold leading-snug text-foreground">
                              {shortTitle}
                            </p>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1 space-y-2">
                          {meta.description ? (
                            <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground sm:line-clamp-3">
                              {meta.description}
                            </p>
                          ) : null}
                          <div
                            className="flex flex-wrap items-center justify-end gap-2 gap-y-1 sm:justify-between"
                            role="group"
                            aria-label={`${shortTitle}: thanh tiến độ`}
                          >
                            <div className="h-2.5 min-w-[8rem] flex-1 overflow-hidden rounded-full bg-slate-200/90 dark:bg-slate-700/90">
                              <div
                                className={`h-full rounded-full transition-[width] duration-500 ease-out ${palette.fill}`}
                                style={{
                                  width: `${Number.isFinite(pct) ? pct : 0}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  },
                )}
              </ul>
            </div>
          )}

          {deductions.length > 0 && (
            <div className="relative overflow-hidden rounded-2xl border-2 border-rose-400/30 bg-gradient-to-b from-rose-500/10 via-amber-500/5 to-transparent shadow-sm">
              <div
                className={
                  !showFullDetail
                    ? "blur-[4px] select-none opacity-[0.72] pointer-events-none"
                    : undefined
                }
              >
                <div className="border-b border-rose-400/25 bg-gradient-to-r from-rose-500/20 to-amber-500/15 px-4 py-2.5">
                  <p className="text-sm font-semibold text-rose-950 dark:text-rose-100">
                    Nhật ký trừ điểm
                    <span className="ml-2 inline-flex rounded-full bg-rose-600/20 px-2 py-0.5 text-xs font-bold text-rose-800 dark:text-rose-200">
                      {deductions.length} mục
                    </span>
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-rose-400/20 bg-rose-500/5 text-left text-[11px] uppercase tracking-wide text-rose-900/80 dark:text-rose-200/90">
                        <th className="p-2.5 font-semibold">Tầng</th>
                        <th className="p-2.5 font-semibold">Tiêu chí</th>
                        <th className="p-2.5 font-semibold">Trừ</th>
                        <th className="min-w-[120px] p-2.5 font-semibold">
                          Lý do
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {deductions.slice(0, 15).map((d, i) => (
                        <tr
                          key={i}
                          className="border-b border-rose-400/15 align-top odd:bg-white/40 dark:odd:bg-rose-950/20"
                        >
                          <td className="p-2.5 whitespace-nowrap font-medium text-rose-800/90 dark:text-rose-200">
                            {String(
                              (typeof d.layer_label_vi === "string" &&
                                d.layer_label_vi) ||
                              d.layer ||
                              "—",
                            )}
                          </td>
                          <td className="p-2.5 text-foreground/90">
                            {String(
                              (typeof d.metric_label_vi === "string" &&
                                d.metric_label_vi) ||
                              d.metric ||
                              "—",
                            )}
                          </td>
                          <td className="p-2.5 font-mono font-bold text-rose-600 dark:text-rose-400">
                            {fmtNum(d.penalty_applied, 1)}
                          </td>
                          <td className="p-2.5 text-muted-foreground">
                            {typeof d.reason_explained_vi === "string" &&
                              d.reason_explained_vi.trim()
                              ? softenEnhanceCoachingCopy(d.reason_explained_vi)
                              : softenEnhanceCoachingCopy(
                                  String(d.reason ?? "—"),
                                )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {deductions.length > 15 && (
                  <p className="border-t border-rose-400/15 bg-rose-500/5 px-4 py-2 text-xs text-rose-900/80 dark:text-rose-200/80">
                    Đang hiển thị 15/{deductions.length} mục đầu tiên.
                  </p>
                )}
              </div>
              {!showFullDetail && (
                <ProfileAnalysisLockedOverlay
                  tone="sky"
                  label="Nâng cấp Plus/Premium để xem chi tiết từng mục trừ điểm và lý do"
                />
              )}
            </div>
          )}
        </div>
      )}

      {!hgs && !fa && (
        <p className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-xs text-amber-950 dark:text-amber-100">
          Không đọc được <code className="text-[11px]">final_assessment</code> /{" "}
          <code className="text-[11px]">hard_gate_status</code> trong bản lưu.
          Thử chạy phân tích lại hoặc kiểm tra phiên bản API.
        </p>
      )}
    </div>
  );
}

const SUGGESTION_PALETTES = [
  "border-emerald-400/40 bg-gradient-to-br from-emerald-500/15 via-teal-500/8 to-transparent",
  "border-cyan-400/40 bg-gradient-to-br from-cyan-500/15 via-sky-500/8 to-transparent",
  "border-violet-400/40 bg-gradient-to-br from-violet-500/15 via-indigo-500/8 to-transparent",
  "border-amber-400/40 bg-gradient-to-br from-amber-500/15 via-orange-500/8 to-transparent",
];

const SUGGESTIONS_INITIAL = 3;
const SUGGESTIONS_MAX = 12;

/** Kết quả cải thiện — chỉ nội dung gợi ý (không điểm, không tiêu chí kỹ thuật; không bài viết sẵn). */
export function EssayEnhanceResultDetail({
  output,
  showFullDetail = true,
}: {
  output: unknown;
  /** Free: hiện phần cần bổ sung; che chi tiết gợi ý sửa */
  showFullDetail?: boolean;
}) {
  const normalized = normalizeEnhanceOutput(output);
  if (!normalized) {
    return (
      <p className="text-sm text-muted-foreground">
        Không có dữ liệu cải thiện.
      </p>
    );
  }
  const o = normalized;
  const suggestions = Array.isArray(o.revision_suggestions)
    ? (o.revision_suggestions as Record<string, unknown>[])
    : [];
  const humanNeed = Array.isArray(o.human_input_required)
    ? (o.human_input_required as string[])
    : [];

  const [suggestionsExpanded, setSuggestionsExpanded] = useState(false);
  const suggestionsCapped = useMemo(
    () => suggestions.slice(0, SUGGESTIONS_MAX),
    [suggestions],
  );
  const shownSuggestions = suggestionsExpanded
    ? suggestionsCapped
    : suggestionsCapped.slice(0, SUGGESTIONS_INITIAL);

  useEffect(() => {
    setSuggestionsExpanded(false);
  }, [output]);

  return (
    <div className="space-y-4 text-sm">
      <p className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-3 py-2 text-xs text-muted-foreground leading-relaxed">
        Phần cải thiện chỉ hiển thị{" "}
        <strong className="text-foreground">nội dung gợi ý</strong> (nhận xét &
        hướng sửa) — không có điểm số, không tiêu chí chấm điểm hay bản luận
        viết sẵn.
      </p>

      {humanNeed.length > 0 && (
        <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-xs text-amber-950 dark:text-amber-100">
          <p className="font-semibold">Cần bổ sung</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5">
            {humanNeed.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </div>
      )}

      {suggestions.length > 0 && (
        <div>
          <h4 className="mb-3 flex flex-wrap items-center gap-2 font-bold text-emerald-950 dark:text-emerald-100">
            <span className="inline-flex size-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" />
            Gợi ý chỉnh sửa
          </h4>
          <ul className="space-y-3">
            {shownSuggestions.map((s, i) => {
              const pal = SUGGESTION_PALETTES[i % SUGGESTION_PALETTES.length];
              const focusArea =
                typeof s.target_location === "string"
                  ? s.target_location.trim()
                  : "";
              const metricVi =
                typeof s.metric_label_vi === "string"
                  ? s.metric_label_vi.trim()
                  : "";
              const coaching =
                typeof s.revision_coaching_vi === "string"
                  ? softenEnhanceCoachingCopy(s.revision_coaching_vi)
                  : "";
              return (
                <li
                  key={String(s.suggestion_id ?? i)}
                  className={`rounded-2xl border-2 p-3.5 shadow-sm ring-1 ring-black/5 dark:ring-white/5 ${pal}`}
                >
                  {showFullDetail ? (
                    <>
                      {(focusArea || metricVi) && (
                        <div className="mb-2 flex flex-wrap gap-1.5">
                          {focusArea ? (
                            <span className="inline-flex max-w-full rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-950 dark:text-emerald-100">
                              {softenEnhanceCoachingCopy(focusArea)}
                            </span>
                          ) : null}
                          {metricVi ? (
                            <span className="inline-flex max-w-full rounded-full border border-teal-500/35 bg-teal-500/10 px-2 py-0.5 text-[11px] font-medium text-teal-950 dark:text-teal-100">
                              {metricVi}
                            </span>
                          ) : null}
                        </div>
                      )}
                      <p className="font-semibold text-foreground">
                        {String(s.issue_detected ?? "—")}
                      </p>
                      {coaching ? (
                        <p className="mt-2 text-sm leading-relaxed text-foreground/95">
                          {coaching}
                        </p>
                      ) : null}
                      {typeof s.why_it_matters === "string" && (
                        <p
                          className={`text-xs leading-relaxed text-muted-foreground ${coaching ? "mt-2" : "mt-1"}`}
                        >
                          {softenEnhanceCoachingCopy(s.why_it_matters)}
                        </p>
                      )}
                      {typeof s.how_to_edit === "string" && (
                        <p className="mt-2 rounded-lg bg-white/50 px-2.5 py-2 text-xs leading-relaxed dark:bg-black/20">
                          <span className="font-bold text-teal-700 dark:text-teal-300">
                            Cách sửa:{" "}
                          </span>
                          {softenEnhanceCoachingCopy(s.how_to_edit)}
                        </p>
                      )}
                      {typeof s.edit_template === "string" &&
                      s.edit_template.trim() ? (
                        <p className="mt-2 rounded-md border border-dashed border-foreground/15 bg-black/[0.03] px-2.5 py-1.5 text-[11px] leading-relaxed text-muted-foreground dark:bg-white/[0.04]">
                          <span className="font-semibold text-foreground/80">
                            Khung gợi ý:{" "}
                          </span>
                          {softenEnhanceCoachingCopy(s.edit_template)}
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <div className="relative min-h-[5.5rem] overflow-hidden rounded-lg">
                      <div className="space-y-2 blur-[4px] select-none opacity-[0.72] pointer-events-none">
                        <p className="font-semibold text-foreground">
                          {String(s.issue_detected ?? "—")}
                        </p>
                        {coaching ? (
                          <p className="text-sm leading-relaxed text-foreground">
                            {coaching}
                          </p>
                        ) : null}
                        {typeof s.why_it_matters === "string" && (
                          <p className="text-xs leading-relaxed text-muted-foreground">
                            {softenEnhanceCoachingCopy(s.why_it_matters)}
                          </p>
                        )}
                        {typeof s.how_to_edit === "string" && (
                          <p className="rounded-lg bg-white/50 px-2.5 py-2 text-xs leading-relaxed dark:bg-black/20">
                            <span className="font-bold text-teal-700 dark:text-teal-300">
                              Cách sửa:{" "}
                            </span>
                            {softenEnhanceCoachingCopy(s.how_to_edit)}
                          </p>
                        )}
                      </div>
                      <ProfileAnalysisLockedOverlay
                        tone="indigo"
                        label="Nâng cấp Plus/Premium để xem chi tiết gợi ý"
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          {suggestionsCapped.length > SUGGESTIONS_INITIAL && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2 w-full text-emerald-700 hover:bg-emerald-500/10 hover:text-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-500/15 dark:hover:text-emerald-200"
              onClick={() => setSuggestionsExpanded((v) => !v)}
            >
              {suggestionsExpanded ? (
                <>
                  <ChevronUp className="mr-1 size-4" />
                  Thu gọn
                </>
              ) : (
                <>
                  <ChevronDown className="mr-1 size-4" />
                  Xem thêm ({suggestionsCapped.length - SUGGESTIONS_INITIAL} gợi
                  ý)
                </>
              )}
            </Button>
          )}
          {suggestions.length > SUGGESTIONS_MAX && (
            <p className="mt-2 text-xs text-muted-foreground">
              Đang hiển thị tối đa {SUGGESTIONS_MAX}/{suggestions.length} gợi ý.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
