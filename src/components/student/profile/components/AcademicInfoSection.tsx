"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Globe,
  Pencil,
  Check,
  X,
  Plus,
  Trash2,
  TrendingUp,
  Layers,
  GraduationCap,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { StudentProfile, EnglishCertificate } from "../../../types";
import { StatusBadge } from "./StatusBadge";

interface AcademicInfoSectionProps {
  profile: StudentProfile;
  isComplete: boolean;
  /** Chỉ hiển thị; mọi chỉnh sửa qua modal «Cập nhật hồ sơ». */
  readOnly?: boolean;
  onEditInModal?: () => void;
  /** Chỉ nội dung (không header/panel) — dùng trong accordion cha. */
  bodyOnly?: boolean;
  onSave?: (data: {
    gpa: number;
    gpaScale: number;
    englishCertificates: EnglishCertificate[];
    targetMajor: string;
    targetCountry: string;
  }) => void;
}

const GPA_MIN = 0;
const GPA_MAX = 10;
const GPA_SCALE = 10;

function subjectGroupLabel(g: string | null | undefined): string {
  if (!g) return "";
  const x = g.toLowerCase();
  if (x.includes("natural") || x === "tự nhiên") return "Tự nhiên";
  if (x.includes("language") || x.includes("ngôn ngữ")) return "Ngôn ngữ";
  if (x.includes("social") || x.includes("xã hội")) return "Xã hội";
  return g;
}

export const AcademicInfoSection: React.FC<AcademicInfoSectionProps> = ({
  profile,
  isComplete,
  readOnly = false,
  onEditInModal,
  bodyOnly = false,
  onSave,
}) => {
  const allowInlineEdit = Boolean(onSave) && !readOnly;
  const [editing, setEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(bodyOnly);
  const [form, setForm] = useState({
    gpa: profile.gpa,
    gpaScale: GPA_SCALE,
    englishCertificates: (profile.englishCertificates && profile.englishCertificates.length > 0
      ? profile.englishCertificates
      : [{ type: "", score: "" }]) as EnglishCertificate[],
    targetMajor: profile.targetMajor,
    targetCountry: profile.targetCountry,
  });

  useEffect(() => {
    setForm({
      gpa: profile.gpa,
      gpaScale: GPA_SCALE,
      englishCertificates:
        profile.englishCertificates && profile.englishCertificates.length > 0
          ? [...profile.englishCertificates]
          : [{ type: "", score: "" }],
      targetMajor: profile.targetMajor,
      targetCountry: profile.targetCountry,
    });
  }, [
    profile.gpa,
    profile.englishCertificates,
    profile.targetMajor,
    profile.targetCountry,
  ]);

  useEffect(() => {
    if (readOnly) setEditing(false);
  }, [readOnly]);

  const handleSave = () => {
    if (!allowInlineEdit) return;
    const gpa = Math.min(GPA_MAX, Math.max(GPA_MIN, Number(form.gpa) || 0));
    const certs = form.englishCertificates.filter(
      (c) => (c.type || "").trim() || (c.score || "").trim()
    );
    onSave?.({
      ...form,
      gpa,
      gpaScale: GPA_SCALE,
      englishCertificates: certs.length > 0 ? certs : [],
    });
    setEditing(false);
  };

  const handleCancel = () => {
    setForm({
      gpa: profile.gpa,
      gpaScale: GPA_SCALE,
      englishCertificates:
        profile.englishCertificates && profile.englishCertificates.length > 0
          ? [...profile.englishCertificates]
          : [{ type: "", score: "" }],
      targetMajor: profile.targetMajor,
      targetCountry: profile.targetCountry,
    });
    setEditing(false);
  };

  const addCert = () => {
    setForm((f) => ({
      ...f,
      englishCertificates: [...f.englishCertificates, { type: "", score: "" }],
    }));
  };

  const updateCert = (index: number, field: "type" | "score", value: string) => {
    setForm((f) => ({
      ...f,
      englishCertificates: f.englishCertificates.map((c, i) =>
        i === index ? { ...c, [field]: value } : c
      ),
    }));
  };

  const removeCert = (index: number) => {
    setForm((f) => ({
      ...f,
      englishCertificates: f.englishCertificates.filter((_, i) => i !== index),
    }));
  };

  return (
    <section className={bodyOnly ? undefined : "pc-panel relative"}>
      {!bodyOnly ? (
      <div
        className="pc-panel-header relative flex cursor-pointer select-none flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="pc-display flex items-center gap-2 text-base text-foreground sm:text-lg">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,#0f4c81_10%,transparent)] text-[#0f4c81] dark:bg-sky-500/15 dark:text-sky-300">
            <BookOpen className="size-4" aria-hidden />
          </span>
          Thông tin học thuật
        </h3>
        <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
          {readOnly && onEditInModal && (
            <button
              type="button"
              onClick={onEditInModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border border-border bg-card hover:bg-muted/80 transition-colors"
            >
              <Pencil className="size-3.5" />
              Cập nhật trong hồ sơ
            </button>
          )}
          {allowInlineEdit &&
            (editing ? (
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={handleSave}
                  className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Check size={14} />
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80"
                title="Chỉnh sửa"
              >
                <Pencil size={14} />
              </button>
            ))}
          <StatusBadge isComplete={isComplete} />
          <button
            type="button"
            className="rounded-lg bg-[color-mix(in_srgb,#0f4c81_8%,transparent)] p-1.5 text-[#0f4c81] transition-transform hover:bg-[color-mix(in_srgb,#0f4c81_14%,transparent)] dark:bg-sky-500/15 dark:text-sky-300 dark:hover:bg-sky-500/25"
            style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
            title={isExpanded ? "Thu gọn" : "Mở rộng"}
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            <ChevronDown size={16} />
          </button>
        </div>
      </div>
      ) : null}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={bodyOnly ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={bodyOnly ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className={`relative grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:gap-4 sm:p-5 md:grid-cols-3 ${bodyOnly ? "" : "border-t border-[color-mix(in_srgb,#0f4c81_8%,transparent)] dark:border-white/10"}`}>
              <div className="rounded-xl border border-[color-mix(in_srgb,#0f4c81_12%,transparent)] bg-[color-mix(in_srgb,#0f4c81_3%,transparent)] p-3 transition-shadow duration-300 hover:shadow-sm sm:p-4 dark:border-sky-500/20 dark:bg-sky-500/5">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#0f4c81]/80 dark:text-sky-300/90">
            <TrendingUp className="size-3.5 opacity-80" aria-hidden />
            GPA (thang 10)
          </p>
          {allowInlineEdit && editing ? (
            <div className="flex items-baseline gap-1 flex-wrap">
              <input
                type="number"
                step="0.1"
                min={GPA_MIN}
                max={GPA_MAX}
                value={form.gpa}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  const clamped = Number.isNaN(v) ? 0 : Math.min(GPA_MAX, Math.max(GPA_MIN, v));
                  setForm((f) => ({ ...f, gpa: clamped }));
                }}
                className="w-16 bg-card border border-border rounded px-2 py-1 text-foreground"
              />
              <span className="text-sm text-muted-foreground">/ {GPA_SCALE}</span>
            </div>
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-foreground">
                {profile.gpa}
              </span>
              <span className="text-sm text-muted-foreground font-medium">/ {GPA_SCALE}</span>
            </div>
          )}
        </div>
        <div className="p-3 sm:p-4 rounded-2xl border border-sky-500/20 bg-linear-to-br from-sky-500/7 via-card to-indigo-500/4 sm:col-span-1 md:col-span-2 shadow-sm ring-1 ring-sky-500/10 transition-shadow hover:shadow-md duration-300">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-900/75 dark:text-sky-300/90 mb-2 flex items-center gap-1.5">
            <Globe className="size-3.5 opacity-80" aria-hidden />
            Ngoại ngữ
          </p>
          {allowInlineEdit && editing ? (
            <div className="space-y-2">
              {form.englishCertificates.map((cert, index) => (
                <div key={index} className="flex gap-2 items-center flex-wrap">
                  <input
                    value={cert.type}
                    onChange={(e) => updateCert(index, "type", e.target.value)}
                    className="flex-1 min-w-[80px] max-w-[120px] bg-card border border-border rounded px-2 py-1 text-foreground text-sm"
                    placeholder="IELTS, TOEFL..."
                  />
                  <input
                    value={cert.score}
                    onChange={(e) => updateCert(index, "score", e.target.value)}
                    className="w-20 bg-card border border-border rounded px-2 py-1 text-foreground text-sm"
                    placeholder="7.0"
                  />
                  <button
                    type="button"
                    onClick={() => removeCert(index)}
                    className="p-1.5 rounded text-muted-foreground hover:bg-muted"
                    title="Xóa"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addCert}
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <Plus size={14} /> Thêm ngoại ngữ
              </button>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              {(profile.englishCertificates?.length ?? 0) > 0 ? (
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  {/* Chia thành các cột, mỗi cột 3 chứng chỉ */}
                  {Array.from({ length: Math.ceil((profile.englishCertificates ?? []).length / 3) }).map((_, colIndex) => (
                    <div key={colIndex} className="flex flex-col gap-1.5">
                      {(profile.englishCertificates ?? [])
                        .slice(colIndex * 3, colIndex * 3 + 3)
                        .map((c, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 rounded-lg bg-sky-500/5 dark:bg-sky-400/10 px-2 py-1 border border-sky-500/10"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                            <span className="font-medium text-foreground text-sm whitespace-nowrap">
                              {['HSK', 'TOPIK', 'JLPT', 'JLTP'].includes(c.type?.toUpperCase() || "")
                                ? `${c.type} ${c.level} - ${c.score}`
                                : `${c.type}${c.level ? ` - ${c.level} ` : " "}${c.score}`}
                            </span>
                          </div>
                        ))}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-muted-foreground text-sm">{profile.englishLevel || "Chưa cập nhật"}</span>
              )}
            </div>
          )}
        </div>

        {profile.gpaTranscriptByGrade &&
          (() => {
            const g = profile.gpaTranscriptByGrade;
            const rows = [
              { key: "grade9" as const, label: "Lớp 9" },
              { key: "grade10" as const, label: "Lớp 10" },
              { key: "grade11" as const, label: "Lớp 11" },
              { key: "grade12" as const, label: "Lớp 12" },
            ];
            const any = rows.some((r) => String(g[r.key] ?? "").trim());
            if (!any) return null;
            const gradeTone = [
              "from-violet-500/12 border-violet-500/25 text-violet-900 dark:text-violet-200",
              "from-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-900 dark:text-fuchsia-200",
              "from-purple-500/10 border-purple-500/20 text-purple-900 dark:text-purple-200",
              "from-indigo-500/12 border-indigo-500/25 text-indigo-900 dark:text-indigo-200",
            ] as const;
            return (
              <div className="p-3 sm:p-4 rounded-2xl border border-violet-500/20 bg-linear-to-r from-violet-500/6 via-card to-fuchsia-500/5 sm:col-span-2 md:col-span-3 shadow-sm ring-1 ring-violet-500/10">
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-900/80 dark:text-violet-300/90 mb-3 flex items-center gap-1.5">
                  <Layers className="size-3.5 opacity-80" aria-hidden />
                  GPA theo từng khối (thang 10)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {rows.map((r, i) => (
                    <div
                      key={r.key}
                      className={`rounded-xl border bg-linear-to-b ${gradeTone[i % gradeTone.length]} to-card/80 px-2 py-2.5 text-center shadow-sm`}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{r.label}</p>
                      <p className="text-lg font-bold tabular-nums mt-0.5">
                        {String(g[r.key] ?? "").trim() || "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

        {profile.subjectScoresList && profile.subjectScoresList.length > 0 ? (
          <div className="p-3 sm:p-4 rounded-2xl border border-amber-500/25 bg-linear-to-br from-amber-500/7 via-card to-orange-500/5 sm:col-span-2 md:col-span-3 shadow-sm ring-1 ring-amber-500/10">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-950/80 dark:text-amber-200/90 mb-3 flex items-center gap-1.5">
              <GraduationCap className="size-3.5 opacity-80" aria-hidden />
              Điểm từng môn học (thang 10)
            </p>
            <ul className="rounded-xl border border-amber-500/15 bg-card/60 dark:bg-card/40 overflow-hidden text-sm">
              {profile.subjectScoresList.map((s, idx) => (
                <li
                  key={`${s.subject}-${idx}`}
                  className={`flex flex-wrap items-baseline justify-between gap-2 px-3 py-2.5 border-b border-amber-500/10 last:border-b-0 ${
                    idx % 2 === 0 ? "bg-amber-500/4" : "bg-transparent"
                  }`}
                >
                  <span className="font-medium text-foreground flex items-center gap-2 min-w-0">
                    <span className="h-6 w-1 rounded-full bg-linear-to-b from-amber-400 to-orange-500 shrink-0" />
                    <span className="truncate">{s.subject || "—"}</span>
                  </span>
                  <span className="text-muted-foreground tabular-nums shrink-0">
                    <span className="inline-flex items-center rounded-md bg-amber-500/15 px-2 py-0.5 font-bold text-foreground">
                      {s.score}
                    </span>
                    {subjectGroupLabel(s.group) ? (
                      <span className="text-xs ml-1.5 opacity-80">({subjectGroupLabel(s.group)})</span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
