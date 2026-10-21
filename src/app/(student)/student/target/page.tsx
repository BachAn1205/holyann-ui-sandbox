"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useSubscription } from "@/hooks/useSubscription";
import { StudentPageContainer } from "@/components/student";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FlappyHollies } from "@/components/games/FlappyHollies";
import {
  ArrowRight,
  Gamepad2,
  Keyboard,
  Loader2,
  MousePointerClick,
  Sparkles,
  Star,
  Shield,
  Target,
} from "lucide-react";
import { motion } from "framer-motion";
import { TargetHistorySection } from "@/components/student/target/TargetHistorySection";
import { TargetGoalSection, type TargetGoalOption, type TargetGoalRow } from "@/components/student/target/TargetGoalSection";
import { TargetPageSkeleton } from "@/components/student/target/TargetPageSkeleton";

const BRAND = "#0f4c81";
const REACH_COLOR = "#7C3AED";
const MATCH_COLOR = "#0f4c81";
const SAFE_COLOR = "#15803d";

const AREA_OPTIONS: Array<{ key: "A" | "B" | "C"; label: string; hint: string }> = [
  { key: "A", label: "Vùng A", hint: "Mỹ & Bắc Mỹ" },
  { key: "B", label: "Vùng B", hint: "Châu Á" },
  { key: "C", label: "Vùng C", hint: "EU / UK / Úc / Canada" },
];

const FEATURE1_AREA_LABEL_FALLBACK: Record<"A" | "B" | "C", string> = {
  A: "Vùng A — Mỹ & Bắc Mỹ",
  B: "Vùng B — Châu Á",
  C: "Vùng C — EU / UK / Úc / Canada",
};

const FEATURE1_AREA_BADGE_CLASS: Record<"A" | "B" | "C", string> = {
  A: "border-sky-300/80 bg-sky-100 text-sky-950 dark:border-sky-700 dark:bg-sky-950/50 dark:text-sky-100",
  B: "border-amber-300/80 bg-amber-100 text-amber-950 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100",
  C: "border-violet-300/80 bg-violet-100 text-violet-950 dark:border-violet-700 dark:bg-violet-950/50 dark:text-violet-100",
};

function normalizeFeature1Area(raw: unknown): "A" | "B" | "C" | null {
  const s = String(raw ?? "")
    .trim()
    .toUpperCase()
    .slice(0, 1);
  if (s === "A" || s === "B" || s === "C") return s;
  return null;
}

const easeOut = [0.16, 1, 0.3, 1] as const;
const stagger = { visible: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } } };

/** Một dòng từ FastAPI feature3 — `output.json` (trường × ngành). */
type AdmissionPairRow = {
  university_name?: string;
  faculty_name?: string;
  university_id?: number | null;
  delta?: number;
  qs_rank?: number;
  t_uni?: number;
  m_major?: number;
  t_target?: number;
  /** Vùng địa lý (feature 1): A / B / C */
  feature1_area?: string;
  feature1_area_label?: string;
};

type FacultiesResult = {
  reach?: AdmissionPairRow[];
  match?: AdmissionPairRow[];
  safety?: AdmissionPairRow[];
};

type ResultData = {
  ok: boolean;
  summary?: {
    pillars?: { academic: number; language: number; extracurricular: number; skills: number };
    wishlist_counts?: { faculties: number; universities: number };
    student_score?: number;
    spike_score?: number;
  };
  faculties?: FacultiesResult;
  error?: string;
};

const CATEGORIES: Array<{
  key: keyof FacultiesResult;
  title: string;
  subtitle: string;
  icon: typeof Star;
  color: string;
}> = [
  { key: "reach", title: "Reach", subtitle: "Tầm với", icon: Star, color: REACH_COLOR },
  { key: "match", title: "Match", subtitle: "Phù hợp", icon: Target, color: MATCH_COLOR },
  { key: "safety", title: "Safety", subtitle: "An toàn", icon: Shield, color: SAFE_COLOR },
];

function TargetPageContent() {
  const { session } = useAuthSession();
  const { isFree } = useSubscription();
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId =
    session?.user && ((session.user as { id?: string }).id ?? (session.user as { user_id?: string }).user_id)
      ? String((session.user as { id?: string }).id ?? (session.user as { user_id?: string }).user_id)
      : null;

  const [sectionLoading, setSectionLoading] = useState(!!studentId);
  const [limits, setLimits] = useState<{
    limit: number | null;
    used: number;
    remaining: number | null;
    has_faculty_wishlist?: boolean;
    has_school_wishlist?: boolean;
  } | null>(null);
  const [latest, setLatest] = useState<ResultData | null>(null);
  const [runConfirmOpen, setRunConfirmOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync activeTab with URL ?tab= param so back-navigation restores the correct tab
  const tabParam = searchParams.get("tab") as keyof FacultiesResult | null;
  const validTab = tabParam && ["reach", "match", "safety"].includes(tabParam) ? tabParam : "match";
  const [activeTab, setActiveTab] = useState<keyof FacultiesResult>(validTab);

  // Update URL when tab changes (replace so it doesn't add to history stack)
  const handleTabChange = useCallback(
    (tab: keyof FacultiesResult) => {
      setActiveTab(tab);
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  // Keep activeTab in sync if URL changes externally (e.g., back button)
  useEffect(() => {
    const t = searchParams.get("tab") as keyof FacultiesResult | null;
    if (t && ["reach", "match", "safety"].includes(t) && t !== activeTab) {
      setActiveTab(t);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps
  const [expandedTabs, setExpandedTabs] = useState<Record<keyof FacultiesResult, boolean>>({
    reach: false,
    match: false,
    safety: false,
  });
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [targetGoals, setTargetGoals] = useState<TargetGoalRow[]>([]);
  const [targetMaxGoals, setTargetMaxGoals] = useState(2);
  const [targetPlanLabel, setTargetPlanLabel] = useState("FREE");
  const [goalRefresh, setGoalRefresh] = useState(0);
  const [preferredAreas, setPreferredAreas] = useState<Array<"A" | "B" | "C">>([]);
  const [wishlistUniversities, setWishlistUniversities] = useState<Set<string>>(new Set());
  const [wishlistFaculties, setWishlistFaculties] = useState<Set<string>>(new Set());

  const normalizeName = useCallback((value: string) => {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }, []);

  const isUniversityInWishlist = useCallback(
    (universityName: string) => {
      const candidate = normalizeName(universityName);
      if (!candidate) return false;
      if (wishlistUniversities.has(candidate)) return true;
      for (const saved of wishlistUniversities) {
        if (candidate.includes(saved) || saved.includes(candidate)) return true;

        const savedTokens = new Set(saved.split(" ").filter((x) => x.length >= 3));
        const candTokens = new Set(candidate.split(" ").filter((x) => x.length >= 3));
        if (savedTokens.size === 0 || candTokens.size === 0) continue;
        let inter = 0;
        for (const t of savedTokens) {
          if (candTokens.has(t)) inter += 1;
        }
        const overlap = inter / Math.min(savedTokens.size, candTokens.size);
        if (overlap >= 0.6) return true;
      }
      return false;
    },
    [wishlistUniversities, normalizeName],
  );

  const fetchLimitsAndLatest = useCallback(async (sid: string) => {
    try {
      const [limRes, latRes, goalRes, facultyWishlistRes, schoolWishlistRes] = await Promise.all([
        fetch(`/api/students/${sid}/admission-chance/limits`),
        fetch(`/api/students/${sid}/admission-chance/latest`),
        fetch(`/api/students/${sid}/target-goal`),
        fetch(`/api/students/${sid}/faculty-wishlist`),
        fetch(`/api/students/${sid}/school-wishlist`),
      ]);
      if (limRes.ok) {
        const d = await limRes.json();
        setLimits({
          limit: d.limit ?? null,
          used: d.used ?? 0,
          remaining: d.remaining ?? null,
          has_faculty_wishlist: d.has_faculty_wishlist ?? false,
          has_school_wishlist: d.has_school_wishlist ?? false,
        });
      }
      if (latRes.ok) {
        const d = await latRes.json();
        const fac = d.result?.faculties as FacultiesResult | undefined;
        if (fac && (fac.reach?.length || fac.match?.length || fac.safety?.length)) {
          setLatest({
            ok: true,
            summary: d.result.summary as ResultData["summary"],
            faculties: fac,
          });
        } else {
          setLatest(null);
        }
      }
      if (goalRes.ok) {
        const d = await goalRes.json();
        setTargetGoals(Array.isArray(d.goals) ? d.goals : []);
        setTargetMaxGoals(typeof d.maxGoals === "number" ? d.maxGoals : 2);
        setTargetPlanLabel(typeof d.plan === "string" ? d.plan : "FREE");
      } else {
        setTargetGoals([]);
        setTargetMaxGoals(2);
        setTargetPlanLabel("FREE");
      }
      if (facultyWishlistRes.ok) {
        const d = await facultyWishlistRes.json();
        const names = Array.isArray(d.items)
          ? d.items
              .map((x: { faculty_name?: string }) => normalizeName(String(x?.faculty_name ?? "")))
              .filter(Boolean)
          : [];
        setWishlistFaculties(new Set(names));
      } else {
        setWishlistFaculties(new Set());
      }
      if (schoolWishlistRes.ok) {
        const d = await schoolWishlistRes.json();
        const names = Array.isArray(d.items)
          ? d.items
              .map((x: { name?: string }) => normalizeName(String(x?.name ?? "")))
              .filter(Boolean)
          : [];
        setWishlistUniversities(new Set(names));
      } else {
        setWishlistUniversities(new Set());
      }
    } catch {
      setLimits(null);
      setLatest(null);
      setTargetGoals([]);
      setTargetMaxGoals(2);
      setTargetPlanLabel("FREE");
      setWishlistFaculties(new Set());
      setWishlistUniversities(new Set());
    }
  }, [normalizeName]);

  useEffect(() => {
    if (!studentId) {
      setSectionLoading(false);
      return;
    }
    setSectionLoading(true);
    fetchLimitsAndLatest(studentId).finally(() => setSectionLoading(false));
  }, [studentId, fetchLimitsAndLatest, historyRefresh, goalRefresh]);

  const runAdmissionChance = useCallback(async () => {
    if (!studentId) return;
    setRunning(true);
    setError(null);
    try {
      const res = await fetch(`/api/students/${studentId}/admission-chance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferred_areas: preferredAreas }),
      });
      const data: ResultData = await res.json();
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Đã xảy ra lỗi");
        return;
      }
      if (data.ok && data.faculties && (data.faculties.reach || data.faculties.match || data.faculties.safety)) {
        setLatest(data);
        setHistoryRefresh((r) => r + 1);
        const limRes = await fetch(`/api/students/${studentId}/admission-chance/limits`);
        if (limRes.ok) {
          const lim = await limRes.json();
          setLimits({
            limit: lim.limit ?? null,
            used: lim.used ?? 0,
            remaining: lim.remaining ?? null,
            has_faculty_wishlist: lim.has_faculty_wishlist ?? false,
            has_school_wishlist: lim.has_school_wishlist ?? false,
          });
        }
      } else {
        setError((data as { error?: string }).error ?? "Không nhận được kết quả");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi kết nối");
    } finally {
      setRunning(false);
    }
  }, [studentId, preferredAreas]);

  const hasResult =
    latest?.ok &&
    latest?.faculties &&
    (latest.faculties.reach?.length ||
      latest.faculties.match?.length ||
      latest.faculties.safety?.length);

  // Apply FREE plan limits: exactly 1 Reach, 2 Match, 2 Safety
  let displayFaculties = latest?.faculties;
  if (displayFaculties && isFree) {
    const reach = displayFaculties.reach || [];
    const match = displayFaculties.match || [];
    const safety = displayFaculties.safety || [];

    displayFaculties = {
      reach: reach.slice(0, 1),
      match: match.slice(0, 2),
      safety: safety.slice(0, 2),
    };
  }

  const canRun =
    limits?.has_faculty_wishlist &&
    limits?.has_school_wishlist &&
    (limits.remaining === null || (limits.remaining ?? 0) > 0);
  const wishlistReady =
    Boolean(limits?.has_faculty_wishlist) && Boolean(limits?.has_school_wishlist);

  const goalOptions: TargetGoalOption[] = (() => {
    const opts: TargetGoalOption[] = [];
    const seen = new Set<string>();
    for (const key of ["reach", "match", "safety"] as const) {
      const list = displayFaculties?.[key] ?? [];
      for (const item of list) {
        const fname = item.faculty_name ?? "";
        const uname = item.university_name ?? "";
        if (!fname || !uname) continue;
        const value = `${fname}::${uname}`;
        if (seen.has(value)) continue;
        seen.add(value);
        opts.push({
          faculty_name: fname,
          university_id: null,
          university_name: uname,
          value,
        });
      }
    }
    return opts;
  })();

  const remainingLabel =
    limits?.remaining === null
      ? "Không giới hạn"
      : `${limits?.remaining ?? 0}${limits?.limit != null ? ` / ${limits.limit}` : ""}`;

  if (!studentId) {
    return (
      <StudentPageContainer fullWidth>
        <div className="profile-creative-scope py-12 text-center text-muted-foreground">
          Vui lòng đăng nhập để sử dụng tính năng này.
        </div>
      </StudentPageContainer>
    );
  }

  return (
    <StudentPageContainer fullWidth className="profile-creative-page-bg min-h-[60vh]">
      <div className="profile-creative-scope mx-auto w-full max-w-6xl overflow-x-hidden pb-10 antialiased transition-colors duration-300">
        <header
          className="relative mb-5 overflow-hidden pc-hero-surface pc-sticker-shadow sm:mb-6"
          aria-label="Mục tiêu và cơ hội trúng tuyển"
        >
          <div className="relative flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:px-6 sm:py-5">
            <div className="flex min-w-0 flex-1 items-center gap-3.5 sm:gap-4">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-[color-mix(in_srgb,#0f4c81_14%,transparent)] bg-white/90 sm:h-14 sm:w-14 dark:border-white/15 dark:bg-slate-900/60">
                <Image
                  src="/holy/2.png"
                  alt=""
                  fill
                  className="object-contain p-1"
                  sizes="56px"
                  priority
                />
              </div>
              <div className="min-w-0">
                <p className="pc-mono-caps text-[#0f4c81] dark:text-sky-300">Mục tiêu</p>
                <h1 className="pc-display text-xl text-slate-900 sm:text-2xl dark:text-foreground">
                  Cơ hội trúng tuyển
                </h1>
                <p className="pc-read-sans mt-0.5 text-sm text-slate-500 dark:text-muted-foreground">
                  Phân loại Reach / Match / Safety theo nguyện vọng và hồ sơ
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Link
                href="/student/universities"
                className="pc-chip-ghost inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-[color-mix(in_srgb,#0f4c81_6%,transparent)] hover:text-[#0f4c81] sm:px-4 sm:py-2.5 sm:text-sm dark:text-foreground dark:hover:text-sky-300"
              >
                Nguyện vọng
              </Link>
              <button
                type="button"
                onClick={() =>
                  document
                    .getElementById("target-results")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="pc-chip-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0c3d68] active:scale-[0.98] dark:hover:opacity-90"
              >
                <Target className="size-4" aria-hidden />
                Xem kết quả
              </button>
            </div>
          </div>
        </header>

        {sectionLoading ? (
          <TargetPageSkeleton />
        ) : (
          <div className="space-y-5 sm:space-y-6">
            <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12 lg:gap-6">
              <section className="pc-panel lg:col-span-7" aria-labelledby="target-run-heading">
                <div className="pc-panel-header flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,#0f4c81_10%,transparent)] text-[#0f4c81] dark:bg-sky-500/15 dark:text-sky-300">
                      <Sparkles className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <h2
                        id="target-run-heading"
                        className="pc-display text-base text-foreground sm:text-lg"
                      >
                        Chạy đánh giá
                      </h2>
                      <p className="truncate text-xs text-muted-foreground">
                        Còn lại:{" "}
                        <span className="font-semibold text-foreground">{remainingLabel}</span>
                        {limits?.limit != null ? (
                          <span className="text-muted-foreground"> · đã dùng {limits.used}</span>
                        ) : null}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
                  <div>
                    <p className="pc-mono-caps mb-2">Vùng ưa thích (tuỳ chọn)</p>
                    <div className="flex flex-wrap gap-2">
                      {AREA_OPTIONS.map((area) => {
                        const active = preferredAreas.includes(area.key);
                        return (
                          <button
                            key={area.key}
                            type="button"
                            onClick={() =>
                              setPreferredAreas((prev) =>
                                prev.includes(area.key)
                                  ? prev.filter((x) => x !== area.key)
                                  : [...prev, area.key],
                              )
                            }
                            className={`rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                              active
                                ? "border-[#0f4c81] bg-[color-mix(in_srgb,#0f4c81_10%,transparent)] text-[#0f4c81] dark:border-sky-400 dark:bg-sky-500/15 dark:text-sky-200"
                                : "border-border bg-card text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <span className="block font-semibold">{area.label}</span>
                            <span className="block text-[11px] opacity-80">{area.hint}</span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Chọn vùng để ưu tiên xác suất. Mỗi dòng kết quả vẫn hiện vùng A/B/C của trường.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      onClick={() => setRunConfirmOpen(true)}
                      disabled={!canRun || running}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#0f4c81] px-5 py-2.5 font-semibold text-white hover:bg-[#0c3d68] disabled:opacity-60 dark:bg-sky-400 dark:text-slate-950 dark:hover:bg-sky-300"
                    >
                      {running ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <Target className="size-4" />
                          Xem triển vọng các ngành
                        </>
                      )}
                    </Button>
                    {running && !runConfirmOpen ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setRunConfirmOpen(true)}
                        className="rounded-xl"
                      >
                        Chơi Flappy Hollies
                      </Button>
                    ) : null}
                  </div>
                </div>
              </section>

              <aside className="pc-panel lg:col-span-5" aria-label="Trạng thái sẵn sàng">
                <div className="pc-panel-header px-4 py-3.5 sm:px-5">
                  <h2 className="pc-display text-base text-foreground sm:text-lg">
                    Trước khi chạy
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Cần đủ nguyện vọng ngành và trường
                  </p>
                </div>
                <div className="space-y-3 px-4 py-4 sm:px-5">
                  <div
                    className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 text-sm ${
                      limits?.has_faculty_wishlist
                        ? "border-emerald-200 bg-emerald-50/80 dark:border-emerald-800 dark:bg-emerald-950/30"
                        : "border-amber-200 bg-amber-50/80 dark:border-amber-800 dark:bg-amber-950/30"
                    }`}
                  >
                    <span className="mt-0.5 font-semibold tabular-nums">
                      {limits?.has_faculty_wishlist ? "✓" : "!"}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">Nguyện vọng ngành</p>
                      <p className="text-xs text-muted-foreground">
                        {limits?.has_faculty_wishlist
                          ? "Đã có ít nhất 1 ngành"
                          : "Chưa chọn ngành"}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 text-sm ${
                      limits?.has_school_wishlist
                        ? "border-emerald-200 bg-emerald-50/80 dark:border-emerald-800 dark:bg-emerald-950/30"
                        : "border-amber-200 bg-amber-50/80 dark:border-amber-800 dark:bg-amber-950/30"
                    }`}
                  >
                    <span className="mt-0.5 font-semibold tabular-nums">
                      {limits?.has_school_wishlist ? "✓" : "!"}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">Nguyện vọng trường</p>
                      <p className="text-xs text-muted-foreground">
                        {limits?.has_school_wishlist
                          ? "Đã có ít nhất 1 trường"
                          : "Chưa chọn trường"}
                      </p>
                    </div>
                  </div>

                  {!wishlistReady ? (
                    <Button
                      asChild
                      size="sm"
                      className="w-full rounded-xl bg-[#0f4c81] hover:bg-[#0c3d68]"
                    >
                      <Link
                        href="/student/universities"
                        className="inline-flex items-center justify-center gap-1"
                      >
                        Bổ sung nguyện vọng
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Đã sẵn sàng. Chạy đánh giá để xem Reach / Match / Safety.
                    </p>
                  )}

                  {latest?.summary?.pillars ? (
                    <div className="rounded-xl border border-[color-mix(in_srgb,#0f4c81_10%,transparent)] bg-[color-mix(in_srgb,#0f4c81_4%,transparent)] px-3 py-2.5 dark:border-white/10">
                      <p className="pc-mono-caps mb-1.5">Trụ cột hồ sơ (kỳ gần nhất)</p>
                      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <div className="flex justify-between gap-2">
                          <dt>Học thuật</dt>
                          <dd className="font-semibold tabular-nums text-foreground">
                            {latest.summary.pillars.academic}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt>Ngoại ngữ</dt>
                          <dd className="font-semibold tabular-nums text-foreground">
                            {latest.summary.pillars.language}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt>Ngoại khóa</dt>
                          <dd className="font-semibold tabular-nums text-foreground">
                            {latest.summary.pillars.extracurricular}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt>Kỹ năng</dt>
                          <dd className="font-semibold tabular-nums text-foreground">
                            {latest.summary.pillars.skills}
                          </dd>
                        </div>
                      </dl>
                      {(latest.summary.student_score != null ||
                        latest.summary.spike_score != null) && (
                        <p className="mt-2 border-t border-border/60 pt-2 text-xs text-muted-foreground">
                          {latest.summary.student_score != null && (
                            <span>
                              Điểm hồ sơ{" "}
                              <strong className="text-foreground">
                                {latest.summary.student_score}
                              </strong>
                            </span>
                          )}
                          {latest.summary.spike_score != null && (
                            <span>
                              {latest.summary.student_score != null ? " · " : ""}
                              Spike{" "}
                              <strong className="text-foreground">
                                {latest.summary.spike_score}
                              </strong>
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
              </aside>
            </div>

            {error ? (
              <div
                role="alert"
                className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm"
              >
                <p className="font-semibold text-destructive">Đã xảy ra lỗi</p>
                <p className="mt-0.5 text-foreground/90">{error}</p>
              </div>
            ) : null}

            <section
              id="target-results"
              className="pc-panel scroll-mt-4"
              aria-labelledby="target-results-heading"
            >
              <div className="pc-panel-header flex flex-col gap-1 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div>
                  <h2
                    id="target-results-heading"
                    className="pc-display text-base text-foreground sm:text-lg"
                  >
                    Kết quả phân loại
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {hasResult
                      ? isFree
                        ? "Gói Free: hiện tối đa 1 Reach · 2 Match · 2 Safety"
                        : "Ưu tiên cặp trùng nguyện vọng của bạn"
                      : "Chưa có kết quả — chạy đánh giá ở panel bên trái"}
                  </p>
                </div>
              </div>

              <div className="px-4 py-4 sm:px-5 sm:py-5">
                {!hasResult ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Kết quả Reach / Match / Safety sẽ hiện tại đây sau khi chạy.
                  </p>
                ) : (
                  <motion.div initial="hidden" animate="visible" variants={stagger}>
                    <div className="mb-4 flex gap-2 rounded-xl bg-[color-mix(in_srgb,#0f4c81_5%,transparent)] p-1.5 dark:bg-white/5">
                      {CATEGORIES.map(({ key, title, subtitle, icon: Icon, color }) => {
                        const list = displayFaculties?.[key] ?? [];
                        const isActive = activeTab === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => handleTabChange(key)}
                            className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg border py-2 text-sm font-medium transition-all sm:flex-row sm:justify-center sm:gap-2 ${
                              isActive
                                ? "text-white shadow-sm"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                            style={
                              isActive
                                ? { backgroundColor: color, borderColor: color }
                                : undefined
                            }
                          >
                            <span className="inline-flex items-center gap-1.5">
                              <Icon className="size-3.5 sm:size-4" />
                              {title}
                            </span>
                            <span className="hidden text-[10px] font-normal opacity-80 sm:inline">
                              {subtitle}
                            </span>
                            <span
                              className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums sm:text-xs ${
                                isActive ? "bg-white/25" : "bg-black/8 dark:bg-white/10"
                              }`}
                            >
                              {list.length}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {(() => {
                      const activeCategory = CATEGORIES.find((c) => c.key === activeTab);
                      const accentColor = activeCategory?.color ?? BRAND;
                      const rawList = displayFaculties?.[activeTab];
                      const list: AdmissionPairRow[] = Array.isArray(rawList)
                        ? [...rawList].sort((a, b) => {
                            const aFacultyInWishlist = wishlistFaculties.has(
                              String(a.faculty_name ?? "").trim().toLowerCase(),
                            );
                            const bFacultyInWishlist = wishlistFaculties.has(
                              String(b.faculty_name ?? "").trim().toLowerCase(),
                            );
                            const aSchoolInWishlist = isUniversityInWishlist(
                              String(a.university_name ?? ""),
                            );
                            const bSchoolInWishlist = isUniversityInWishlist(
                              String(b.university_name ?? ""),
                            );
                            const aPriority =
                              (aFacultyInWishlist ? 1 : 0) + (aSchoolInWishlist ? 1 : 0);
                            const bPriority =
                              (bFacultyInWishlist ? 1 : 0) + (bSchoolInWishlist ? 1 : 0);
                            if (aPriority !== bPriority) return bPriority - aPriority;
                            const aDelta = typeof a.delta === "number" ? a.delta : 0;
                            const bDelta = typeof b.delta === "number" ? b.delta : 0;
                            if (activeTab === "reach") {
                              if (aDelta !== bDelta) return aDelta - bDelta;
                            } else if (activeTab === "safety") {
                              if (aDelta !== bDelta) return bDelta - aDelta;
                            } else {
                              const aAbs = Math.abs(aDelta);
                              const bAbs = Math.abs(bDelta);
                              if (aAbs !== bAbs) return aAbs - bAbs;
                            }
                            const uniCmp = String(a.university_name ?? "").localeCompare(
                              String(b.university_name ?? ""),
                            );
                            if (uniCmp !== 0) return uniCmp;
                            return String(a.faculty_name ?? "").localeCompare(
                              String(b.faculty_name ?? ""),
                            );
                          })
                        : [];
                      const isExpanded = expandedTabs[activeTab];
                      const INITIAL_COUNT = 5;
                      const showExpand = list.length > INITIAL_COUNT;
                      const visibleList =
                        showExpand && !isExpanded ? list.slice(0, INITIAL_COUNT) : list;
                      const hiddenCount = list.length - INITIAL_COUNT;

                      if (list.length === 0) {
                        return (
                          <p className="py-6 text-sm text-muted-foreground">
                            Chưa có cặp trường–ngành trong mục này.
                          </p>
                        );
                      }

                      return (
                        <motion.div
                          key={activeTab}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ul className="divide-y divide-[color-mix(in_srgb,#0f4c81_8%,transparent)] dark:divide-white/8">
                            {visibleList.map((item, i) => {
                              const uniName = (item.university_name ?? "").trim();
                              const facName = (item.faculty_name ?? "").trim();
                              const inSchoolWishlist = isUniversityInWishlist(uniName);
                              const inFacultyWishlist = wishlistFaculties.has(
                                normalizeName(facName),
                              );
                              const cardKey = `${activeTab}-${i}-${uniName}-${facName}`;
                              const areaKey = normalizeFeature1Area(item.feature1_area);
                              const areaLabelRaw =
                                typeof item.feature1_area_label === "string"
                                  ? item.feature1_area_label.trim()
                                  : "";
                              const areaLabel =
                                areaLabelRaw ||
                                (areaKey ? FEATURE1_AREA_LABEL_FALLBACK[areaKey] : "");
                              const preferredAreaHit =
                                Boolean(areaKey) &&
                                preferredAreas.includes(areaKey as "A" | "B" | "C");

                              return (
                                <li key={cardKey} className="pc-rank-row !px-1 sm:!px-2">
                                  <span className="pc-rank-num" style={{ color: accentColor }}>
                                    {i + 1}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate font-semibold text-foreground">
                                      {item.university_name ?? "—"}
                                    </p>
                                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                                      {item.faculty_name ?? "—"}
                                    </p>
                                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                                      {areaKey && areaLabel ? (
                                        <span
                                          className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-medium ${FEATURE1_AREA_BADGE_CLASS[areaKey]}`}
                                        >
                                          {areaLabel}
                                        </span>
                                      ) : null}
                                      {preferredAreaHit ? (
                                        <span className="rounded-md border border-emerald-300/80 bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
                                          Khớp vùng ưa thích
                                        </span>
                                      ) : null}
                                      {inSchoolWishlist ? (
                                        <span className="rounded-md border border-[color-mix(in_srgb,#0f4c81_25%,transparent)] bg-[color-mix(in_srgb,#0f4c81_8%,transparent)] px-2 py-0.5 text-[10px] font-medium text-[#0f4c81] dark:text-sky-300">
                                          NV trường
                                        </span>
                                      ) : null}
                                      {inFacultyWishlist ? (
                                        <span className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200">
                                          NV ngành
                                        </span>
                                      ) : null}
                                    </div>
                                  </div>
                                  {item.university_id ? (
                                    <Link
                                      href={`/student/universities/${item.university_id}?from=${encodeURIComponent(`/student/target?tab=${activeTab}`)}`}
                                      className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-[#0f4c81] hover:bg-[color-mix(in_srgb,#0f4c81_6%,transparent)] dark:text-sky-300"
                                    >
                                      Chi tiết
                                      <ArrowRight className="size-3.5" />
                                    </Link>
                                  ) : null}
                                </li>
                              );
                            })}
                          </ul>
                          {showExpand ? (
                            <div className="mt-3 flex justify-center">
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedTabs((prev) => ({
                                    ...prev,
                                    [activeTab]: !prev[activeTab],
                                  }))
                                }
                                className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/60"
                              >
                                {isExpanded ? "Thu gọn" : `Xem thêm ${hiddenCount} dòng`}
                              </button>
                            </div>
                          ) : null}
                        </motion.div>
                      );
                    })()}
                  </motion.div>
                )}
              </div>
            </section>

            <TargetGoalSection
              studentId={studentId}
              options={goalOptions}
              goals={targetGoals}
              maxGoals={targetMaxGoals}
              planLabel={targetPlanLabel}
              onSaved={() => setGoalRefresh((r) => r + 1)}
            />

            <TargetHistorySection key={historyRefresh} studentId={studentId} />
          </div>
        )}

        <Dialog open={runConfirmOpen} onOpenChange={setRunConfirmOpen}>
          <DialogContent className="gap-0 overflow-hidden p-0 pt-0 sm:max-w-4xl sm:pt-0">
            <DialogHeader className="space-y-0 p-0">
              <div className="border-b border-[color-mix(in_srgb,#0f4c81_12%,transparent)] bg-[color-mix(in_srgb,#0f4c81_5%,transparent)] px-6 pb-4 pt-6 dark:border-white/10">
                <DialogTitle className="pc-display text-xl tracking-tight sm:text-2xl">
                  Xem triển vọng các ngành
                </DialogTitle>
              </div>

              <DialogDescription asChild>
                {!running ? (
                  <div className="space-y-3 px-6 py-5 text-left text-sm text-muted-foreground">
                    <p>
                      Bạn sẽ dùng <strong className="text-foreground">1 lần</strong>. Kết quả{" "}
                      <strong className="text-foreground">Reach / Match / Safety</strong> được lưu
                      và hiển thị ngay.
                    </p>
                    <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
                      <p className="text-sm font-medium text-foreground">
                        Số lần còn lại:{" "}
                        {limits?.remaining === null ? (
                          <span className="text-[#0f4c81] dark:text-sky-300">Không giới hạn</span>
                        ) : (
                          <span className="text-[#0f4c81] dark:text-sky-300">
                            {limits?.remaining ?? 0}
                          </span>
                        )}
                        {limits?.limit != null && (
                          <span className="text-muted-foreground">
                            {" "}
                            / {limits.limit} (đã dùng {limits.used})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ) : (
                  <motion.div
                    className="px-6 py-5"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: easeOut }}
                  >
                    <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-5">
                      <div className="lg:col-span-2">
                        <div className="h-full rounded-2xl border border-border bg-card/70 p-4 text-left shadow-sm backdrop-blur-sm sm:p-5">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 inline-flex size-9 items-center justify-center rounded-xl bg-[color-mix(in_srgb,#0f4c81_10%,transparent)] text-[#0f4c81]">
                              <Sparkles className="size-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold leading-snug text-foreground">
                                Đang xử lý triển vọng ngành
                              </p>
                              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                Chơi{" "}
                                <span className="font-semibold text-foreground">
                                  Flappy Hollies
                                </span>{" "}
                                trong lúc đợi nhé.
                              </p>
                            </div>
                            <Loader2 className="mt-1.5 size-4 animate-spin text-muted-foreground" />
                          </div>
                          <div className="mt-4 grid gap-3">
                            <div className="rounded-xl border border-border bg-muted/15 p-3">
                              <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-foreground">
                                <Gamepad2 className="size-4 text-[#0f4c81]" />
                                Điều khiển nhanh
                              </p>
                              <ul className="space-y-2 text-xs text-muted-foreground">
                                <li className="flex items-start gap-2">
                                  <MousePointerClick className="mt-0.5 size-4 shrink-0" />
                                  <span>
                                    <span className="font-semibold text-foreground">
                                      Click/Touch
                                    </span>{" "}
                                    để bay
                                  </span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <Keyboard className="mt-0.5 size-4 shrink-0" />
                                  <span>
                                    <span className="font-semibold text-foreground">Space</span> để
                                    bay; Space/Click lần nữa để chơi lại khi thua
                                  </span>
                                </li>
                              </ul>
                            </div>
                            <div className="rounded-xl border border-border bg-muted/10 p-3">
                              <p className="text-xs leading-relaxed text-muted-foreground">
                                Bấm <span className="font-semibold text-foreground">Ẩn</span> để
                                đóng modal. Xử lý vẫn chạy nền.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="lg:col-span-3">
                        <div className="h-full rounded-2xl border border-[color-mix(in_srgb,#0f4c81_15%,transparent)] bg-[color-mix(in_srgb,#0f4c81_6%,transparent)] p-3 sm:p-4">
                          <div className="flex items-center gap-2 px-1.5 pb-2">
                            <span className="inline-flex size-8 items-center justify-center rounded-xl border border-border bg-white/70 shadow-sm dark:bg-background/70">
                              <Gamepad2 className="size-4 text-[#0f4c81]" />
                            </span>
                            <div className="leading-tight">
                              <p className="text-sm font-semibold text-foreground">
                                Flappy Hollies
                              </p>
                              <p className="text-[11px] text-muted-foreground">Nhân vật: Holie</p>
                            </div>
                          </div>
                          <div className="rounded-2xl border border-border bg-white/55 p-2 shadow-sm dark:bg-card/60 sm:p-3">
                            <FlappyHollies height={340} spriteSrc="/holy/14.png" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="border-t border-border bg-background px-6 py-4">
              <Button
                variant="outline"
                onClick={() => setRunConfirmOpen(false)}
                className="rounded-xl"
              >
                {running ? "Ẩn (vẫn đang xử lý)" : "Hủy"}
              </Button>
              <Button
                onClick={runAdmissionChance}
                disabled={running}
                className="rounded-xl bg-[#0f4c81] text-white hover:bg-[#0c3d68] dark:bg-sky-400 dark:text-slate-950"
              >
                {running ? <Loader2 className="size-4 animate-spin" /> : null}
                {running ? "Đang chạy" : "Chạy"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </StudentPageContainer>
  );
}

export default function TargetPage() {
  return (
    <Suspense fallback={<TargetPageSkeleton />}>
      <TargetPageContent />
    </Suspense>
  );
}
