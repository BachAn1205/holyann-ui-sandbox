"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { StudentPageContainer } from "@/components/student";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  FileUp,
  Loader2,
  Save,
  Upload,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { sanitizeHtml } from "@/lib/utils/validation";
import { getUploadCvVerifyDescription } from "@/lib/upload-cv-verify-text";

type ProfileGoal = {
  id: string;
  faculty_name: string;
  university_name: string;
};

type EssayItem = {
  id: string;
  slot_index: number;
  title: string | null;
  content: string;
  essay_prompt: string | null;
  target_words: number | null;
  target_culture: string | null;
  applicant_core_strengths: unknown;
  target_program_entities: unknown;
  target_major: string | null;
  target_goal_id: string | null;
  target_goal?: ProfileGoal | null;
  created_at: string;
  updated_at: string;
};

type EssayMetaDraft = {
  essay_prompt: string;
  target_words: string;
  target_culture: string;
  strengthsText: string;
  entitiesText: string;
  /** `student_target_goals.id` — chọn từ mục tiêu hồ sơ */
  selectedGoalId: string;
};

function emptyEssayMeta(): EssayMetaDraft {
  return {
    essay_prompt: "",
    target_words: "650",
    target_culture: "A",
    strengthsText: "",
    entitiesText: "",
    selectedGoalId: "",
  };
}

function parseCultureZone(raw: string | null | undefined): "A" | "B" | "C" {
  if (!raw) return "A";
  const s = raw.trim().toUpperCase();
  if (s.startsWith("C") || s.includes("VÙNG C")) return "C";
  if (s.startsWith("B") || s.includes("VÙNG B")) return "B";
  return "A";
}

type CvDocItem = {
  id: string;
  slot_index: number;
  file_url: string;
  storage_path?: string | null;
  file_name: string;
  uploaded_at: string;
  cv_verified_at?: string | null;
  cv_validation?: unknown;
};

const ACCENT = "#0052FF";
const ACCENT_SEC = "#4D7CFF";
const easeOut = [0.16, 1, 0.3, 1] as const;
const fadeInUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOut } },
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

function SlidePagination({
  total,
  current,
  onSelect,
}: {
  total: number;
  current: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9 rounded-xl border-border transition-all hover:border-[var(--accent)]/30 hover:shadow-sm"
        disabled={current <= 1}
        onClick={() => onSelect(current - 1)}
        aria-label="Slide trước"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="flex items-center gap-1.5">
        {Array.from({ length: total }, (_, i) => i + 1).map((idx) => (
          <button
            key={idx}
            type="button"
            aria-label={`Slide ${idx}`}
            aria-current={current === idx}
            onClick={() => onSelect(idx)}
            className={cn(
              "h-9 min-w-9 rounded-xl px-2.5 text-sm font-medium transition-all duration-200",
              current === idx
                ? "bg-gradient-to-r from-[var(--accent)] to-[#4D7CFF] text-white shadow-md shadow-[var(--accent)]/25"
                : "bg-muted/80 text-muted-foreground hover:bg-muted",
            )}
          >
            {idx}
          </button>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9 rounded-xl border-border transition-all hover:border-[var(--accent)]/30 hover:shadow-sm"
        disabled={current >= total}
        onClick={() => onSelect(current + 1)}
        aria-label="Slide sau"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function EssayHtmlEditor({
  value,
  onChange,
  placeholder,
  disabled,
  className,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
    }
  }, [value]);

  const handleInput = () => {
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const handleBlur = () => {
    if (ref.current) onChange(ref.current.innerHTML);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div
        ref={ref}
        contentEditable={!disabled}
        suppressContentEditableWarning
        role="textbox"
        aria-placeholder={placeholder}
        className={cn(
          "min-h-[200px] w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2",
          !value && "text-muted-foreground",
        )}
        onInput={handleInput}
        onBlur={handleBlur}
        style={{ minHeight: 200 }}
      />
    </div>
  );
}

export default function ManageUploadPage() {
  const { data: session } = useSession();
  const studentId = session?.user?.id as string | undefined;
  const cvInputRef = useRef<HTMLInputElement>(null);

  const [essayData, setEssayData] = useState<{
    essays: EssayItem[];
    maxSlots: number;
    plan: string;
  } | null>(null);
  const [essayLoading, setEssayLoading] = useState(true);
  const [essaySlide, setEssaySlide] = useState(1);
  const [essayDrafts, setEssayDrafts] = useState<Record<number, string>>({});
  const [essayTitles, setEssayTitles] = useState<Record<number, string>>({});
  const [essayMeta, setEssayMeta] = useState<Record<number, EssayMetaDraft>>({});
  const [profileGoals, setProfileGoals] = useState<ProfileGoal[]>([]);
  const [essaySaving, setEssaySaving] = useState(false);

  const [cvData, setCvData] = useState<{
    documents: CvDocItem[];
    maxSlots: number;
    plan: string;
  } | null>(null);
  const [cvLoading, setCvLoading] = useState(true);
  const [cvSlide, setCvSlide] = useState(1);
  const [cvUploading, setCvUploading] = useState(false);
  const [cvDeletingSlot, setCvDeletingSlot] = useState<number | null>(null);

  const loadEssays = useCallback(async () => {
    if (!studentId) return;
    setEssayLoading(true);
    try {
      const [resEssays, resGoals] = await Promise.all([
        fetch(`/api/students/${studentId}/manage-upload/essays`),
        fetch(`/api/students/${studentId}/target-goal`),
      ]);
      if (!resEssays.ok) throw new Error("Lỗi tải essay");
      const data = await resEssays.json();
      const goalsJson = resGoals.ok ? await resGoals.json() : {};
      const goals: ProfileGoal[] = (goalsJson.goals ?? []).map(
        (g: { id: string; faculty_name: string; university_name: string }) => ({
          id: g.id,
          faculty_name: g.faculty_name,
          university_name: g.university_name,
        }),
      );
      setProfileGoals(goals);

      setEssayData({
        essays: data.essays ?? [],
        maxSlots: data.maxSlots ?? 2,
        plan: data.plan ?? "FREE",
      });
      const drafts: Record<number, string> = {};
      const titles: Record<number, string> = {};
      const maxS = data.maxSlots ?? 2;
      const meta: Record<number, EssayMetaDraft> = {};
      for (let s = 1; s <= maxS; s++) {
        meta[s] = emptyEssayMeta();
      }
      (data.essays ?? []).forEach((e: EssayItem) => {
        drafts[e.slot_index] = e.content ?? "";
        titles[e.slot_index] = e.title ?? "";
        const strengths = Array.isArray(e.applicant_core_strengths)
          ? (e.applicant_core_strengths as string[]).join("\n")
          : "";
        const entities = Array.isArray(e.target_program_entities)
          ? (e.target_program_entities as string[]).join("\n")
          : "";
        let selectedGoalId = e.target_goal_id ?? "";
        if (!selectedGoalId && e.target_major?.trim() && goals.length > 0) {
          const hit = goals.find(
            (g) =>
              g.faculty_name.trim().toLowerCase() ===
              e.target_major!.trim().toLowerCase(),
          );
          if (hit) selectedGoalId = hit.id;
        }
        meta[e.slot_index] = {
          essay_prompt: e.essay_prompt ?? "",
          target_words:
            e.target_words != null && Number.isFinite(e.target_words)
              ? String(e.target_words)
              : "650",
          target_culture: parseCultureZone(e.target_culture),
          strengthsText: strengths,
          entitiesText: entities,
          selectedGoalId,
        };
      });
      setEssayDrafts(drafts);
      setEssayTitles(titles);
      setEssayMeta(meta);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi tải essay");
    } finally {
      setEssayLoading(false);
    }
  }, [studentId]);

  const loadCv = useCallback(async () => {
    if (!studentId) return;
    setCvLoading(true);
    try {
      const res = await fetch(
        `/api/students/${studentId}/manage-upload/cv-documents`,
      );
      if (!res.ok) throw new Error("Lỗi tải CV");
      const data = await res.json();
      setCvData({
        documents: data.documents ?? [],
        maxSlots: data.maxSlots ?? 2,
        plan: data.plan ?? "FREE",
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi tải CV");
    } finally {
      setCvLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadEssays();
  }, [loadEssays]);
  useEffect(() => {
    loadCv();
  }, [loadCv]);

  const saveEssay = async (slotIndex: number) => {
    if (!studentId) return;
    const raw = essayDrafts[slotIndex] ?? "";
    const title = essayTitles[slotIndex] ?? "";
    const content = sanitizeHtml(raw);
    const m = essayMeta[slotIndex] ?? emptyEssayMeta();
    const strengths = m.strengthsText
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const entities = m.entitiesText
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const tw = parseInt(m.target_words, 10);
    const targetWords =
      Number.isFinite(tw) && tw >= 1 ? Math.min(500_000, tw) : 650;
    setEssaySaving(true);
    try {
      const res = await fetch(
        `/api/students/${studentId}/manage-upload/essays`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slot_index: slotIndex,
            content,
            title,
            essay_prompt: m.essay_prompt,
            target_words: targetWords,
            target_culture: m.target_culture || "A",
            applicant_core_strengths: strengths,
            target_program_entities: entities,
            target_goal_id: m.selectedGoalId || null,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi lưu essay");
      toast.success("Đã lưu essay");
      await loadEssays();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi lưu");
    } finally {
      setEssaySaving(false);
    }
  };

  const uploadCv = async (slotIndex: number, file: File) => {
    if (!studentId) return;
    const maxBytes = 25 * 1024 * 1024;
    const allowedCv = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "image/png",
      "image/jpeg",
      "image/webp",
    ];
    if (!allowedCv.includes(file.type)) {
      toast.error("CV: chấp nhận PDF, DOCX, DOC hoặc ảnh PNG/JPEG/WebP.");
      return;
    }
    if (file.size > maxBytes) {
      toast.error("File CV quá lớn", {
        description:
          `Dung lượng hiện tại ${(file.size / 1024 / 1024).toFixed(1)}MB vượt giới hạn ${(maxBytes / 1024 / 1024).toFixed(0)}MB. ` +
          "Hãy thử nén PDF hoặc xuất PDF dạng text (không scan).",
      });
      return;
    }
    setCvUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("documentType", "cv");
      form.append("slot_index", String(slotIndex));
      const res = await fetch(`/api/students/${studentId}/upload-cv`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi upload");
      toast.success("Đã tải CV lên", {
        description: getUploadCvVerifyDescription(data),
      });
      await loadCv();
    } catch (e) {
      toast.error("Không thể tải CV", {
        description: e instanceof Error ? e.message : "Lỗi upload",
      });
    } finally {
      setCvUploading(false);
    }
  };

  const triggerCvFileInput = (slot: number) => {
    if (cvUploading) return;
    (window as unknown as { __currentCvSlot?: number }).__currentCvSlot = slot;
    cvInputRef.current?.click();
  };

  const removeCv = async (slotIndex: number) => {
    if (!studentId) return;
    setCvDeletingSlot(slotIndex);
    try {
      const res = await fetch(
        `/api/students/${studentId}/manage-upload/cv-documents?slot_index=${slotIndex}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi gỡ CV");
      toast.success("Đã gỡ CV");
      await loadCv();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi gỡ CV");
    } finally {
      setCvDeletingSlot(null);
    }
  };

  const maxEssaySlots = essayData?.maxSlots ?? 2;
  const maxCvSlots = cvData?.maxSlots ?? 2;

  return (
    <StudentPageContainer fullWidth className="min-h-[60vh] min-w-[320px]">
      <div className="w-full min-w-0">
        {/* Hero / Section label + headline */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="relative mb-8 overflow-hidden rounded-2xl border border-border bg-card px-5 py-6 shadow-sm sm:px-8 sm:py-6"
        >
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-[0.06]"
            style={{
              background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_SEC})`,
            }}
          />
          <div className="relative">
            <motion.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-3 py-1.5"
            >
              <span
                className="h-2 w-2 rounded-full bg-[var(--accent)] animate-pulse"
                style={{ backgroundColor: ACCENT }}
              />
              <span className="font-sans font-medium text-[11px] uppercase tracking-[0.15em] text-[var(--accent)]">
                Tài liệu hồ sơ
              </span>
            </motion.div>
            <motion.h1
              variants={fadeInUp}
              className="mt-3 font-university-display text-xl font-bold leading-tight text-foreground sm:text-2xl md:text-3xl"
            >
              <span className="relative inline-block">
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage: `linear-gradient(to right, ${ACCENT}, ${ACCENT_SEC})`,
                  }}
                >
                  Quản lý tài liệu
                </span>
                <span
                  style={{
                    background: `linear-gradient(to right, ${ACCENT}, ${ACCENT_SEC})`,
                  }}
                />
              </span>
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground"
            >
              Upload và quản lý Essay, CV. Tối đa {maxEssaySlots} ô tài liệu theo gói hiện tại.
            </motion.p>
          </div>
        </motion.section>

        <input
          ref={cvInputRef}
          type="file"
          accept=".pdf,.doc,.docx,image/png,image/jpeg,image/webp"
          className="sr-only"
          aria-hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            const slot = (window as unknown as { __currentCvSlot?: number })
              .__currentCvSlot;
            if (f && typeof slot === "number") uploadCv(slot, f);
            e.target.value = "";
          }}
        />

        {/* Section Essay */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          variants={stagger}
          className="mb-12 rounded-2xl border border-border bg-card p-6 shadow-md transition-shadow hover:shadow-lg sm:p-8"
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
              style={{
                background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_SEC})`,
                boxShadow: "0 4px 14px rgba(0, 82, 255, 0.25)",
              }}
            >
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Essay
              </h2>
              <p className="text-sm text-muted-foreground">
                Chỉnh sửa dạng HTML. Tối đa {maxEssaySlots} essay theo gói.
              </p>
            </div>
          </div>
          {essayLoading ? (
            <div className="mt-8 flex items-center justify-center py-16">
              <Loader2
                className="h-8 w-8 animate-spin text-muted-foreground"
                style={{ color: ACCENT }}
              />
            </div>
          ) : (
            <>
              <div className="mt-6">
                {Array.from({ length: maxEssaySlots }, (_, i) => i + 1).map(
                  (slot) => (
                    <div
                      key={slot}
                      className={cn(
                        "rounded-xl border border-border bg-muted/20 p-5 transition-colors",
                        essaySlide === slot ? "block" : "hidden",
                      )}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-base font-bold text-foreground">
                          Essay {slot}
                        </label>
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 rounded-full bg-gradient-to-r from-[var(--accent)] to-[#4D7CFF] px-4 text-xs font-semibold text-white shadow-sm transition-all hover:shadow hover:brightness-110"
                          disabled={essaySaving}
                          onClick={() => saveEssay(slot)}
                        >
                          {essaySaving ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <Save className="mr-1.5 h-3.5 w-3.5" />
                              Lưu lại
                            </>
                          )}
                        </Button>
                      </div>

                      <Input
                        placeholder="Tiêu đề bài luận..."
                        value={essayTitles[slot] ?? ""}
                        onChange={(e) => setEssayTitles(prev => ({ ...prev, [slot]: e.target.value }))}
                        className="mb-4 bg-background/50 h-9 text-sm"
                        disabled={essaySaving}
                      />
                      
                      <div className="mb-4 rounded-xl border border-border bg-card/40 p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-sm font-bold text-foreground">
                            Thông số phân tích
                          </p>
                          <p className="text-xs text-muted-foreground hidden sm:block">
                            Thông tin cần thiết để AI đánh giá
                          </p>
                        </div>
                        
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1.5 sm:col-span-2">
                            <Label htmlFor={`essay-prompt-${slot}`} className="text-xs text-muted-foreground font-semibold">Đề bài / yêu cầu từ trường</Label>
                            <Textarea
                              id={`essay-prompt-${slot}`}
                              rows={2}
                              placeholder="Dán đề bài chính thức..."
                              value={essayMeta[slot]?.essay_prompt ?? ""}
                              onChange={(e) =>
                                setEssayMeta((prev) => ({
                                  ...prev,
                                  [slot]: {
                                    ...(prev[slot] ?? emptyEssayMeta()),
                                    essay_prompt: e.target.value,
                                  },
                                }))
                              }
                              disabled={essaySaving}
                              className="resize-y text-sm bg-background/50 min-h-[50px]"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor={`target-words-${slot}`} className="text-xs text-muted-foreground font-semibold">Số từ mục tiêu</Label>
                            <Input
                              id={`target-words-${slot}`}
                              type="number"
                              min={1}
                              max={500000}
                              value={essayMeta[slot]?.target_words ?? "650"}
                              onChange={(e) =>
                                setEssayMeta((prev) => ({
                                  ...prev,
                                  [slot]: {
                                    ...(prev[slot] ?? emptyEssayMeta()),
                                    target_words: e.target.value,
                                  },
                                }))
                              }
                              disabled={essaySaving}
                              className="h-9 bg-background/50 text-sm"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground font-semibold">Vùng mục tiêu</Label>
                            <Select
                              value={essayMeta[slot]?.target_culture ?? "A"}
                              onValueChange={(v) =>
                                setEssayMeta((prev) => ({
                                  ...prev,
                                  [slot]: {
                                    ...(prev[slot] ?? emptyEssayMeta()),
                                    target_culture: v,
                                  },
                                }))
                              }
                              disabled={essaySaving}
                            >
                              <SelectTrigger className="h-9 bg-background/50 text-sm">
                                <SelectValue placeholder="Chọn vùng" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="A">Vùng A (US / Bắc Mỹ)</SelectItem>
                                <SelectItem value="B">Vùng B (Châu Á)</SelectItem>
                                <SelectItem value="C">Vùng C (Anh / Úc / EU / Canada)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor={`strengths-${slot}`} className="text-xs text-muted-foreground font-semibold">Thế mạnh cốt lõi</Label>
                            <Textarea
                              id={`strengths-${slot}`}
                              rows={2}
                              placeholder="Từ khóa (cách nhau bằng phẩy)..."
                              value={essayMeta[slot]?.strengthsText ?? ""}
                              onChange={(e) =>
                                setEssayMeta((prev) => ({
                                  ...prev,
                                  [slot]: {
                                    ...(prev[slot] ?? emptyEssayMeta()),
                                    strengthsText: e.target.value,
                                  },
                                }))
                              }
                              disabled={essaySaving}
                              className="resize-y text-sm bg-background/50 min-h-[50px]"
                            />
                          </div>
                          
                          <div className="space-y-1.5">
                            <Label htmlFor={`entities-${slot}`} className="text-xs text-muted-foreground font-semibold">Thực thể chương trình</Label>
                            <Textarea
                              id={`entities-${slot}`}
                              rows={2}
                              placeholder="Giáo sư, lab, môn học..."
                              value={essayMeta[slot]?.entitiesText ?? ""}
                              onChange={(e) =>
                                setEssayMeta((prev) => ({
                                  ...prev,
                                  [slot]: {
                                    ...(prev[slot] ?? emptyEssayMeta()),
                                    entitiesText: e.target.value,
                                  },
                                }))
                              }
                              disabled={essaySaving}
                              className="resize-y text-sm bg-background/50 min-h-[50px]"
                            />
                          </div>
                          
                          <div className="space-y-1.5 sm:col-span-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor={`goal-${slot}`} className="text-xs text-muted-foreground font-semibold">Ngành học mục tiêu</Label>
                              <Link
                                href="/student/target"
                                className="text-[10px] text-[var(--accent)] underline underline-offset-2 font-medium"
                              >
                                Thiết lập mục tiêu
                              </Link>
                            </div>
                            <Select
                              value={essayMeta[slot]?.selectedGoalId || "__none__"}
                              onValueChange={(v) =>
                                setEssayMeta((prev) => ({
                                  ...prev,
                                  [slot]: {
                                    ...(prev[slot] ?? emptyEssayMeta()),
                                    selectedGoalId: v === "__none__" ? "" : v,
                                  },
                                }))
                              }
                              disabled={essaySaving}
                            >
                              <SelectTrigger id={`goal-${slot}`} className="h-9 bg-background/50 text-sm">
                                <SelectValue placeholder="Chọn mục tiêu từ hồ sơ..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">— Chưa chọn —</SelectItem>
                                {profileGoals.map((g) => (
                                  <SelectItem key={g.id} value={g.id}>
                                    {g.faculty_name} — {g.university_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {profileGoals.length === 0 && (
                              <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                                Bạn chưa có mục tiêu. Hãy thêm tại trang Target.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <EssayHtmlEditor
                        value={essayDrafts[slot] ?? ""}
                        onChange={(html) =>
                          setEssayDrafts((prev) => ({ ...prev, [slot]: html }))
                        }
                        placeholder="Soạn nội dung essay (HTML)..."
                        disabled={essaySaving}
                        className="mt-2"
                      />
                    </div>
                  ),
                )}
              </div>
              <SlidePagination
                total={maxEssaySlots}
                current={essaySlide}
                onSelect={setEssaySlide}
              />
            </>
          )}
        </motion.section>

        {/* Section CV */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          variants={stagger}
          className="rounded-2xl border border-border bg-card p-6 shadow-md transition-shadow hover:shadow-lg sm:p-8"
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
              style={{
                background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_SEC})`,
                boxShadow: "0 4px 14px rgba(0, 82, 255, 0.25)",
              }}
            >
              <FileUp className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                CV (PDF / DOCX / ảnh)
              </h2>
              <p className="text-sm text-muted-foreground">
                Tải lên PDF, Word hoặc PNG/JPEG cho từng ô. Tối đa {maxCvSlots}{" "}
                CV theo gói. Sau khi đổi file cần verify lại trên trang Cải thiện
                CV.
              </p>
            </div>
          </div>
          {cvLoading ? (
            <div className="mt-8 flex items-center justify-center py-16">
              <Loader2
                className="h-8 w-8 animate-spin text-muted-foreground"
                style={{ color: ACCENT }}
              />
            </div>
          ) : (
            <>
              <div className="mt-6">
                {Array.from({ length: maxCvSlots }, (_, i) => i + 1).map(
                  (slot) => {
                    const doc = cvData?.documents?.find(
                      (d) => d.slot_index === slot,
                    );
                    return (
                      <div
                        key={slot}
                        className={cn(
                          "rounded-xl border border-border bg-muted/20 p-5",
                          cvSlide === slot ? "block" : "hidden",
                        )}
                      >
                        <label className="text-sm font-medium text-foreground">
                          CV {slot}
                        </label>
                        {doc ? (
                          <div className="mt-3 flex flex-wrap items-center gap-3">
                            <a
                              href={doc.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-[var(--accent)] underline underline-offset-2 transition-colors hover:brightness-110"
                              style={{ color: ACCENT }}
                            >
                              {doc.file_name}
                            </a>
                            <span className="text-xs text-muted-foreground">
                              {doc.cv_verified_at ? "· đã verify" : "· chưa verify"}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="rounded-xl border-destructive/50 text-destructive hover:bg-destructive/10"
                              disabled={cvDeletingSlot !== null}
                              onClick={() => removeCv(slot)}
                            >
                              {cvDeletingSlot === slot ? (
                                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="mr-1.5 h-4 w-4" />
                              )}
                              Gỡ CV
                            </Button>
                          </div>
                        ) : null}
                        {!doc && (
                          <div className="mt-3 flex flex-wrap items-center gap-3">
                            <Button
                              type="button"
                              onClick={() => triggerCvFileInput(slot)}
                              disabled={cvUploading}
                              className="rounded-xl bg-gradient-to-r from-[var(--accent)] to-[#4D7CFF] px-5 font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg hover:brightness-110"
                            >
                              {cvUploading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Upload className="mr-2 h-4 w-4" />
                              )}
                              Tải CV lên
                            </Button>
                            <span className="text-xs text-muted-foreground">
                              PDF, DOCX, PNG…
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  },
                )}
              </div>
              <SlidePagination
                total={maxCvSlots}
                current={cvSlide}
                onSelect={setCvSlide}
              />
            </>
          )}
        </motion.section>
      </div>
    </StudentPageContainer>
  );
}
