"use client";

import {
  Briefcase,
  GraduationCap,
  Link2,
  Mail,
  Phone,
  Sparkles,
  User,
  Award,
  Building2,
} from "lucide-react";
import type { MentorWithUser } from "@/types/mentor";
import {
  displayOrDash,
  getMentorSpecializationLabel,
} from "@/components/mentor/profile/mentor-profile-data";

type Props = {
  data: Partial<MentorWithUser>;
};

const cardBase =
  "rounded-2xl border pc-sticker-shadow overflow-hidden transition-shadow hover:shadow-md";

export default function MentorProfileOverview({ data }: Props) {
  const u = data.user;
  const avatarUrl = u?.avatar_url;
  const showAvatar =
    avatarUrl && (avatarUrl.startsWith("http") || avatarUrl.startsWith("/"));
  const initial = (u?.full_name || "?").charAt(0).toUpperCase();

  return (
    <div className="mx-auto w-full">
      {/* Giống ProfilePage học viên: lưới 12 cột, 6+6 trên desktop */}
      <div className="grid grid-cols-1 gap-5 overflow-hidden sm:gap-6 lg:grid-cols-12 lg:gap-8 lg:items-start">
        <div className="min-w-0 space-y-4 sm:space-y-6 lg:col-span-6">
          {/* Cơ bản — banner + avatar chồng như PersonalInfoCard */}
          <div
            className={`${cardBase} border-sky-200/80 border-l-4 border-l-sky-500 bg-white bg-gradient-to-br from-sky-50/90 via-card to-card dark:border-border dark:border-l-sky-400 dark:from-sky-950/35 dark:via-card dark:to-card`}
          >
            <div className="relative h-24 overflow-hidden bg-gradient-to-r from-sky-200/85 via-cyan-100/70 to-sky-100/80 dark:from-sky-900/45 dark:via-cyan-900/25 dark:to-sky-900/35 sm:h-28">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-30%,rgba(14,165,233,0.35),transparent)] dark:opacity-80" />
              <div
                className="absolute inset-0 opacity-[0.08]"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='20' cy='20' r='1.5' fill='%230ea5e9'/%3E%3C/svg%3E")`,
                }}
              />
            </div>
            <div className="relative px-4 pb-5 pt-0 sm:px-6 sm:pb-6">
              <div className="-mt-12 mb-4 flex flex-col items-center sm:-mt-14 sm:mb-5">
                <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-card bg-gradient-to-br from-sky-500/25 to-cyan-500/15 text-2xl font-bold text-sky-800 shadow-lg dark:from-sky-400/20 dark:to-cyan-500/10 dark:text-sky-200 sm:h-28 sm:w-28 sm:text-3xl">
                  {showAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl!}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{initial}</span>
                  )}
                </div>
                <p className="mt-3 text-center font-heading text-lg font-bold text-foreground sm:text-xl">
                  {displayOrDash(u?.full_name)}
                </p>
                <p className="pc-mono-caps mt-1 text-sky-600 dark:text-sky-400">
                  Cố vấn Holyann
                </p>
              </div>
              <div className="mb-3 flex items-center gap-2 border-b border-border pb-3 text-sky-700 dark:text-sky-300">
                <User className="h-5 w-5 shrink-0" />
                <h4 className="text-base font-semibold tracking-tight">
                  Thông tin liên hệ
                </h4>
              </div>
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div className="flex items-start gap-2 sm:col-span-2">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
                  <div className="min-w-0">
                    <dt className="text-xs font-medium text-muted-foreground">
                      Email
                    </dt>
                    <dd className="break-all text-foreground">
                      {displayOrDash(u?.email)}
                    </dd>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:col-span-2">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">
                      Điện thoại
                    </dt>
                    <dd className="text-foreground">
                      {displayOrDash(u?.phone_number)}
                    </dd>
                  </div>
                </div>
              </dl>
            </div>
          </div>

          {/* Amber — lĩnh vực */}
          <div
            className={`${cardBase} border-amber-500/40 border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-50/90 via-card to-card dark:border-amber-400/35 dark:from-amber-950/35 dark:via-card dark:to-card`}
          >
            <div className="h-1.5 bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400" />
            <div className="p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-2 text-amber-800 dark:text-amber-200">
                <Sparkles className="h-5 w-5" />
                <h4 className="text-base font-semibold tracking-tight">
                  Lĩnh vực chuyên môn
                </h4>
              </div>
              {data.expertises && data.expertises.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {data.expertises.map((ex) => (
                    <li
                      key={ex}
                      className="rounded-full border border-amber-400/50 bg-amber-100/80 px-3 py-1 text-sm font-medium text-amber-900 dark:border-amber-500/40 dark:bg-amber-900/40 dark:text-amber-100"
                    >
                      {ex}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Chưa thêm lĩnh vực.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-4 sm:space-y-6 lg:col-span-6">
          {/* Violet — chuyên môn */}
          <div
            className={`${cardBase} border-violet-500/35 border-l-4 border-l-violet-500 bg-gradient-to-br from-violet-50/90 via-card to-card dark:border-violet-400/30 dark:from-violet-950/40 dark:via-card dark:to-card`}
          >
            <div className="h-1.5 bg-gradient-to-r from-violet-400 via-fuchsia-500 to-purple-500" />
            <div className="p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-2 text-violet-700 dark:text-violet-300">
                <Briefcase className="h-5 w-5" />
                <h4 className="text-base font-semibold tracking-tight">
                  Thông tin chuyên môn
                </h4>
              </div>
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Chuyên môn (hệ thống)
                  </dt>
                  <dd className="mt-1 inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-800 dark:bg-violet-900/50 dark:text-violet-200">
                    {getMentorSpecializationLabel(data.specialization)}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-muted-foreground">
                    Giới thiệu
                  </dt>
                  <dd className="mt-1 whitespace-pre-wrap text-foreground">
                    {displayOrDash(data.bio)}
                  </dd>
                </div>
                <div className="flex items-start gap-2">
                  <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                  <div>
                    <dt className="text-xs text-muted-foreground">LinkedIn</dt>
                    <dd className="break-all text-foreground">
                      {displayOrDash(data.linkedin_url)}
                    </dd>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                  <div>
                    <dt className="text-xs text-muted-foreground">Website</dt>
                    <dd className="break-all text-foreground">
                      {displayOrDash(data.website_url)}
                    </dd>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:col-span-2">
                  <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      Trường / Bằng / Chuyên ngành
                    </dt>
                    <dd className="text-foreground">
                      {displayOrDash(data.university_name)}
                      {data.degree ? ` · ${data.degree}` : ""}
                      {data.major ? ` · ${data.major}` : ""}
                    </dd>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      Năm tốt nghiệp
                    </dt>
                    <dd className="text-foreground">
                      {data.graduation_year != null
                        ? data.graduation_year
                        : "—"}
                    </dd>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:col-span-2">
                  <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      Công ty & chức vụ
                    </dt>
                    <dd className="text-foreground">
                      {displayOrDash(data.current_company)}
                      {data.current_job_title
                        ? ` · ${data.current_job_title}`
                        : ""}
                    </dd>
                  </div>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    Kinh nghiệm (năm)
                  </dt>
                  <dd className="text-foreground">
                    {data.years_of_experience ?? "—"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Emerald — thành tích */}
          <div
            className={`${cardBase} border-emerald-500/40 border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-50/90 via-card to-card dark:border-emerald-400/35 dark:from-emerald-950/35 dark:via-card dark:to-card`}
          >
            <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500" />
            <div className="p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
                <Award className="h-5 w-5" />
                <h4 className="text-base font-semibold tracking-tight">
                  Thành tích nổi bật
                </h4>
              </div>
              {data.outstanding_achievements &&
              data.outstanding_achievements.length > 0 ? (
                <ul className="space-y-2">
                  {data.outstanding_achievements.map((a, i) => (
                    <li
                      key={`${a.title}-${i}`}
                      className="flex items-center justify-between gap-2 rounded-xl border border-emerald-500/25 bg-emerald-50/50 px-3 py-2.5 dark:bg-emerald-950/25"
                    >
                      <span className="font-medium text-foreground">
                        {a.title}
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        {a.year}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Chưa có thành tích.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
