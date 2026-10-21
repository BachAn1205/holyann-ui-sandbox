"use client";

import React from "react";
import { ProfileAnalysisLockedOverlay } from "@/components/student/profile-analysis/ProfileAnalysisUpgradePrompt";
import {
  normalizeCvEnhanceOutput,
  parseCvEnhanceStoredOutput,
  softenCvAnalysisCoachingCopy,
} from "@/lib/cv-feature7";

export { normalizeCvEnhanceOutput };

function renderBoldMarkdown(text: string): React.ReactNode {
  if (!text.includes("**")) return text;
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((part, idx) => {
        const m = /^\*\*([^*]+)\*\*$/.exec(part);
        if (m) return <strong key={idx}>{m[1]}</strong>;
        return <React.Fragment key={idx}>{part}</React.Fragment>;
      })}
    </>
  );
}

/** Free (showFullDetail=false): ưu tiên tổng quan + vài dòng đầu; phần sau khóa nhẹ */
const FREE_ENRICHMENT_SUMMARY_CHARS = 280;
const FREE_NEXT_ACTION_CHARS = 220;
const FREE_ENHANCE_SUMMARY_CHARS = 280;
const FREE_HEAD_LINES = 3;

function takeFirstLines(
  text: string,
  lineCount: number,
  maxChars = 360,
): string {
  const raw = (text || "").trim();
  if (!raw) return "";
  const lines = raw.split(/\r?\n/);
  let chunk = lines.slice(0, lineCount).join("\n");
  if (chunk.length > maxChars) {
    return `${chunk.slice(0, maxChars).trimEnd()}…`;
  }
  if (lines.length > lineCount) {
    return `${chunk}\n…`;
  }
  return chunk;
}

/** Chuẩn hoá object phân tích CV (feature 7). */
export function normalizeCvAnalysisOutput(
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
  return cur as Record<string, unknown>;
}

function asStringListField(v: unknown): string[] {
  if (v == null) return [];
  if (Array.isArray(v)) {
    return v
      .map((x) => (typeof x === "string" ? x.trim() : String(x ?? "").trim()))
      .filter(Boolean);
  }
  if (typeof v === "string") {
    const t = v.trim();
    if (!t) return [];
    if (t.startsWith("[") && t.endsWith("]")) {
      try {
        const p = JSON.parse(t) as unknown;
        return asStringListField(p);
      } catch {
        /* fall through */
      }
    }
    return t
      .split(/\r?\n|;|•/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function asSectionNotesArray(v: unknown): unknown[] {
  if (v == null) return [];
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    const t = v.trim();
    if (!t) return [];
    if (t.startsWith("[") && t.endsWith("]")) {
      try {
        const p = JSON.parse(t) as unknown;
        return Array.isArray(p) ? p : [];
      } catch {
        return [];
      }
    }
  }
  return [];
}

type PenaltyRow = { type?: unknown; points?: unknown; reason?: unknown };

type CriterionRow = {
  id?: string;
  title_vi?: string;
  feedback_vi?: string;
  improvement_ideas_vi?: string[];
};

function CvAnalysisEnrichmentBlock({
  enrichment,
  showFullDetail,
}: {
  enrichment: Record<string, unknown>;
  showFullDetail: boolean;
}) {
  const summary =
    typeof enrichment.executive_summary_vi === "string"
      ? softenCvAnalysisCoachingCopy(enrichment.executive_summary_vi)
      : null;
  const criteria = Array.isArray(enrichment.criterion_analysis)
    ? (enrichment.criterion_analysis as CriterionRow[]).map((c) => ({
        ...c,
        title_vi:
          typeof c.title_vi === "string"
            ? softenCvAnalysisCoachingCopy(c.title_vi)
            : c.title_vi,
        feedback_vi:
          typeof c.feedback_vi === "string"
            ? softenCvAnalysisCoachingCopy(c.feedback_vi)
            : c.feedback_vi,
        improvement_ideas_vi: Array.isArray(c.improvement_ideas_vi)
          ? c.improvement_ideas_vi.map((idea) =>
              typeof idea === "string"
                ? softenCvAnalysisCoachingCopy(idea)
                : idea,
            )
          : c.improvement_ideas_vi,
      }))
    : [];
  const checklist = Array.isArray(enrichment.next_actions_checklist_vi)
    ? (enrichment.next_actions_checklist_vi as string[]).map((s) =>
        softenCvAnalysisCoachingCopy(s),
      )
    : [];
  const gateEx =
    typeof enrichment.minimum_gate_explanation_vi === "string"
      ? softenCvAnalysisCoachingCopy(enrichment.minimum_gate_explanation_vi)
      : null;
  const penSum =
    typeof enrichment.penalties_summary_vi === "string"
      ? softenCvAnalysisCoachingCopy(enrichment.penalties_summary_vi)
      : null;

  if (
    !summary &&
    criteria.length === 0 &&
    checklist.length === 0 &&
    !gateEx &&
    !penSum
  ) {
    return null;
  }

  const summaryFree =
    summary && !showFullDetail
      ? takeFirstLines(summary, FREE_HEAD_LINES, FREE_ENRICHMENT_SUMMARY_CHARS)
      : summary;

  const criteriaMore =
    !showFullDetail && criteria.length > 1 ? criteria.length - 1 : 0;
  const checklistMore =
    !showFullDetail && checklist.length > 2 ? checklist.length - 2 : 0;

  return (
    <div className="space-y-4 rounded-2xl border-2 border-violet-400/35 bg-gradient-to-br from-violet-500/10 via-fuchsia-500/5 to-transparent p-4 shadow-md sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="font-heading text-base font-bold text-violet-950 dark:text-violet-100">
          Nhận xét chi tiết
        </h4>
      </div>

      {summary && (
        <div className="rounded-xl border border-violet-400/25 bg-white/40 p-3 text-sm leading-relaxed text-foreground dark:bg-violet-950/20">
          <p className="text-xs font-semibold uppercase text-violet-800 dark:text-violet-200">
            Tóm tắt điều hành
          </p>
          <p className="mt-2 whitespace-pre-wrap">
            {showFullDetail ? summary : summaryFree}
          </p>
          {!showFullDetail &&
            summary &&
            summaryFree &&
            summary !== summaryFree && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Plus/Premium: xem toàn bộ tóm tắt và các mục bên dưới.
              </p>
            )}
        </div>
      )}

      <div className="relative space-y-3">
        {criteria.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase text-violet-800 dark:text-violet-200">
              Phân tích theo nhóm rubric
            </p>
            {(showFullDetail ? criteria : criteria.slice(0, 1)).map((c, i) => {
              const displayTitle =
                typeof (c.title_vi ?? c.id) === "string"
                  ? String(c.title_vi ?? c.id)
                  : (c.title_vi ?? c.id ?? `Tiêu chí ${i + 1}`);

              return (
                <div
                  key={i}
                  className="rounded-xl border border-border/80 bg-card/60 p-3 text-xs leading-relaxed"
                >
                  <p className="font-semibold text-foreground">
                    {displayTitle}
                  </p>
                  {c.feedback_vi && (
                    <p className="mt-2 whitespace-pre-wrap text-foreground/90">
                      {showFullDetail
                        ? c.feedback_vi
                        : takeFirstLines(
                            c.feedback_vi,
                            FREE_HEAD_LINES,
                            FREE_ENRICHMENT_SUMMARY_CHARS,
                          )}
                    </p>
                  )}
                  {showFullDetail &&
                    Array.isArray(c.improvement_ideas_vi) &&
                    c.improvement_ideas_vi.length > 0 && (
                      <ul className="mt-2 list-disc space-y-1 pl-4 text-muted-foreground">
                        {c.improvement_ideas_vi.map((idea, j) => (
                          <li key={j}>{idea}</li>
                        ))}
                      </ul>
                    )}
                  {!showFullDetail &&
                    Array.isArray(c.improvement_ideas_vi) &&
                    c.improvement_ideas_vi.length > 0 && (
                      <ul className="mt-2 list-disc space-y-1 pl-4 text-muted-foreground">
                        <li>{c.improvement_ideas_vi[0]}</li>
                        {c.improvement_ideas_vi.length > 1 && (
                          <li className="text-muted-foreground/80">
                            … +{c.improvement_ideas_vi.length - 1} gợi ý
                            (Plus/Premium)
                          </li>
                        )}
                      </ul>
                    )}
                </div>
              );
            })}
            {criteriaMore > 0 && (
              <p className="text-[11px] text-muted-foreground">
                +{criteriaMore} nhóm rubric khác — nâng cấp để xem đầy đủ.
              </p>
            )}
          </div>
        )}

        {(gateEx || penSum) && (
          <div className="space-y-2 text-xs">
            {gateEx && (
              <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 p-2">
                <p className="font-semibold text-amber-900 dark:text-amber-100">
                  Minimum gate (diễn giải)
                </p>
                <p className="mt-1 whitespace-pre-wrap text-foreground/90">
                  {showFullDetail ? gateEx : takeFirstLines(gateEx, 2, 280)}
                </p>
              </div>
            )}
            {penSum && (
              <div className="rounded-lg border border-rose-400/25 bg-rose-500/5 p-2">
                <p className="font-semibold text-rose-900 dark:text-rose-100">
                  Penalty
                </p>
                <p className="mt-1 whitespace-pre-wrap text-foreground/90">
                  {showFullDetail ? penSum : takeFirstLines(penSum, 2, 280)}
                </p>
              </div>
            )}
          </div>
        )}

        {checklist.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase text-teal-800 dark:text-teal-200">
              Tiến độ hành động
            </p>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-xs text-foreground/90">
              {(showFullDetail ? checklist : checklist.slice(0, 2)).map(
                (step, i) => (
                  <li key={i}>{step}</li>
                ),
              )}
            </ol>
            {checklistMore > 0 && (
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                +{checklistMore} bước — Plus/Premium.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PenaltyTable({ penalties }: { penalties: unknown[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-rose-400/30">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-rose-400/25 bg-rose-500/10">
            <th className="p-2.5 font-semibold text-rose-900 dark:text-rose-100">
              Loại
            </th>
            <th className="p-2.5 font-semibold text-rose-900 dark:text-rose-100">
              Lý do
            </th>
          </tr>
        </thead>
        <tbody>
          {penalties.map((p, i) => {
            const row = p as PenaltyRow;
            return (
              <tr
                key={i}
                className="border-b border-border/60 last:border-0 align-top"
              >
                <td className="p-2.5 font-mono text-[11px]">
                  {String(row.type ?? "—")}
                </td>
                <td className="p-2.5 text-foreground/90">
                  {String(row.reason ?? "—")}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function CvAnalysisResultDetail({
  output,
  showFullDetail = true,
}: {
  output: unknown;
  showFullDetail?: boolean;
}) {
  const o = normalizeCvAnalysisOutput(output);
  if (!o) {
    return (
      <p className="text-sm text-muted-foreground">
        Không có dữ liệu phân tích.
      </p>
    );
  }
  const gate = o.minimum_gate_warning as Record<string, unknown> | undefined;
  const strengths = Array.isArray(o.top_strengths)
    ? (o.top_strengths as string[])
    : [];
  const risks = Array.isArray(o.top_risks) ? (o.top_risks as string[]) : [];
  const penalties = Array.isArray(o.penalties) ? o.penalties : [];
  const nextAction = typeof o.next_action === "string" ? o.next_action : null;
  const cleaningApplied = o.cleaning_applied === true;
  const enrichment =
    o.enrichment &&
    typeof o.enrichment === "object" &&
    !Array.isArray(o.enrichment)
      ? (o.enrichment as Record<string, unknown>)
      : null;

  const strengthsEnriched = Array.isArray(enrichment?.top_strengths_enriched)
    ? (enrichment!.top_strengths_enriched as string[])
    : [];
  const risksEnriched = Array.isArray(enrichment?.top_risks_enriched)
    ? (enrichment!.top_risks_enriched as string[])
    : [];
  const nextEnriched =
    typeof enrichment?.next_action_enriched === "string"
      ? enrichment.next_action_enriched.trim()
      : "";

  const strengthsDisplay = (
    showFullDetail && strengthsEnriched.length > 0
      ? strengthsEnriched
      : strengths
  ).map((s) => softenCvAnalysisCoachingCopy(s));
  const risksDisplay = (
    showFullDetail && risksEnriched.length > 0 ? risksEnriched : risks
  ).map((s) => softenCvAnalysisCoachingCopy(s));
  const nextDisplayRaw =
    showFullDetail && nextEnriched.length > 0 ? nextEnriched : nextAction;
  const nextDisplay =
    typeof nextDisplayRaw === "string"
      ? softenCvAnalysisCoachingCopy(nextDisplayRaw)
      : nextDisplayRaw;
  const nextDisplayFree =
    nextDisplay && !showFullDetail
      ? takeFirstLines(nextDisplay, FREE_HEAD_LINES + 1, FREE_NEXT_ACTION_CHARS)
      : nextDisplay;

  const gateReasons = Array.isArray(gate?.reasons)
    ? (gate!.reasons as string[])
    : [];

  return (
    <div className="space-y-5 text-sm">
      {enrichment && (
        <CvAnalysisEnrichmentBlock
          enrichment={enrichment}
          showFullDetail={showFullDetail}
        />
      )}

      {/* Minimum gate — Free: chỉ trạng thái; lý do chi tiết khi Plus/Premium */}
      {gate && (
        <div
          className={`rounded-xl border p-3 ${
            gate.triggered === true
              ? "border-amber-400/50 bg-amber-500/10"
              : "border-emerald-400/35 bg-emerald-500/5"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
            Cảnh báo minimum gate (rủi ro cao)
          </p>
          <p className="mt-1 text-sm">
            Trạng thái:{" "}
            <strong>
              {gate.triggered === true ? "Có cảnh báo" : "Không kích hoạt"}
            </strong>
          </p>
          {gateReasons.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-foreground/90">
              {(showFullDetail ? gateReasons : gateReasons.slice(0, 1)).map(
                (r, i) => (
                  <li key={i} className="whitespace-pre-wrap">
                    {renderBoldMarkdown(
                      showFullDetail
                        ? r
                        : takeFirstLines(r, FREE_HEAD_LINES, 280),
                    )}
                  </li>
                ),
              )}
            </ul>
          )}
          {!showFullDetail && gateReasons.length > 1 && (
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              +{gateReasons.length - 1} lý do khác — Plus/Premium.
            </p>
          )}
        </div>
      )}

      {/* Hành động tiếp theo — Free: vài dòng đầu */}
      {nextDisplay && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Hành động ưu tiên
            {showFullDetail && nextEnriched ? " (chi tiết)" : ""}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
            {showFullDetail ? nextDisplay : nextDisplayFree}
          </p>
          {!showFullDetail &&
            nextDisplayFree &&
            nextDisplay !== nextDisplayFree && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Plus/Premium: bản đầy đủ & diễn giải chi tiết hơn.
              </p>
            )}
        </div>
      )}

      {/* Điểm mạnh / Rủi ro — Free: dòng đầu tiên mỗi cột */}
      {(strengthsDisplay.length > 0 || risksDisplay.length > 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3">
            <p className="text-xs font-semibold uppercase text-emerald-800 dark:text-emerald-200">
              Điểm mạnh
            </p>
            <ul className="mt-2 list-disc space-y-1.5 pl-4 text-foreground/90">
              {(showFullDetail
                ? strengthsDisplay
                : strengthsDisplay.slice(0, 1)
              ).map((s, i) => (
                <li key={i} className="whitespace-pre-wrap">
                  {renderBoldMarkdown(
                    showFullDetail
                      ? s
                      : takeFirstLines(s, FREE_HEAD_LINES, 320),
                  )}
                </li>
              ))}
            </ul>
            {!showFullDetail && strengthsDisplay.length > 1 && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                +{strengthsDisplay.length - 1} điểm mạnh — Plus/Premium.
              </p>
            )}
          </div>
          <div className="rounded-xl border border-rose-500/25 bg-rose-500/5 p-3">
            <p className="text-xs font-semibold uppercase text-rose-800 dark:text-rose-200">
              Rủi ro / điểm yếu
            </p>
            <ul className="mt-2 list-disc space-y-1.5 pl-4 text-foreground/90">
              {(showFullDetail ? risksDisplay : risksDisplay.slice(0, 1)).map(
                (s, i) => (
                  <li key={i} className="whitespace-pre-wrap">
                    {renderBoldMarkdown(
                      showFullDetail
                        ? s
                        : takeFirstLines(s, FREE_HEAD_LINES, 320),
                    )}
                  </li>
                ),
              )}
            </ul>
            {!showFullDetail && risksDisplay.length > 1 && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                +{risksDisplay.length - 1} rủi ro — Plus/Premium.
              </p>
            )}
          </div>
        </div>
      )}

      {penalties.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-indigo-400/20 bg-gradient-to-b from-indigo-500/8 to-transparent p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-indigo-800/80 dark:text-indigo-200/90">
            Ghi nhận điều chỉnh (penalty)
          </p>
          <div
            className={
              !showFullDetail
                ? "max-h-[7rem] overflow-hidden blur-[3px] opacity-80 select-none pointer-events-none"
                : undefined
            }
          >
            <PenaltyTable penalties={penalties} />
          </div>
          {!showFullDetail && (
            <ProfileAnalysisLockedOverlay
              tone="sky"
              label="Nâng cấp để xem đầy đủ"
            />
          )}
        </div>
      )}
    </div>
  );
}

type MatrixRow = {
  /** Phần trong CV (tiếng Việt), vd: Kinh nghiệm / Dự án */
  bullet_section_vi?: string;
  original_bullet?: string;
  enhanced_bullet?: string;
  improvement_type?: string;
  why_changed_vi?: string;
  linked_rubric_hint_vi?: string;
};

function parseMatrixRow(row: unknown): MatrixRow | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  return {
    bullet_section_vi:
      typeof r.bullet_section_vi === "string"
        ? r.bullet_section_vi
        : typeof r.bulletSectionVi === "string"
          ? r.bulletSectionVi
          : typeof r.Bullet_Section_Vi === "string"
            ? r.Bullet_Section_Vi
            : undefined,
    original_bullet:
      typeof r.original_bullet === "string"
        ? r.original_bullet
        : typeof r.originalBullet === "string"
          ? r.originalBullet
          : typeof r.Original_Bullet === "string"
            ? r.Original_Bullet
            : undefined,
    enhanced_bullet:
      typeof r.enhanced_bullet === "string"
        ? r.enhanced_bullet
        : typeof r.enhancedBullet === "string"
          ? r.enhancedBullet
          : typeof r.Enhanced_Bullet === "string"
            ? r.Enhanced_Bullet
            : undefined,
    improvement_type:
      typeof r.improvement_type === "string"
        ? r.improvement_type
        : typeof r.improvementType === "string"
          ? r.improvementType
          : typeof r.Improvement_Type === "string"
            ? r.Improvement_Type
            : undefined,
    why_changed_vi:
      typeof r.why_changed_vi === "string"
        ? r.why_changed_vi
        : typeof r.whyChangedVi === "string"
          ? r.whyChangedVi
          : typeof r.Why_Changed_Vi === "string"
            ? r.Why_Changed_Vi
            : undefined,
    linked_rubric_hint_vi:
      typeof r.linked_rubric_hint_vi === "string"
        ? r.linked_rubric_hint_vi
        : typeof r.linkedRubricHintVi === "string"
          ? r.linkedRubricHintVi
          : typeof r.Linked_Rubric_Hint_Vi === "string"
            ? r.Linked_Rubric_Hint_Vi
            : undefined,
  };
}

function parseSectionNote(
  row: unknown,
): { section_vi?: string; note_vi?: string } | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  const sv =
    typeof r.section_vi === "string"
      ? r.section_vi
      : typeof r.sectionVi === "string"
        ? r.sectionVi
        : typeof r.section === "string"
          ? r.section
          : undefined;
  const nv =
    typeof r.note_vi === "string"
      ? r.note_vi
      : typeof r.noteVi === "string"
        ? r.noteVi
        : typeof r.note === "string"
          ? r.note
          : undefined;
  if (!sv && !nv) return null;
  return { section_vi: sv, note_vi: nv };
}

/** Một số API trả mỗi dòng ma trận là chuỗi JSON hoặc plain text. */
function coerceBeforeAfterMatrixRows(raw: unknown): unknown[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((row) => {
    if (typeof row === "string") {
      const t = row.trim();
      if (t.startsWith("{") && t.endsWith("}")) {
        try {
          return JSON.parse(t) as unknown;
        } catch {
          return { original_bullet: row };
        }
      }
      if (t) return { original_bullet: t };
      return row;
    }
    return row;
  });
}

export function CvEnhanceResultDetail({
  output,
  showFullDetail = true,
}: {
  output: unknown;
  showFullDetail?: boolean;
}) {
  const o = normalizeCvEnhanceOutput(
    parseCvEnhanceStoredOutput(output) ?? output,
  );
  if (!o) {
    return (
      <p className="text-sm text-muted-foreground">
        Không có dữ liệu cải thiện.
      </p>
    );
  }
  const matrix = coerceBeforeAfterMatrixRows(
    Array.isArray(o.before_after_matrix) ? o.before_after_matrix : [],
  );
  const hierarchy = asStringListField(o.information_hierarchy);
  const noiseList = asStringListField(o.noise_reduction_list);
  const sectionNotesRaw = asSectionNotesArray(o.section_notes_vi);
  const sectionNotes = sectionNotesRaw
    .map(parseSectionNote)
    .filter((x): x is NonNullable<typeof x> => x != null);
  const stillMissing = asStringListField(o.still_missing_vi);
  const risksMitigated = asStringListField(o.risks_mitigated_vi);
  const additionalTips = asStringListField(o.additional_tips_vi);
  const keywordPos = (() => {
    const a = o.keyword_and_positioning_vi;
    if (typeof a === "string" && a.trim()) return a.trim();
    const b = o.keywordAndPositioningVi;
    if (typeof b === "string" && b.trim()) return b.trim();
    return "";
  })();
  const execSummaryRaw = (() => {
    const a = o.enhance_executive_summary_vi;
    if (typeof a === "string" && a.trim()) return a.trim();
    const b = o.enhanceExecutiveSummaryVi;
    if (typeof b === "string" && b.trim()) return b.trim();
    const c = o.enhanced_summary;
    if (typeof c === "string" && c.trim()) return c.trim();
    const d = o.enhancedSummary;
    if (typeof d === "string" && d.trim()) return d.trim();
    return "";
  })();
  const execSummaryFree =
    execSummaryRaw && !showFullDetail
      ? takeFirstLines(
          execSummaryRaw,
          FREE_HEAD_LINES,
          FREE_ENHANCE_SUMMARY_CHARS,
        )
      : execSummaryRaw;

  const parsedRows = matrix.map((row) => parseMatrixRow(row));
  const hasWhyCol = parsedRows.some((m) => m?.why_changed_vi?.trim());
  const hasRubricCol = parsedRows.some((m) => m?.linked_rubric_hint_vi?.trim());
  const hasSectionCol = parsedRows.some((m) => m?.bullet_section_vi?.trim());

  const enhanceDetailUnavailable = o.enhance_detail_available === false;

  return (
    <div className="space-y-5 text-sm">
      {enhanceDetailUnavailable && (
        <div
          className="rounded-xl border border-amber-400/45 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-950 dark:text-amber-50"
          role="status"
        >
          <p className="font-semibold text-amber-950 dark:text-amber-100">
            Bản cải thiện chi tiết chưa đầy đủ
          </p>
          <p className="mt-1.5 text-amber-900/95 dark:text-amber-100/90">
            Hệ thống chỉ ghi nhận gợi ý tối thiểu (không có ma trận Before/After
            đầy đủ). Thử chạy lại «Cải thiện CV» sau vài phút; nếu vẫn vậy, kiểm
            tra máy chủ AI (Gemini) hoặc liên hệ hỗ trợ.
          </p>
        </div>
      )}
      {execSummaryRaw && (
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900 dark:text-emerald-100">
            Tóm tắt chiến lược cải thiện
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/95">
            {showFullDetail ? execSummaryRaw : execSummaryFree}
          </p>
          {!showFullDetail && execSummaryRaw !== execSummaryFree && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Plus/Premium: xem toàn bộ tóm tắt.
            </p>
          )}
        </div>
      )}

      {/* §4.1 Before / After — dạng bảng; bullet theo ngôn ngữ CV; cột coaching tiếng Việt */}
      <div className="relative">
        {matrix.length > 0 && (
          <div className="mb-3">
            <p className="text-sm font-bold text-foreground">
              Ma trận Before / After
            </p>
          </div>
        )}
        <div
          className={
            !showFullDetail && matrix.length > 1 ? "relative" : undefined
          }
        >
          {matrix.length > 0 && (
            <div className="mb-4 space-y-2">
              <div
                className={
                  !showFullDetail && matrix.length > 1
                    ? "relative overflow-hidden rounded-xl border border-border/80 bg-card/40 shadow-sm"
                    : "overflow-hidden rounded-xl border border-border/80 bg-card/40 shadow-sm"
                }
              >
                <div className="overflow-x-auto">
                  <table
                    className={`w-full border-collapse text-left text-[11px] ${
                      hasSectionCol
                        ? hasWhyCol || hasRubricCol
                          ? "min-w-[1040px]"
                          : "min-w-[820px]"
                        : hasWhyCol || hasRubricCol
                          ? "min-w-[900px]"
                          : "min-w-[640px]"
                    }`}
                  >
                    <thead>
                      <tr className="border-b border-emerald-500/25 bg-gradient-to-r from-emerald-500/12 via-teal-500/8 to-transparent">
                        <th className="sticky left-0 z-[1] w-10 border-r border-border/60 bg-muted/95 px-2 py-2.5 text-center font-semibold text-muted-foreground backdrop-blur-sm">
                          #
                        </th>
                        {hasSectionCol && (
                          <th className="min-w-[7.5rem] max-w-[10rem] px-2.5 py-2.5 font-semibold text-teal-900 dark:text-teal-100">
                            Phần trong CV
                          </th>
                        )}
                        <th className="min-w-[11rem] max-w-[14rem] px-2.5 py-2.5 font-semibold text-sky-900 dark:text-sky-100">
                          Bullet gốc
                        </th>
                        <th className="min-w-[11rem] max-w-[14rem] px-2.5 py-2.5 font-semibold text-emerald-900 dark:text-emerald-100">
                          Bullet cải thiện
                        </th>
                        <th className="min-w-[6.5rem] px-2.5 py-2.5 font-semibold text-foreground">
                          Loại
                        </th>
                        {hasWhyCol && (
                          <th className="min-w-[10rem] max-w-[13rem] px-2.5 py-2.5 font-semibold text-foreground">
                            Vì sao đổi
                          </th>
                        )}
                        {hasRubricCol && (
                          <th className="min-w-[9rem] max-w-[12rem] px-2.5 py-2.5 font-semibold text-violet-900 dark:text-violet-100">
                            Gợi ý rubric
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {(showFullDetail ? matrix : matrix.slice(0, 1)).map(
                        (row, i) => {
                          const m = parseMatrixRow(row);
                          const sectionCell =
                            m?.bullet_section_vi?.trim() ||
                            (hasSectionCol ? "—" : "");
                          return (
                            <tr
                              key={i}
                              className="border-b border-border/50 align-top odd:bg-muted/20 last:border-0 hover:bg-muted/30"
                            >
                              <td className="sticky left-0 z-[1] border-r border-border/60 bg-card/95 px-2 py-2.5 text-center tabular-nums text-muted-foreground backdrop-blur-sm">
                                {i + 1}
                              </td>
                              {hasSectionCol && (
                                <td className="px-2.5 py-2.5 text-xs text-teal-950/95 dark:text-teal-100/95">
                                  {sectionCell}
                                </td>
                              )}
                              <td className="px-2.5 py-2.5 whitespace-pre-wrap text-foreground/95">
                                {m?.original_bullet ?? JSON.stringify(row)}
                              </td>
                              <td className="px-2.5 py-2.5 whitespace-pre-wrap text-foreground">
                                {m?.enhanced_bullet ?? "—"}
                              </td>
                              <td className="px-2.5 py-2.5 text-muted-foreground">
                                {m?.improvement_type ?? "—"}
                              </td>
                              {hasWhyCol && (
                                <td className="px-2.5 py-2.5 whitespace-pre-wrap text-[10px] leading-snug text-foreground/90">
                                  {m?.why_changed_vi?.trim()
                                    ? m.why_changed_vi
                                    : "—"}
                                </td>
                              )}
                              {hasRubricCol && (
                                <td className="px-2.5 py-2.5 whitespace-pre-wrap text-[10px] text-muted-foreground">
                                  {m?.linked_rubric_hint_vi?.trim()
                                    ? m.linked_rubric_hint_vi
                                    : "—"}
                                </td>
                              )}
                            </tr>
                          );
                        },
                      )}
                    </tbody>
                  </table>
                </div>
                {!showFullDetail && matrix.length > 1 && (
                  <>
                    <div
                      className="pointer-events-none absolute inset-x-0 bottom-0 top-10 bg-gradient-to-b from-transparent via-background/85 to-background"
                      aria-hidden
                    />
                    <div className="absolute inset-0 flex items-center justify-center p-2 pt-10">
                      <span className="rounded-full border border-indigo-400/50 bg-card/95 px-3 py-1.5 text-center text-[11px] font-medium text-foreground shadow-sm">
                        +{matrix.length - 1} dòng — Plus/Premium
                      </span>
                    </div>
                  </>
                )}
              </div>
              {!showFullDetail && matrix.length > 1 && (
                <p className="text-[11px] text-muted-foreground">
                  Xem dòng đầu để nắm hướng chỉnh; bản đầy đủ khi nâng cấp.
                </p>
              )}
            </div>
          )}

          {matrix.length === 0 && (
            <p className="text-muted-foreground text-xs">
              Chưa có ma trận Before/After trong phản hồi.
            </p>
          )}
        </div>
      </div>

      {/* §4.2 + §4.3 — Free: 2 mục đầu mỗi cột */}
      {(hierarchy.length > 0 || noiseList.length > 0) && (
        <div className="grid gap-3 md:grid-cols-2">
          {hierarchy.length > 0 && (
            <div className="rounded-xl border border-violet-400/25 bg-violet-500/5 p-3">
              <p className="text-xs font-semibold text-violet-900 dark:text-violet-100">
                Thứ tự thông tin đề xuất (Information hierarchy)
              </p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-foreground/90">
                {(showFullDetail ? hierarchy : hierarchy.slice(0, 2)).map(
                  (h, i) => (
                    <li key={i}>{h}</li>
                  ),
                )}
              </ol>
              {!showFullDetail && hierarchy.length > 2 && (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  +{hierarchy.length - 2} mục — Plus/Premium.
                </p>
              )}
            </div>
          )}
          {noiseList.length > 0 && (
            <div className="rounded-xl border border-slate-400/25 bg-slate-500/5 p-3">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Giảm nhiễu / nội dung rút gọn (Noise reduction)
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-foreground/90">
                {(showFullDetail ? noiseList : noiseList.slice(0, 2)).map(
                  (n, i) => (
                    <li key={i}>{n}</li>
                  ),
                )}
              </ul>
              {!showFullDetail && noiseList.length > 2 && (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  +{noiseList.length - 2} mục — Plus/Premium.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {(keywordPos ||
        sectionNotes.length > 0 ||
        stillMissing.length > 0 ||
        risksMitigated.length > 0 ||
        additionalTips.length > 0) && (
        <div className="grid gap-3 lg:grid-cols-2">
          {keywordPos && (
            <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/5 p-3 lg:col-span-2">
              <p className="text-xs font-semibold uppercase text-cyan-900 dark:text-cyan-100">
                Từ khóa & định vị (ATS / mục tiêu)
              </p>
              <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-foreground/90">
                {showFullDetail
                  ? keywordPos
                  : takeFirstLines(keywordPos, FREE_HEAD_LINES, 360)}
              </p>
              {!showFullDetail &&
                keywordPos !==
                  takeFirstLines(keywordPos, FREE_HEAD_LINES, 360) && (
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    … Plus/Premium
                  </p>
                )}
            </div>
          )}
          {sectionNotes.length > 0 && (
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3 lg:col-span-2">
              <p className="text-xs font-semibold uppercase text-amber-900 dark:text-amber-100">
                Ghi chú theo mục / section
              </p>
              <ul className="mt-2 space-y-2 text-xs text-foreground/90">
                {(showFullDetail ? sectionNotes : sectionNotes.slice(0, 1)).map(
                  (s, i) => (
                    <li
                      key={i}
                      className="rounded-lg border border-border/60 bg-card/40 p-2"
                    >
                      {s.section_vi && (
                        <p className="font-semibold text-foreground">
                          {s.section_vi}
                        </p>
                      )}
                      {s.note_vi && (
                        <p className="mt-1 whitespace-pre-wrap leading-relaxed">
                          {showFullDetail
                            ? s.note_vi
                            : takeFirstLines(s.note_vi, FREE_HEAD_LINES, 320)}
                        </p>
                      )}
                    </li>
                  ),
                )}
              </ul>
              {!showFullDetail && sectionNotes.length > 1 && (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  +{sectionNotes.length - 1} ghi chú — Plus/Premium.
                </p>
              )}
            </div>
          )}
          {risksMitigated.length > 0 && (
            <div className="rounded-xl border border-green-500/25 bg-green-500/5 p-3">
              <p className="text-xs font-semibold uppercase text-green-900 dark:text-green-100">
                Rủi ro / penalty đã xử lý trong bản rewrite
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-foreground/90">
                {(showFullDetail
                  ? risksMitigated
                  : risksMitigated.slice(0, 2)
                ).map((x, i) => (
                  <li key={i}>{renderBoldMarkdown(x)}</li>
                ))}
              </ul>
              {!showFullDetail && risksMitigated.length > 2 && (
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  +{risksMitigated.length - 2} mục — Plus/Premium.
                </p>
              )}
            </div>
          )}
          {stillMissing.length > 0 && (
            <div className="rounded-xl border border-orange-500/25 bg-orange-500/5 p-3">
              <p className="text-xs font-semibold uppercase text-orange-900 dark:text-orange-100">
                Bạn vẫn cần bổ sung (không bịa trong CV)
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-foreground/90">
                {(showFullDetail ? stillMissing : stillMissing.slice(0, 2)).map(
                  (x, i) => (
                    <li key={i}>{renderBoldMarkdown(x)}</li>
                  ),
                )}
              </ul>
              {!showFullDetail && stillMissing.length > 2 && (
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  +{stillMissing.length - 2} mục — Plus/Premium.
                </p>
              )}
            </div>
          )}
          {additionalTips.length > 0 && (
            <div className="rounded-xl border border-sky-500/25 bg-sky-500/5 p-3 lg:col-span-2">
              <p className="text-xs font-semibold uppercase text-sky-900 dark:text-sky-100">
                Mẹo chỉnh sửa thêm
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-foreground/90">
                {(showFullDetail
                  ? additionalTips
                  : additionalTips.slice(0, 2)
                ).map((x, i) => (
                  <li key={i}>{renderBoldMarkdown(x)}</li>
                ))}
              </ul>
              {!showFullDetail && additionalTips.length > 2 && (
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  +{additionalTips.length - 2} mẹo — Plus/Premium.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
