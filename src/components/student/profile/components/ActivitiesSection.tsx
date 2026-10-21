"use client";

import React, { useMemo } from "react";
import { Award, ChevronDown, Edit3 } from "lucide-react";
import type {
  Extracurricular,
  ProfileAchievementItem,
  StudentProfile,
} from "../../../types";
import { StatusBadge } from "./StatusBadge";

interface ActivitiesSectionProps {
  profile: StudentProfile;
  isComplete: boolean;
  onEditClick?: () => void;
  alwaysPromptModal?: boolean;
  /** Chỉ nội dung — dùng trong accordion cha. */
  bodyOnly?: boolean;
}

const REGION_LABEL: Record<string, string> = {
  international: "Quốc tế",
  national: "Quốc gia",
  province: "Tỉnh / Thành",
  city: "Thành phố",
  school: "Trường",
};

const AWARD_CATEGORY_LABEL: Record<string, string> = {
  science: "Khoa học / Logic",
  social: "Xã hội",
  language: "Ngôn ngữ",
  sport: "Thể thao",
  art: "Nghệ thuật / Âm nhạc",
};

function regionLabel(code: string): string {
  const k = code.trim().toLowerCase();
  return REGION_LABEL[k] ?? code;
}

function formatRoleVi(role: string): string {
  const m: Record<string, string> = {
    LEADER: "Trưởng nhóm / Chủ tịch",
    CORE: "Thành viên nòng cốt",
    MEMBER: "Thành viên",
    HELP: "Hỗ trợ",
  };
  return m[role] ?? role;
}

function formatDateVi(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString("vi-VN");
  } catch {
    return null;
  }
}

function activityDetailRows(act: Extracurricular): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  if (act.role?.trim()) {
    rows.push({ label: "Vai trò", value: formatRoleVi(act.role.trim()) });
  }
  if (act.organization?.trim()) {
    rows.push({ label: "Tổ chức", value: act.organization.trim() });
  }
  const start = formatDateVi(act.startDate ?? undefined);
  const end = formatDateVi(act.endDate ?? undefined);
  if (start || end) {
    rows.push({
      label: "Thời gian",
      value: [start, end].filter(Boolean).join(" → "),
    });
  } else if (act.year && act.year !== ":") {
    rows.push({ label: "Năm", value: act.year });
  }
  if (act.scale?.trim()) {
    rows.push({ label: "Quy mô", value: act.scale.trim() });
  }
  if (act.region?.trim()) {
    rows.push({ label: "Phạm vi / Cấp", value: regionLabel(act.region) });
  }
  if (act.category) {
    rows.push({
      label: "Loại",
      value: act.category === "academic" ? "Học thuật" : "Phi học thuật",
    });
  }
  if (act.description?.trim()) {
    rows.push({ label: "Mô tả", value: act.description.trim() });
  }
  return rows;
}

function achievementTitle(a: ProfileAchievementItem): string {
  return typeof a === "string" ? a.trim() || "Thành tích" : a.text || "Giải thưởng";
}

function achievementDetailRows(
  a: ProfileAchievementItem,
): { label: string; value: string }[] {
  if (typeof a === "string") {
    return [];
  }
  const rows: { label: string; value: string }[] = [];
  if (a.issuingOrganization?.trim()) {
    rows.push({ label: "Đơn vị trao giải", value: a.issuingOrganization.trim() });
  }
  if (a.awardCategory?.trim()) {
    const raw = a.awardCategory.trim();
    rows.push({
      label: "Hạng mục / Loại",
      value: AWARD_CATEGORY_LABEL[raw] ?? raw,
    });
  }
  if (a.awardLevel?.trim()) {
    rows.push({ label: "Cấp giải (mô tả)", value: a.awardLevel.trim() });
  }
  if (a.region?.trim()) {
    rows.push({ label: "Phạm vi (cấp)", value: regionLabel(a.region) });
  }
  if (a.year != null && !Number.isNaN(Number(a.year))) {
    rows.push({ label: "Năm", value: String(a.year) });
  }
  if (a.rank != null && !Number.isNaN(Number(a.rank))) {
    rows.push({ label: "Hạng", value: String(a.rank) });
  }
  const ad = formatDateVi(
    typeof a.awardDate === "string"
      ? a.awardDate
      : a.awardDate != null
        ? String(a.awardDate)
        : undefined,
  );
  if (ad) {
    rows.push({ label: "Ngày nhận", value: ad });
  }
  if (a.description?.trim()) {
    rows.push({ label: "Mô tả", value: a.description.trim() });
  }
  if (a.category) {
    rows.push({
      label: "Nhóm",
      value: a.category === "academic" ? "Học thuật" : "Phi học thuật",
    });
  }
  return rows;
}

type ListItem =
  | { kind: "activity"; key: string; title: string; rows: { label: string; value: string }[] }
  | { kind: "award"; key: string; title: string; rows: { label: string; value: string }[] };

export const ActivitiesSection: React.FC<ActivitiesSectionProps> = ({
  profile,
  isComplete,
  onEditClick,
  alwaysPromptModal = false,
  bodyOnly = false,
}) => {
  const hasActivities = profile.extracurriculars.length > 0;
  const hasAchievements = profile.achievements.length > 0;
  const needSupplement = !isComplete && (!hasActivities || !hasAchievements);

  const items = useMemo((): ListItem[] => {
    const actItems: ListItem[] = profile.extracurriculars.map((act) => ({
      kind: "activity" as const,
      key: `act-${act.id}`,
      title: act.title || "Hoạt động",
      rows: activityDetailRows(act),
    }));
    const achItems: ListItem[] = profile.achievements.map((ach, idx) => ({
      kind: "award" as const,
      key: typeof ach === "object" && ach.id ? `aw-${ach.id}` : `aw-str-${idx}`,
      title: achievementTitle(ach),
      rows: achievementDetailRows(ach),
    }));
    return [...actItems, ...achItems];
  }, [profile.extracurriculars, profile.achievements]);

  const isEmpty = items.length === 0;

  const body = (
    <>
      {needSupplement && onEditClick && !alwaysPromptModal && (
        <div className="flex flex-col gap-2 border-b border-border bg-muted/50 px-4 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-3">
          <p className="text-sm text-muted-foreground">
            Cần bổ sung hoạt động hoặc thành tích.
          </p>
          <button
            type="button"
            onClick={onEditClick}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Edit3 size={14} />
            Bổ sung
          </button>
        </div>
      )}

      {alwaysPromptModal && onEditClick && (
        <div className="border-b border-border bg-sky-500/5 px-4 py-2 sm:px-5 sm:py-3">
          <p className="text-xs text-muted-foreground sm:text-sm">
            Giải thưởng, hoạt động ngoại khóa, dự án, kỹ năng… chỉnh trong{" "}
            <strong className="font-medium text-foreground">Cập nhật hồ sơ</strong> → tab{" "}
            <strong className="font-medium text-foreground">Hoạt động & thành tích</strong>.
          </p>
        </div>
      )}

      <div className="p-4 sm:p-5">
        {isEmpty ? (
          <p className="py-2 text-sm italic text-muted-foreground">
            Chưa có hoạt động hay thành tích nào.
          </p>
        ) : (
          <ul className="m-0 list-none space-y-2 p-0">
            {items.map((item) => (
              <li key={item.key}>
                <details className="group rounded-xl border border-border bg-muted/15 transition-colors open:bg-muted/25">
                  <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-left [&::-webkit-details-marker]:hidden">
                    <ChevronDown
                      className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 text-sm font-semibold leading-snug text-foreground">
                      {item.title}
                    </span>
                    <span
                      className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        item.kind === "activity"
                          ? "border-[color-mix(in_srgb,#0f4c81_20%,transparent)] bg-[color-mix(in_srgb,#0f4c81_8%,transparent)] text-[#0f4c81] dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-200"
                          : "border-slate-200 bg-slate-100 text-slate-700 dark:border-white/15 dark:bg-muted dark:text-muted-foreground"
                      }`}
                    >
                      {item.kind === "activity" ? "Hoạt động" : "Giải thưởng"}
                    </span>
                  </summary>
                  <div className="border-t border-border px-3 pb-3 pt-2">
                    {item.rows.length === 0 ? (
                      <p className="pl-6 text-xs text-muted-foreground">
                        Không có thêm chi tiết.
                      </p>
                    ) : (
                      <dl className="space-y-2.5 pl-6">
                        {item.rows.map((row) => (
                          <div key={`${item.key}-${row.label}`}>
                            <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                              {row.label}
                            </dt>
                            <dd className="mt-0.5 whitespace-pre-wrap text-sm text-foreground">
                              {row.value}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );

  if (bodyOnly) return <div>{body}</div>;

  return (
    <section className="pc-panel">
      <div className="pc-panel-header flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <h3 className="pc-display flex items-center gap-2 text-base text-foreground sm:text-lg">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,#0f4c81_10%,transparent)] text-[#0f4c81] dark:bg-sky-500/15 dark:text-sky-300">
            <Award className="size-4" aria-hidden />
          </span>
          Hoạt động & Thành tích
        </h3>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {alwaysPromptModal && onEditClick && (
            <button
              type="button"
              onClick={onEditClick}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted/80 sm:text-sm"
            >
              <Edit3 size={14} />
              Cập nhật trong hồ sơ
            </button>
          )}
          <StatusBadge isComplete={isComplete} />
        </div>
      </div>
      {body}
    </section>
  );
};
