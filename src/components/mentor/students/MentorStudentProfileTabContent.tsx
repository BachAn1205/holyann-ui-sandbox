'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Award,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  ChevronDown,
  FlaskConical,
  Globe,
  GraduationCap,
  Layers,
  Lightbulb,
  Mail,
  MapPin,
  Phone,
  School,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';

type StudentInfo = {
  id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  avatar_url: string | null;
  date_of_birth?: string | null;
  current_address?: string | null;
  current_school?: string | null;
  current_grade?: string | null;
  yearly_budget?: number | null;
  yearly_budget_currency?: string | null;
  yearly_budget_label?: string | null;
  talents?: string | null;
  hobbies?: string | null;
  personal_desire?: string | null;
};

type TargetGoal = {
  id: string;
  faculty_name: string;
  university_name: string | null;
};

type SchoolWishlistItem = {
  id: string;
  university_name: string | null;
  country: string | null;
  qs_rank: number | null;
};

type FacultyWishlistItem = {
  id: string;
  faculty_name: string;
};

type ParentRow = {
  id: string;
  full_name: string;
  relationship: string | null;
  phone_number: string | null;
  email: string | null;
  job_title: string | null;
};

type SubjectScore = {
  id: string;
  subject: string;
  score: number;
  year: number | null;
  semester: number | null;
  group: string | null;
};

type AcademicProfile = {
  gpa_transcript_details?: unknown;
  english_certificates?: unknown;
  standardized_tests?: unknown;
} | null;

type ActivitiesBundle = {
  academic_extracurriculars: Record<string, unknown>[];
  non_academic_extracurriculars: Record<string, unknown>[];
  research_experiences: Record<string, unknown>[];
  work_experiences: Record<string, unknown>[];
  personal_projects: Record<string, unknown>[];
};

type AchievementsBundle = {
  academic_awards: Record<string, unknown>[];
  non_academic_awards: Record<string, unknown>[];
};

export type MentorStudentProfileTabContentProps = {
  student: StudentInfo;
  academicProfile: AcademicProfile;
  subjectScores: SubjectScore[];
  targetGoals: TargetGoal[];
  schoolWishlist: SchoolWishlistItem[];
  facultyWishlist: FacultyWishlistItem[];
  parents?: ParentRow[];
  activities: ActivitiesBundle;
  achievements: AchievementsBundle;
};

const REGION_LABEL: Record<string, string> = {
  international: 'Quốc tế',
  national: 'Quốc gia',
  province: 'Tỉnh / Thành',
  city: 'Thành phố',
  school: 'Trường',
};

const AWARD_CATEGORY_LABEL: Record<string, string> = {
  science: 'Khoa học / Logic',
  social: 'Xã hội',
  language: 'Ngôn ngữ',
  sport: 'Thể thao',
  art: 'Nghệ thuật / Âm nhạc',
};

/** Giống ProfileTargetGoalsCard — luân phiên accent */
const GOAL_ACCENT = [
  {
    border: 'border-rose-500/35',
    ring: 'ring-rose-500/15',
    bg: 'from-rose-500/[0.12] via-card to-orange-500/[0.06]',
    badge: 'from-rose-500 to-orange-500 shadow-rose-500/25',
    iconFaculty: 'text-rose-600 dark:text-rose-400',
    iconSchool: 'text-orange-600 dark:text-orange-400',
    divider: 'from-rose-500/25 to-orange-500/20',
  },
  {
    border: 'border-violet-500/35',
    ring: 'ring-violet-500/15',
    bg: 'from-violet-500/[0.11] via-card to-indigo-500/[0.07]',
    badge: 'from-violet-600 to-indigo-600 shadow-violet-500/25',
    iconFaculty: 'text-violet-600 dark:text-violet-400',
    iconSchool: 'text-indigo-600 dark:text-indigo-400',
    divider: 'from-violet-500/25 to-indigo-500/20',
  },
  {
    border: 'border-cyan-500/35',
    ring: 'ring-cyan-500/15',
    bg: 'from-cyan-500/[0.1] via-card to-teal-500/[0.06]',
    badge: 'from-cyan-600 to-teal-600 shadow-cyan-500/25',
    iconFaculty: 'text-cyan-700 dark:text-cyan-400',
    iconSchool: 'text-teal-700 dark:text-teal-400',
    divider: 'from-cyan-500/25 to-teal-500/20',
  },
  {
    border: 'border-amber-500/35',
    ring: 'ring-amber-500/15',
    bg: 'from-amber-500/[0.11] via-card to-yellow-500/[0.05]',
    badge: 'from-amber-500 to-yellow-500 shadow-amber-500/25',
    iconFaculty: 'text-amber-700 dark:text-amber-400',
    iconSchool: 'text-yellow-700 dark:text-yellow-500',
    divider: 'from-amber-500/25 to-yellow-500/20',
  },
] as const;

function subjectGroupLabel(g: string | null | undefined): string {
  if (!g) return '';
  const x = g.toLowerCase();
  if (x.includes('natural') || x === 'tự nhiên') return 'Tự nhiên';
  if (x.includes('language') || x.includes('ngôn ngữ')) return 'Ngôn ngữ';
  if (x.includes('social') || x.includes('xã hội')) return 'Xã hội';
  return g;
}

function formatDateVi(iso: string | Date | null | undefined): string | null {
  if (!iso) return null;
  try {
    const d = typeof iso === 'string' ? new Date(iso) : iso;
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString('vi-VN');
  } catch {
    return null;
  }
}

function formatRoleVi(role: string): string {
  const m: Record<string, string> = {
    LEADER: 'Trưởng nhóm / Chủ tịch',
    CORE: 'Thành viên nòng cốt',
    MEMBER: 'Thành viên',
    HELP: 'Hỗ trợ',
  };
  return m[role] ?? role;
}

function regionLabel(code: string): string {
  const k = code.trim().toLowerCase();
  return REGION_LABEL[k] ?? code;
}

function str(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return '';
}

function normalizeObjectArray(raw: unknown): Record<string, unknown>[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter((x) => x && typeof x === 'object') as Record<string, unknown>[];
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>;
    if (Object.keys(o).length === 0) return [];
    if ('type' in o || 'score' in o || 'level' in o) return [o];
    return [];
  }
  return [];
}

function DetailValue({ value }: { value: string }) {
  const t = value.trim();
  if (/^https?:\/\//i.test(t)) {
    return (
      <a
        href={t}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-2 wrap-break-word hover:text-primary/80"
      >
        {t}
      </a>
    );
  }
  return <span className="whitespace-pre-wrap wrap-break-word">{value}</span>;
}

/** Giống ActivitiesSection trên /student/profile — mở rộng chi tiết */
function ActivityExpandableItem({
  itemKey,
  title,
  kind,
  rows,
}: {
  itemKey: string;
  title: string;
  kind: 'activity' | 'award';
  rows: { label: string; value: string }[];
}) {
  const filteredRows = rows.filter((r) => r.value.trim());
  return (
    <li>
      <details className="group rounded-xl border border-border bg-muted/15 open:bg-muted/25 transition-colors">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-left [&::-webkit-details-marker]:hidden">
          <ChevronDown
            className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
            aria-hidden
          />
          <span className="flex-1 min-w-0 text-sm font-semibold text-foreground leading-snug">{title}</span>
          <span
            className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
              kind === 'activity'
                ? 'bg-primary/15 text-primary border border-primary/20'
                : 'bg-amber-500/15 text-amber-900 dark:text-amber-200 border border-amber-500/25'
            }`}
          >
            {kind === 'activity' ? 'Hoạt động' : 'Giải thưởng'}
          </span>
        </summary>
        <div className="border-t border-border px-3 pb-3 pt-2">
          {filteredRows.length === 0 ? (
            <p className="text-xs text-muted-foreground pl-6">Không có thêm chi tiết.</p>
          ) : (
            <dl className="space-y-2.5 pl-6">
              {filteredRows.map((row) => (
                <div key={`${itemKey}-${row.label}`}>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{row.label}</dt>
                  <dd className="mt-0.5 text-sm text-foreground whitespace-pre-wrap">
                    <DetailValue value={row.value} />
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </details>
    </li>
  );
}

function extracurricularRows(act: Record<string, unknown>, category: 'academic' | 'non_academic'): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  const roleRaw = str(act.role);
  if (roleRaw) rows.push({ label: 'Vai trò', value: formatRoleVi(roleRaw) });
  const org = str(act.organization);
  if (org) rows.push({ label: 'Tổ chức', value: org });
  const start = formatDateVi(act.start_date as string | Date | undefined);
  const end = formatDateVi(act.end_date as string | Date | undefined);
  if (start || end) rows.push({ label: 'Thời gian', value: [start, end].filter(Boolean).join(' → ') });
  const cat = str(act.category);
  if (category === 'non_academic' && cat) rows.push({ label: 'Phân loại', value: cat });
  const scale = act.scale;
  if (scale != null && scale !== '') rows.push({ label: 'Quy mô / Mức độ', value: String(scale) });
  const region = str(act.region);
  if (region) rows.push({ label: 'Phạm vi', value: regionLabel(region) });
  const impact = str(act.impact);
  if (impact) rows.push({ label: 'Ảnh hưởng', value: impact });
  const hpw = act.hours_per_week;
  const wpy = act.weeks_per_year;
  if (hpw != null || wpy != null) {
    rows.push({
      label: 'Cam kết thời gian',
      value: [hpw != null ? `${hpw} giờ/tuần` : null, wpy != null ? `${wpy} tuần/năm` : null].filter(Boolean).join(' · '),
    });
  }
  if (act.related_to_major != null) {
    rows.push({ label: 'Liên quan ngành', value: act.related_to_major ? 'Có' : 'Không' });
  }
  const desc = str(act.description);
  if (desc) rows.push({ label: 'Mô tả', value: desc });
  const ach = str(act.achievements);
  if (ach) rows.push({ label: 'Thành quả nổi bật', value: ach });
  return rows;
}

function researchRows(r: Record<string, unknown>): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  const inst = str(r.institution);
  if (inst) rows.push({ label: 'Cơ sở / Trường', value: inst });
  const sup = str(r.supervisor_name);
  if (sup) rows.push({ label: 'Người hướng dẫn', value: sup });
  const role = str(r.role);
  if (role) rows.push({ label: 'Vai trò', value: formatRoleVi(role) });
  const field = str(r.research_field);
  if (field) rows.push({ label: 'Lĩnh vực', value: field });
  const start = formatDateVi(r.start_date as string | Date | undefined);
  const end = formatDateVi(r.end_date as string | Date | undefined);
  if (start || end) rows.push({ label: 'Thời gian', value: [start, end].filter(Boolean).join(' → ') });
  if (r.is_current) rows.push({ label: 'Hiện tại', value: 'Đang thực hiện' });
  const meth = str(r.methodologies);
  if (meth) rows.push({ label: 'Phương pháp', value: meth });
  const findings = str(r.findings);
  if (findings) rows.push({ label: 'Kết quả', value: findings });
  const pub = str(r.publication_url);
  if (pub) rows.push({ label: 'Ấn phẩm / Link', value: pub });
  const desc = str(r.description);
  if (desc) rows.push({ label: 'Mô tả', value: desc });
  return rows;
}

function workRows(w: Record<string, unknown>): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  const title = str(w.job_title);
  if (title) rows.push({ label: 'Vị trí', value: title });
  const type = str(w.employment_type);
  if (type) rows.push({ label: 'Hình thức', value: type });
  const loc = str(w.location);
  if (loc) rows.push({ label: 'Địa điểm', value: loc });
  const start = formatDateVi(w.start_date as string | Date | undefined);
  const end = formatDateVi(w.end_date as string | Date | undefined);
  if (start || end) rows.push({ label: 'Thời gian', value: [start, end].filter(Boolean).join(' → ') });
  if (w.is_current) rows.push({ label: 'Hiện tại', value: 'Đang làm' });
  const resp = str(w.responsibilities);
  if (resp) rows.push({ label: 'Trách nhiệm', value: resp });
  const ach = str(w.achievements);
  if (ach) rows.push({ label: 'Thành tựu', value: ach });
  const skills = str(w.skills_gained);
  if (skills) rows.push({ label: 'Kỹ năng đạt được', value: skills });
  return rows;
}

function projectRows(p: Record<string, unknown>): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  const group = str(p.project_group);
  if (group) rows.push({ label: 'Nhóm dự án', value: group });
  const topic = str(p.topic);
  if (topic) rows.push({ label: 'Chủ đề', value: topic });
  const months = p.duration_months;
  if (months != null) rows.push({ label: 'Thời lượng', value: `${months} tháng` });
  const impact = str(p.impact);
  if (impact) rows.push({ label: 'Tác động', value: impact });
  if (p.tier != null) rows.push({ label: 'Mức', value: String(p.tier) });
  const desc = str(p.description);
  if (desc) rows.push({ label: 'Mô tả', value: desc });
  return rows;
}

function awardRows(a: Record<string, unknown>, kind: 'academic' | 'non'): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  const org = str(a.issuing_organization);
  if (org) rows.push({ label: 'Đơn vị trao giải', value: org });
  if (kind === 'academic') {
    const cat = str(a.category);
    if (cat) rows.push({ label: 'Hạng mục', value: AWARD_CATEGORY_LABEL[cat] ?? cat });
  } else {
    const cat = str(a.category);
    if (cat) rows.push({ label: 'Loại', value: cat });
  }
  const level = str(a.award_level);
  if (level) rows.push({ label: 'Cấp / Hạng mục mô tả', value: level });
  const region = str(a.region);
  if (region) rows.push({ label: 'Phạm vi', value: regionLabel(region) });
  if (a.year != null) rows.push({ label: 'Năm', value: String(a.year) });
  if (a.rank != null) rows.push({ label: 'Hạng', value: String(a.rank) });
  const ad = formatDateVi(a.award_date as string | Date | undefined);
  if (ad) rows.push({ label: 'Ngày nhận', value: ad });
  const desc = str(a.description);
  if (desc) rows.push({ label: 'Mô tả', value: desc });
  const cert = str(a.certificate_url);
  if (cert) rows.push({ label: 'Chứng nhận', value: cert });
  return rows;
}

function computeGpaAverage(details: unknown): number {
  if (!details || typeof details !== 'object') return 0;
  const d = details as Record<string, unknown>;
  const grades = [d.grade9, d.grade10, d.grade11, d.grade12]
    .map((x) => parseFloat(String(x ?? '')))
    .filter((g) => !Number.isNaN(g) && g > 0);
  if (grades.length === 0) return 0;
  return parseFloat((grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(2));
}

function buildEnglishLevelString(certs: Record<string, unknown>[]): string {
  if (!certs.length) return 'Chưa cập nhật';
  const parts = certs
    .map((c) => {
      const type = str(c.type);
      const level = str(c.level);
      const score = str(c.score);
      const upper = type.toUpperCase();
      if (['HSK', 'TOPIK', 'JLPT', 'JLTP'].includes(upper)) {
        return `${type} ${level} - ${score}`.replace(/\s+/g, ' ').trim();
      }
      return `${type}${level ? ` - ${level} ` : ' '}${score}`.replace(/\s+/g, ' ').trim();
    })
    .filter(Boolean);
  return parts.length ? parts.join(', ') : 'Chưa cập nhật';
}

function gpaGradesRecord(details: unknown): {
  grade9: string;
  grade10: string;
  grade11: string;
  grade12: string;
} | null {
  if (!details || typeof details !== 'object') return null;
  const d = details as Record<string, unknown>;
  const o = {
    grade9: String(d.grade9 ?? ''),
    grade10: String(d.grade10 ?? ''),
    grade11: String(d.grade11 ?? ''),
    grade12: String(d.grade12 ?? ''),
  };
  return Object.values(o).some((s) => s.trim()) ? o : null;
}

function MentorProfileReadonlyHeader({ subtitle }: { subtitle: string }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative rounded-2xl overflow-hidden mb-4 sm:mb-6 lg:mb-8 pc-hero-surface pc-sticker-shadow transition-colors duration-300"
      aria-label="Tiêu đề hồ sơ"
    >
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='48' height='48' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='24' cy='24' r='2' fill='%23111827'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
          <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden border-2 border-[#111827]/15 dark:border-white/20 bg-white/80 dark:bg-slate-900/50 pc-sticker-shadow">
            <Image
              src="/holy/2.png"
              alt=""
              fill
              className="object-contain"
              sizes="64px"
            />
          </div>
          <div>
            <h1 className="pc-display text-2xl sm:text-3xl lg:text-4xl text-[#111827] dark:text-foreground">
              Hồ sơ cá nhân
            </h1>
            <p className="pc-read-sans text-xs sm:text-sm text-[#111827]/75 dark:text-muted-foreground mt-1 font-medium">
              {subtitle}
              <span className="text-muted-foreground"> · Xem nhanh (mentor)</span>
            </p>
          </div>
        </div>
      </div>
    </motion.header>
  );
}

function MentorPersonalCard({ student }: { student: StudentInfo }) {
  const initials =
    student.full_name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';
  const hasAvatar =
    student.avatar_url &&
    (student.avatar_url.startsWith('http') || student.avatar_url.startsWith('/'));
  const displayId = student.id.replace(/-/g, '').slice(0, 8).toUpperCase();
  const dobVi = student.date_of_birth
    ? new Date(student.date_of_birth).toLocaleDateString('vi-VN')
    : 'Chưa cập nhật';

  return (
    <div className="rounded-2xl border border-slate-200 pc-sticker-shadow overflow-hidden border-l-4 border-l-primary/60 bg-white bg-linear-to-br from-primary/5 to-transparent dark:border-border dark:bg-card">
      <div className="h-20 sm:h-24 bg-linear-to-r from-blue-100 via-blue-50 to-cyan-100 relative overflow-hidden dark:from-blue-950/50 dark:via-blue-950/30 dark:to-cyan-950/25">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 2L2 14v12l18 12 18-12V14L20 2z' fill='none' stroke='%230f4c81' stroke-width='1'/%3E%3C/svg%3E")`,
          }}
        />
      </div>
      <div className="px-4 sm:px-5 pb-4 sm:pb-5 relative">
        <div className="flex flex-col items-center -mt-10 sm:-mt-12 mb-3 sm:mb-4">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-card overflow-hidden shadow-lg bg-slate-100 dark:bg-muted">
            {hasAvatar ? (
              <img src={student.avatar_url!} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-500 text-2xl font-semibold dark:bg-muted dark:text-primary">
                {initials}
              </div>
            )}
          </div>
          <h2 className="pc-display mt-3 text-center text-xl sm:text-2xl text-slate-900 dark:text-foreground">
            {student.full_name}
          </h2>
          <p className="text-xs text-slate-500 dark:text-muted-foreground">Mã HS: {displayId}</p>
        </div>
        <div className="border-t border-slate-100 dark:border-border pt-4">
          <h3 className="pc-mono-caps text-slate-600 dark:text-muted-foreground mb-3">Thông tin cá nhân</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 text-slate-700 dark:text-foreground">
              <Mail className="w-5 h-5 text-blue-600 shrink-0" />
              <span className="wrap-break-word">{student.email || 'Chưa cập nhật'}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-700 dark:text-foreground">
              <Phone className="w-5 h-5 text-blue-600 shrink-0" />
              <span>{student.phone_number || 'Chưa cập nhật'}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-700 dark:text-foreground">
              <Calendar className="w-5 h-5 text-blue-600 shrink-0" />
              <span>{dobVi}</span>
            </div>
            <div className="flex items-start gap-3 text-slate-700 dark:text-foreground">
              <MapPin className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <span className="wrap-break-word">{student.current_address || 'Chưa cập nhật'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyHint({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-4 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}

export function MentorStudentProfileTabContent({
  student,
  academicProfile,
  subjectScores,
  targetGoals,
  schoolWishlist,
  facultyWishlist,
  parents = [],
  activities,
  achievements,
}: MentorStudentProfileTabContentProps) {
  const englishCerts = normalizeObjectArray(academicProfile?.english_certificates);
  const stdTests = normalizeObjectArray(academicProfile?.standardized_tests);
  const gpaAvg = computeGpaAverage(academicProfile?.gpa_transcript_details);
  const gByGrade = gpaGradesRecord(academicProfile?.gpa_transcript_details);
  const englishLevelStr = buildEnglishLevelString(englishCerts);

  const hasAcademicBody =
    gpaAvg > 0 ||
    englishCerts.length > 0 ||
    stdTests.length > 0 ||
    subjectScores.length > 0 ||
    !!gByGrade;

  const academicEc = activities.academic_extracurriculars ?? [];
  const nonAcademicEc = activities.non_academic_extracurriculars ?? [];
  const research = activities.research_experiences ?? [];
  const work = activities.work_experiences ?? [];
  const projects = activities.personal_projects ?? [];
  const acAwards = achievements.academic_awards ?? [];
  const naAwards = achievements.non_academic_awards ?? [];

  const profileGoals = targetGoals.map((g) => ({
    facultyName: g.faculty_name,
    universityName: g.university_name?.trim() || 'Chưa chọn trường',
  }));

  const budgetDisplay =
    student.yearly_budget_label?.trim() ||
    (student.yearly_budget != null
      ? `${student.yearly_budget.toLocaleString('vi-VN')} ${student.yearly_budget_currency ?? ''}`.trim()
      : null);

  const sectionShell = 'rounded-2xl border border-border pc-sticker-shadow overflow-hidden bg-card border-l-4';

  const gradeTone = [
    'from-violet-500/12 border-violet-500/25 text-violet-900 dark:text-violet-200',
    'from-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-900 dark:text-fuchsia-200',
    'from-purple-500/10 border-purple-500/20 text-purple-900 dark:text-purple-200',
    'from-indigo-500/12 border-indigo-500/25 text-indigo-900 dark:text-indigo-200',
  ] as const;

  const activitiesEmpty =
    academicEc.length === 0 &&
    nonAcademicEc.length === 0 &&
    research.length === 0 &&
    work.length === 0 &&
    projects.length === 0 &&
    acAwards.length === 0 &&
    naAwards.length === 0;

  const relatedFilled = Boolean(
    budgetDisplay ||
      student.personal_desire?.trim() ||
      parents.some((p) => p.full_name?.trim()) ||
      student.current_school?.trim() ||
      student.current_grade?.trim() ||
      student.talents?.trim() ||
      student.hobbies?.trim(),
  );

  return (
    <div className="profile-creative-scope w-full pb-6 sm:pb-8 overflow-x-hidden transition-colors duration-300 antialiased">
      <MentorProfileReadonlyHeader subtitle={student.full_name} />
      <div className="mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 lg:gap-8 lg:items-start overflow-hidden">
          <div className="lg:col-span-6 space-y-4 sm:space-y-6 min-w-0">
            <MentorPersonalCard student={student} />
            <section
              className={`${sectionShell} border-l-indigo-500/70`}
              aria-labelledby="mentor-faculty-wishlist-heading"
            >
              <div className="px-4 sm:px-5 py-4 sm:py-4 border-b border-border bg-linear-to-r from-blue-100/80 via-blue-50/50 to-transparent dark:from-blue-900/25 dark:to-transparent">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500/10">
                    <GraduationCap className="size-5" aria-hidden />
                  </span>
                  <h2 id="mentor-faculty-wishlist-heading" className="pc-display text-lg sm:text-xl text-foreground">
                    Nguyện vọng ngành
                  </h2>
                </div>
              </div>
              <div className="px-4 sm:px-5 py-4 sm:py-5 min-w-0 space-y-4">
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Mục tiêu đã lưu</p>
                  {targetGoals.length === 0 ? (
                    <EmptyHint>Chưa có mục tiêu ngành.</EmptyHint>
                  ) : (
                    <ul className="space-y-2">
                      {targetGoals.map((goal) => (
                        <li key={goal.id} className="rounded-xl border border-border bg-muted/15 px-3 py-2.5 text-sm">
                          <p className="font-semibold text-foreground">{goal.faculty_name}</p>
                          <p className="text-muted-foreground">
                            {goal.university_name?.trim() || 'Chưa chọn trường'}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Wishlist ngành</p>
                  {facultyWishlist.length === 0 ? (
                    <EmptyHint>Chưa có ngành trong wishlist.</EmptyHint>
                  ) : (
                    <ul className="space-y-2">
                      {facultyWishlist.map((item) => (
                        <li
                          key={item.id}
                          className="rounded-xl border border-border bg-muted/10 px-3 py-2.5 text-sm font-medium"
                        >
                          {item.faculty_name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </section>
            <section className={`${sectionShell} border-l-sky-500/70`} aria-labelledby="mentor-school-wishlist-heading">
              <div className="px-4 sm:px-5 py-4 sm:py-4 border-b border-border bg-linear-to-r from-cyan-100/80 via-sky-50/50 to-transparent dark:from-sky-900/25 dark:to-transparent">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-700 dark:text-sky-300 ring-1 ring-sky-500/10">
                    <School className="size-5" aria-hidden />
                  </span>
                  <h2 id="mentor-school-wishlist-heading" className="pc-display text-lg sm:text-xl text-foreground">
                    Nguyện vọng trường
                  </h2>
                </div>
              </div>
              <div className="px-4 sm:px-5 py-4 sm:py-5">
                {schoolWishlist.length === 0 ? (
                  <EmptyHint>Chưa có trường trong wishlist.</EmptyHint>
                ) : (
                  <ul className="space-y-2">
                    {schoolWishlist.map((item) => (
                      <li key={item.id} className="rounded-xl border border-border bg-muted/10 px-3 py-2.5">
                        <p className="font-semibold text-foreground">{item.university_name || '—'}</p>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {item.country ? <span>{item.country}</span> : null}
                          {item.qs_rank != null ? <span>QS #{item.qs_rank}</span> : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>
          <div className="lg:col-span-6 space-y-4 sm:space-y-6 min-w-0">
            <section className="relative rounded-2xl border border-border pc-sticker-shadow overflow-hidden border-l-4 border-l-emerald-500/70 bg-card">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-20 h-40 w-40 rounded-full bg-emerald-400/15 blur-3xl dark:bg-emerald-500/10"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-teal-400/10 blur-2xl dark:bg-teal-500/10"
              />
              <div className="relative px-4 sm:px-5 py-3 sm:py-4 border-b border-emerald-500/15 dark:border-emerald-400/10 bg-linear-to-br from-emerald-100/95 via-teal-50/90 to-cyan-50/85 dark:from-emerald-950/50 dark:via-teal-950/35 dark:to-cyan-950/25">
                <h3 className="pc-display text-base sm:text-lg text-foreground flex items-center gap-2">
                  <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500/25 to-teal-500/20 text-emerald-800 dark:text-emerald-300 shadow-sm ring-1 ring-emerald-500/20 shrink-0">
                    <BookOpen className="size-4" aria-hidden />
                  </span>
                  Thông tin học thuật
                </h3>
              </div>
              <div className="relative p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                {!academicProfile && subjectScores.length === 0 ? (
                  <div className="sm:col-span-2 md:col-span-3">
                    <EmptyHint>Chưa cập nhật hồ sơ học thuật.</EmptyHint>
                  </div>
                ) : !hasAcademicBody && subjectScores.length === 0 ? (
                  <div className="sm:col-span-2 md:col-span-3">
                    <EmptyHint>Chưa có điểm GPA, chứng chỉ hay bài thi chuẩn hóa.</EmptyHint>
                  </div>
                ) : null}
                <div className="p-3 sm:p-4 rounded-2xl border border-emerald-500/20 bg-linear-to-br from-emerald-500/8 via-card to-card shadow-sm ring-1 ring-emerald-500/10">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800/80 dark:text-emerald-300/90 mb-2 flex items-center gap-1.5">
                    <TrendingUp className="size-3.5 opacity-80" aria-hidden />
                    GPA (thang 10)
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold tabular-nums tracking-tight text-emerald-950 dark:text-emerald-100">
                      {gpaAvg || '—'}
                    </span>
                    <span className="text-sm text-muted-foreground font-medium">/ 10</span>
                  </div>
                </div>
                <div className="p-3 sm:p-4 rounded-2xl border border-sky-500/20 bg-linear-to-br from-sky-500/7 via-card to-indigo-500/4 sm:col-span-1 md:col-span-2 shadow-sm ring-1 ring-sky-500/10">
                  <p className="text-xs font-semibold uppercase tracking-wide text-sky-900/75 dark:text-sky-300/90 mb-2 flex items-center gap-1.5">
                    <Globe className="size-3.5 opacity-80" aria-hidden />
                    Ngoại ngữ
                  </p>
                  <div className="flex items-start gap-3">
                    {englishCerts.length > 0 ? (
                      <div className="flex flex-wrap gap-x-6 gap-y-2">
                        {Array.from({ length: Math.ceil(englishCerts.length / 3) }).map((_, colIndex) => (
                          <div key={colIndex} className="flex flex-col gap-1.5">
                            {englishCerts.slice(colIndex * 3, colIndex * 3 + 3).map((c, i) => {
                              const type = str(c.type);
                              const level = str(c.level);
                              const score = str(c.score);
                              const upper = type.toUpperCase();
                              const label = ['HSK', 'TOPIK', 'JLPT', 'JLTP'].includes(upper)
                                ? `${type} ${level} - ${score}`
                                : `${type}${level ? ` - ${level} ` : ' '}${score}`;
                              return (
                                <div
                                  key={`${colIndex}-${i}`}
                                  className="flex items-center gap-2 rounded-lg bg-sky-500/5 dark:bg-sky-400/10 px-2 py-1 border border-sky-500/10"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                                  <span className="font-medium text-foreground text-sm whitespace-nowrap">{label}</span>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">{englishLevelStr}</span>
                    )}
                  </div>
                </div>
                {gByGrade ? (
                  <div className="p-3 sm:p-4 rounded-2xl border border-violet-500/20 bg-linear-to-r from-violet-500/6 via-card to-fuchsia-500/5 sm:col-span-2 md:col-span-3 shadow-sm ring-1 ring-violet-500/10">
                    <p className="text-xs font-semibold uppercase tracking-wide text-violet-900/80 dark:text-violet-300/90 mb-3 flex items-center gap-1.5">
                      <Layers className="size-3.5 opacity-80" aria-hidden />
                      GPA theo từng khối (thang 10)
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(['grade9', 'grade10', 'grade11', 'grade12'] as const).map((key, i) => (
                        <div
                          key={key}
                          className={`rounded-xl border bg-linear-to-b ${gradeTone[i % gradeTone.length]} to-card/80 px-2 py-2.5 text-center shadow-sm`}
                        >
                          <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                            {key === 'grade9' ? 'Lớp 9' : key === 'grade10' ? 'Lớp 10' : key === 'grade11' ? 'Lớp 11' : 'Lớp 12'}
                          </p>
                          <p className="text-lg font-bold tabular-nums mt-0.5">
                            {String(gByGrade[key] ?? '').trim() || '—'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {stdTests.length > 0 ? (
                  <div className="p-3 sm:p-4 rounded-2xl border border-amber-500/25 bg-linear-to-br from-amber-500/7 via-card to-orange-500/5 sm:col-span-2 md:col-span-3 shadow-sm ring-1 ring-amber-500/10">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-950/80 dark:text-amber-200/90 mb-2">
                      Bài thi chuẩn hóa
                    </p>
                    <div className="space-y-2">
                      {stdTests.map((t, i) => (
                        <div
                          key={`st-${i}`}
                          className="flex flex-wrap justify-between gap-2 rounded-lg border border-amber-500/15 bg-card/60 px-3 py-2 text-sm"
                        >
                          <span className="font-medium">{str(t.type) || 'Kỳ thi'}</span>
                          <span className="tabular-nums font-semibold">
                            {str(t.score) || '—'}
                            {t.max != null ? (
                              <span className="text-muted-foreground font-normal"> / {String(t.max)}</span>
                            ) : null}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {subjectScores.length > 0 ? (
                  <div className="p-3 sm:p-4 rounded-2xl border border-amber-500/25 bg-linear-to-br from-amber-500/7 via-card to-orange-500/5 sm:col-span-2 md:col-span-3 shadow-sm ring-1 ring-amber-500/10">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-950/80 dark:text-amber-200/90 mb-3 flex items-center gap-1.5">
                      <GraduationCap className="size-3.5 opacity-80" aria-hidden />
                      Điểm từng môn học (thang 10)
                    </p>
                    <ul className="rounded-xl border border-amber-500/15 bg-card/60 dark:bg-card/40 overflow-hidden text-sm">
                      {subjectScores.map((s, idx) => (
                        <li
                          key={s.id}
                          className={`flex flex-wrap items-baseline justify-between gap-2 px-3 py-2.5 border-b border-amber-500/10 last:border-b-0 ${
                            idx % 2 === 0 ? 'bg-amber-500/4' : 'bg-transparent'
                          }`}
                        >
                          <span className="font-medium text-foreground flex items-center gap-2 min-w-0">
                            <span className="h-6 w-1 rounded-full bg-linear-to-b from-amber-400 to-orange-500 shrink-0" />
                            <span className="truncate">{s.subject || '—'}</span>
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
            </section>
            <section className="relative rounded-2xl border border-border pc-sticker-shadow overflow-hidden bg-card border-l-4 border-l-rose-500/65">
              <div
                aria-hidden
                className="pointer-events-none absolute right-0 top-0 h-48 w-48 translate-x-1/4 -translate-y-1/4 rounded-full bg-rose-400/20 blur-3xl dark:bg-rose-600/15"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute left-0 bottom-0 h-36 w-36 -translate-x-1/3 translate-y-1/4 rounded-full bg-indigo-400/15 blur-3xl dark:bg-indigo-500/12"
              />
              <div className="relative px-4 sm:px-5 py-4 sm:py-5 border-b border-rose-500/15 dark:border-rose-400/10 bg-linear-to-br from-rose-100/90 via-amber-50/75 to-indigo-100/70 dark:from-rose-950/45 dark:via-amber-950/25 dark:to-indigo-950/35">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-rose-500/25 to-indigo-500/20 text-rose-800 dark:text-rose-200 shadow-md ring-1 ring-rose-500/20">
                    <Target className="size-5" aria-hidden />
                    <Sparkles
                      className="absolute -right-1 -top-1 size-3.5 text-amber-500 dark:text-amber-400 drop-shadow-sm"
                      aria-hidden
                    />
                  </span>
                  <div>
                    <h3 className="pc-display text-lg sm:text-xl text-foreground leading-tight">Mục tiêu</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground hidden sm:block">Ngành & trường ưu tiên</p>
                  </div>
                </div>
              </div>
              <div className="relative p-4 sm:p-5 bg-linear-to-b from-muted/15 to-transparent dark:from-muted/10">
                {profileGoals.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-rose-500/30 bg-linear-to-br from-rose-500/6 via-card to-indigo-500/5 px-4 py-10 text-center ring-1 ring-rose-500/10">
                    <Target
                      className="mx-auto mb-3 size-10 text-rose-400/60 dark:text-rose-500/50"
                      strokeWidth={1.25}
                      aria-hidden
                    />
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      Học viên chưa thêm mục tiêu ngành–trường.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {profileGoals.map((g, idx) => {
                      const tone = GOAL_ACCENT[idx % GOAL_ACCENT.length];
                      return (
                        <li
                          key={`${g.facultyName}-${g.universityName}-${idx}`}
                          className={`group relative overflow-hidden rounded-2xl border bg-linear-to-br ${tone.bg} px-0 py-0 shadow-sm ring-1 ${tone.ring} ${tone.border}`}
                        >
                          <div className="relative flex gap-3 sm:gap-4 p-3 sm:p-4">
                            {profileGoals.length > 1 ? (
                              <span
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${tone.badge} text-white text-xs font-bold shadow-lg`}
                              >
                                {idx + 1}
                              </span>
                            ) : (
                              <span
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${tone.border} bg-card/80 ${tone.iconFaculty}`}
                              >
                                <Target className="size-4" aria-hidden />
                              </span>
                            )}
                            <div className="min-w-0 flex-1 space-y-3">
                              <div className="flex items-start gap-2.5 text-sm">
                                <GraduationCap
                                  className={`size-4 shrink-0 mt-0.5 ${tone.iconFaculty}`}
                                  aria-hidden
                                />
                                <div>
                                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                                    Ngành
                                  </p>
                                  <p className="font-semibold text-foreground leading-snug text-[15px]">{g.facultyName}</p>
                                </div>
                              </div>
                              <div className={`h-px w-full bg-linear-to-r ${tone.divider} to-transparent`} aria-hidden />
                              <div className="flex items-start gap-2.5 text-sm">
                                <Building2
                                  className={`size-4 shrink-0 mt-0.5 ${tone.iconSchool}`}
                                  aria-hidden
                                />
                                <div>
                                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                                    Trường
                                  </p>
                                  <p className="font-medium text-foreground leading-snug">{g.universityName}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </section>
            <section className="rounded-2xl border border-border pc-sticker-shadow overflow-hidden border-l-4 border-l-violet-500/60 bg-card">
              <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-border bg-linear-to-r from-blue-100 via-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/10">
                <h3 className="pc-display text-base sm:text-lg text-foreground flex items-center gap-2">
                  <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-violet-500/20 text-violet-700 dark:text-violet-400 shrink-0">
                    <Award className="size-4" aria-hidden />
                  </span>
                  Hoạt động & Thành tích
                </h3>
              </div>
              <div className="p-4 sm:p-5">
                {activitiesEmpty ? (
                  <p className="text-sm text-muted-foreground italic py-2">Chưa có hoạt động hay thành tích nào.</p>
                ) : (
                  <div className="space-y-6">
                    {academicEc.length > 0 ? (
                      <div>
                        <p className="mb-2 text-sm font-bold text-blue-800 dark:text-blue-200">
                          Hoạt động học thuật & CLB
                        </p>
                        <ul className="space-y-2 list-none m-0 p-0">
                          {academicEc.map((act) => (
                            <ActivityExpandableItem
                              key={str(act.id)}
                              itemKey={str(act.id)}
                              title={str(act.activity_name) || 'Hoạt động'}
                              kind="activity"
                              rows={extracurricularRows(act, 'academic')}
                            />
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {nonAcademicEc.length > 0 ? (
                      <div>
                        <p className="mb-2 text-sm font-bold text-violet-800 dark:text-violet-200">
                          Hoạt động phi học thuật
                        </p>
                        <ul className="space-y-2 list-none m-0 p-0">
                          {nonAcademicEc.map((act) => (
                            <ActivityExpandableItem
                              key={str(act.id)}
                              itemKey={str(act.id)}
                              title={str(act.activity_name) || 'Hoạt động'}
                              kind="activity"
                              rows={extracurricularRows(act, 'non_academic')}
                            />
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {research.length > 0 ? (
                      <div>
                        <p className="mb-2 text-sm font-bold text-teal-800 dark:text-teal-200 flex items-center gap-2">
                          <FlaskConical className="h-4 w-4 text-teal-600" />
                          Kinh nghiệm nghiên cứu
                        </p>
                        <ul className="space-y-2 list-none m-0 p-0">
                          {research.map((r) => (
                            <ActivityExpandableItem
                              key={str(r.id)}
                              itemKey={str(r.id)}
                              title={str(r.project_title) || 'Đề tài'}
                              kind="activity"
                              rows={researchRows(r)}
                            />
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {work.length > 0 ? (
                      <div>
                        <p className="mb-2 text-sm font-bold text-amber-800 dark:text-amber-200 flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-amber-600" />
                          Kinh nghiệm làm việc
                        </p>
                        <ul className="space-y-2 list-none m-0 p-0">
                          {work.map((w) => (
                            <ActivityExpandableItem
                              key={str(w.id)}
                              itemKey={str(w.id)}
                              title={str(w.company_name) || 'Công ty'}
                              kind="activity"
                              rows={workRows(w)}
                            />
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {projects.length > 0 ? (
                      <div>
                        <p className="mb-2 text-sm font-bold text-rose-800 dark:text-rose-200 flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-rose-600" />
                          Dự án cá nhân
                        </p>
                        <ul className="space-y-2 list-none m-0 p-0">
                          {projects.map((p) => (
                            <ActivityExpandableItem
                              key={str(p.id)}
                              itemKey={str(p.id)}
                              title={str(p.project_name) || 'Dự án'}
                              kind="activity"
                              rows={projectRows(p)}
                            />
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {acAwards.length > 0 || naAwards.length > 0 ? (
                      <div className="grid gap-6 lg:grid-cols-2">
                        <div>
                          <p className="mb-2 text-sm font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2">
                            <Award className="h-4 w-4 text-amber-600" />
                            Giải thưởng học thuật
                          </p>
                          {acAwards.length === 0 ? (
                            <EmptyHint>Chưa có.</EmptyHint>
                          ) : (
                            <ul className="space-y-2 list-none m-0 p-0">
                              {acAwards.map((a) => (
                                <ActivityExpandableItem
                                  key={str(a.id)}
                                  itemKey={str(a.id)}
                                  title={str(a.award_name) || 'Giải'}
                                  kind="award"
                                  rows={awardRows(a, 'academic')}
                                />
                              ))}
                            </ul>
                          )}
                        </div>
                        <div>
                          <p className="mb-2 text-sm font-bold text-fuchsia-900 dark:text-fuchsia-100 flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-fuchsia-600" />
                            Giải phi học thuật
                          </p>
                          {naAwards.length === 0 ? (
                            <EmptyHint>Chưa có.</EmptyHint>
                          ) : (
                            <ul className="space-y-2 list-none m-0 p-0">
                              {naAwards.map((a) => (
                                <ActivityExpandableItem
                                  key={str(a.id)}
                                  itemKey={str(a.id)}
                                  title={str(a.award_name) || 'Giải'}
                                  kind="award"
                                  rows={awardRows(a, 'non')}
                                />
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </section>
            <section className="rounded-2xl border border-border pc-sticker-shadow overflow-hidden border-l-4 border-l-amber-500/60 bg-card">
              <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-border bg-linear-to-r from-blue-100 via-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/10">
                <h3 className="pc-display text-base sm:text-lg text-foreground flex items-center gap-2">
                  <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-amber-500/20 text-amber-800 dark:text-amber-200 shrink-0">
                    <Users className="size-4" aria-hidden />
                  </span>
                  Thông tin liên quan
                </h3>
              </div>
              <div className="p-4 sm:p-5 space-y-4 text-sm">
                {!relatedFilled ? (
                  <p className="text-muted-foreground">
                    Chưa có thông tin bổ sung (trường, ngân sách, phụ huynh…).
                  </p>
                ) : (
                  <>
                    {student.current_school?.trim() ? (
                      <div className="rounded-xl border border-border bg-muted/15 p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-0.5">Trường đang học</p>
                        <p className="text-foreground">{student.current_school}</p>
                      </div>
                    ) : null}
                    {student.current_grade?.trim() ? (
                      <div className="rounded-xl border border-border bg-muted/15 p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-0.5">Khối / lớp</p>
                        <p className="text-foreground">{student.current_grade}</p>
                      </div>
                    ) : null}
                    {budgetDisplay ? (
                      <div className="rounded-xl border border-border bg-muted/15 p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-0.5">Ngân sách (ước tính / năm)</p>
                        <p className="text-foreground">{budgetDisplay}</p>
                      </div>
                    ) : null}
                    {[student.talents, student.hobbies].some(Boolean) ? (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Năng khiếu · Sở thích</p>
                        <p className="text-foreground">{[student.talents, student.hobbies].filter(Boolean).join(' · ')}</p>
                      </div>
                    ) : null}
                    {student.personal_desire?.trim() ? (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Mong muốn cá nhân</p>
                        <p className="text-foreground whitespace-pre-wrap">{student.personal_desire}</p>
                      </div>
                    ) : null}
                    {parents.length > 0 ? (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Phụ huynh / người giám hộ</p>
                        <ul className="space-y-2">
                          {parents.map((p) => (
                            <li key={p.id} className="rounded-xl border border-border bg-muted/10 p-3 space-y-0.5">
                              <p className="font-medium text-foreground">
                                {p.full_name || '—'}
                                {p.relationship ? (
                                  <span className="text-muted-foreground font-normal"> · {p.relationship}</span>
                                ) : null}
                              </p>
                              {p.job_title?.trim() ? (
                                <p className="text-xs text-muted-foreground">Nghề: {p.job_title}</p>
                              ) : null}
                              {p.phone_number?.trim() ? (
                                <p className="text-xs text-muted-foreground">Điện thoại: {p.phone_number}</p>
                              ) : null}
                              {p.email?.trim() ? (
                                <p className="text-xs text-muted-foreground">Email: {p.email}</p>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
