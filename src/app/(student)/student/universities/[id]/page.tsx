'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((c) => 0x1f1e6 - 65 + c.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

type University = {
  id: number;
  qs_rank: number;
  previous_rank: string | null;
  name: string;
  country: string;
  country_code: string | null;
  region: string | null;
  size: string | null;
  focus: string | null;
  research_level: string | null;
  type: string | null;
  qs_overall_score: number | null;
  ranking_year: number;
  academic_reputation: number;
  employer_reputation: number;
  faculty_student_ratio: number;
  citations_per_faculty: number;
  international_faculty: number;
  international_students: number;
  isd_score: number | null;
  irn_score: number | null;
  eo_score: number | null;
  sus_score: number | null;
  ar_rank: string | null;
  er_rank: string | null;
  fsr_rank: string | null;
  cpf_rank: string | null;
  ifr_rank: string | null;
  isr_rank: string | null;
  isd_rank: string | null;
  irn_rank: string | null;
  eo_rank: string | null;
  sus_rank: string | null;
};

type MetricDef = {
  scoreKey: keyof University;
  rankKey: keyof University | null;
  label: string;
};

const METRICS: MetricDef[] = [
  { scoreKey: 'qs_overall_score', rankKey: null, label: 'Tổng thể (Overall)' },
  { scoreKey: 'academic_reputation', rankKey: 'ar_rank', label: 'Uy tín học thuật' },
  { scoreKey: 'employer_reputation', rankKey: 'er_rank', label: 'Uy tín nhà tuyển dụng' },
  { scoreKey: 'faculty_student_ratio', rankKey: 'fsr_rank', label: 'Cán bộ / sinh viên' },
  { scoreKey: 'citations_per_faculty', rankKey: 'cpf_rank', label: 'Trích dẫn / cán bộ' },
  { scoreKey: 'international_faculty', rankKey: 'ifr_rank', label: 'Cán bộ quốc tế' },
  { scoreKey: 'international_students', rankKey: 'isr_rank', label: 'Sinh viên quốc tế' },
  { scoreKey: 'isd_score', rankKey: 'isd_rank', label: 'Đa dạng sinh viên quốc tế' },
  { scoreKey: 'irn_score', rankKey: 'irn_rank', label: 'Mạng nghiên cứu quốc tế' },
  { scoreKey: 'eo_score', rankKey: 'eo_rank', label: 'Cơ hội việc làm' },
  { scoreKey: 'sus_score', rankKey: 'sus_rank', label: 'Bền vững' },
];

export default function StudentUniversityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [university, setUniversity] = useState<University | null>(null);
  const [loading, setLoading] = useState(true);
  const [id, setId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const backHref = searchParams.get('from') || '/student/universities';

  useEffect(() => {
    void Promise.resolve(params).then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/universities/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.university) setUniversity(data.university);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !id) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-background text-foreground">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!university) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 bg-background px-4 text-foreground">
        <p className="text-muted-foreground">Không tìm thấy trường.</p>
        <Link href={backHref} className="text-primary hover:underline">
          ← Quay lại danh sách
        </Link>
      </div>
    );
  }

  const regionGradients: Record<string, string> = {
    Asia: 'from-amber-500/20 to-background',
    Europe: 'from-blue-500/20 to-background',
    Americas: 'from-emerald-500/20 to-background',
    'North America': 'from-emerald-500/20 to-background',
    Oceania: 'from-cyan-500/20 to-background',
    'Latin America': 'from-rose-500/20 to-background',
    Africa: 'from-violet-500/20 to-background',
    'Middle East & Africa': 'from-violet-500/20 to-background',
  };
  const heroGradient =
    (university.region && regionGradients[university.region]) || 'from-muted to-background';

  const yearLabel = university.ranking_year ?? 2026;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border px-4 py-3 sm:px-6 md:px-8 bg-background sticky top-0 z-10">
        <div className="mx-auto max-w-5xl">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm hover:bg-muted hover:text-foreground transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Quay lại trang trước
          </Link>
        </div>
      </div>

      <header className={`bg-linear-to-b ${heroGradient} px-4 py-10 sm:px-6 md:px-8`}>
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span
              className={`rounded-lg px-3 py-1.5 text-sm font-bold shadow-sm ${
                university.qs_rank <= 10
                  ? 'bg-amber-500 text-amber-950 dark:bg-amber-400 dark:text-amber-950 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                  : university.qs_rank <= 50
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-orange-600 text-white dark:bg-orange-500 dark:text-white'
              }`}
            >
              #{university.qs_rank} QS World {yearLabel}
            </span>
            {university.previous_rank && (
              <span className="rounded-lg bg-card/50 px-3 py-1.5 text-sm text-muted-foreground border border-border/50">
                Hạng {yearLabel - 1}: {university.previous_rank}
              </span>
            )}
            <span className="rounded-lg bg-card/50 px-3 py-1.5 text-sm text-foreground border border-border/50 flex items-center gap-1.5">
              {getFlagEmoji(university.country_code ?? '')} {university.country}
            </span>
          </div>
          <h1 className="font-university-display text-4xl font-bold leading-tight text-foreground sm:text-5xl md:text-6xl">
            {university.name}
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 md:px-8">
        <section className="mb-10">
          <h2 className="mb-5 text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <span className="h-4 w-1 rounded-full bg-primary/60"></span>
            Phân loại & Thông tin
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col justify-center rounded-xl border border-border bg-card px-4 py-3 shadow-sm hover:border-primary/30 hover:shadow-md transition-all">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Quốc gia</p>
              <p className="font-medium text-foreground mt-0.5 truncate">{university.country}</p>
            </div>
            {university.region && (
              <div className="flex flex-col justify-center rounded-xl border border-border bg-card px-4 py-3 shadow-sm hover:border-primary/30 hover:shadow-md transition-all">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Khu vực</p>
                <p className="font-medium text-foreground mt-0.5 truncate">{university.region}</p>
              </div>
            )}
            {university.size && (
              <div className="flex flex-col justify-center rounded-xl border border-border bg-card px-4 py-3 shadow-sm hover:border-primary/30 hover:shadow-md transition-all">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Quy mô (Size)</p>
                <p className="font-medium text-foreground mt-0.5 truncate">{university.size}</p>
              </div>
            )}
            {university.focus && (
              <div className="flex flex-col justify-center rounded-xl border border-border bg-card px-4 py-3 shadow-sm hover:border-primary/30 hover:shadow-md transition-all">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Trọng tâm (Focus)</p>
                <p className="font-medium text-foreground mt-0.5 truncate">{university.focus}</p>
              </div>
            )}
            {university.research_level && (
              <div className="flex flex-col justify-center rounded-xl border border-border bg-card px-4 py-3 shadow-sm hover:border-primary/30 hover:shadow-md transition-all">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Mức nghiên cứu</p>
                <p className="font-medium text-foreground mt-0.5 truncate">{university.research_level}</p>
              </div>
            )}
            {university.type && (
              <div className="flex flex-col justify-center rounded-xl border border-border bg-card px-4 py-3 shadow-sm hover:border-primary/30 hover:shadow-md transition-all">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Loại hình</p>
                <p className="font-medium text-foreground mt-0.5 truncate">{university.type}</p>
              </div>
            )}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="mb-8 text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <span className="h-4 w-1 rounded-full bg-primary/60"></span>
            Điểm thành phần QS ({yearLabel})
          </h2>
          
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            
            {/* Overall Score Circle - Center/Right layout */}
            <div className="lg:order-2 shrink-0 flex flex-col items-center justify-center p-8 bg-card rounded-full shadow-xl relative w-56 h-56">
               <svg viewBox="0 0 224 224" className="w-full h-full transform -rotate-90 absolute inset-0 m-auto pointer-events-none">
                 <circle cx="112" cy="112" r="104" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-muted/30" />
                 <circle cx="112" cy="112" r="104" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="653" strokeDashoffset={653 - (653 * (university.qs_overall_score ?? 0)) / 100} className="text-primary transition-all duration-1000 ease-out" strokeLinecap="round" />
               </svg>
               <div className="z-10 flex flex-col items-center">
                 <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">Overall</span>
                 <span className="text-6xl font-black text-foreground">{(university.qs_overall_score ?? 0).toFixed(1)}</span>
               </div>
            </div>

            {/* Split Metrics Grid */}
            <div className="lg:order-1 flex-1 w-full grid gap-x-10 gap-y-6 sm:grid-cols-2">
              {METRICS.filter(m => m.scoreKey !== 'qs_overall_score').map(({ scoreKey, rankKey, label }) => {
                const raw = university[scoreKey];
                const value = typeof raw === 'number' ? raw : null;
                if (value == null) return null;
                const rank = rankKey ? university[rankKey] : null;
                const display = value != null ? value.toFixed(1) : '—';
                const widthPct = value != null ? Math.min(100, value) : 0;
                
                return (
                  <div key={String(scoreKey)} className="group">
                    <div className="mb-2 flex items-end justify-between gap-2 text-sm">
                      <span className="font-medium text-foreground truncate">{label}</span>
                      <div className="shrink-0 flex items-baseline gap-2">
                        {rank != null && String(rank).trim() !== '' ? (
                          <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 text-muted-foreground">Hạng: {String(rank)}</span>
                        ) : null}
                        <span className="font-bold text-primary group-hover:scale-110 transition-transform origin-bottom-right">{display}</span>
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted/50 border border-border/50">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-brand-cyan transition-all duration-1000 ease-out"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </section>

        <p className="text-center text-xs text-muted-foreground">
          Thông tin tham khảo theo QS World University Rankings (bảng {yearLabel} trong hệ thống).
        </p>
      </main>
    </div>
  );
}
