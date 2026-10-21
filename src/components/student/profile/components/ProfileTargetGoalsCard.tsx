"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Target, ArrowRight, GraduationCap, Building2 } from "lucide-react";
import type { StudentProfile } from "@/components/types";
import { StatusBadge } from "./StatusBadge";
import { Button } from "@/components/ui/button";

interface ProfileTargetGoalsCardProps {
  profile: StudentProfile;
  isComplete: boolean;
  /** Chỉ nội dung — dùng trong accordion cha. */
  bodyOnly?: boolean;
}

const TARGET_HREF = "/student/target";

export const ProfileTargetGoalsCard: React.FC<ProfileTargetGoalsCardProps> = ({
  profile,
  isComplete,
  bodyOnly = false,
}) => {
  const goals = useMemo(() => {
    if (profile.targetGoals && profile.targetGoals.length > 0)
      return profile.targetGoals;
    if (profile.targetGoal) return [profile.targetGoal];
    return [];
  }, [profile.targetGoals, profile.targetGoal]);

  const body = (
    <div className="p-4 sm:p-5">
      {goals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[color-mix(in_srgb,#0f4c81_20%,transparent)] bg-[color-mix(in_srgb,#0f4c81_3%,transparent)] px-4 py-8 text-center dark:border-sky-500/25 dark:bg-sky-500/5">
          <Target
            className="mx-auto mb-3 size-9 text-[#0f4c81]/45 dark:text-sky-400/50"
            strokeWidth={1.25}
            aria-hidden
          />
          <p className="mx-auto mb-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Bạn chưa thêm mục tiêu ngành–trường. Hãy vào trang Mục tiêu để
            thiết lập danh sách ưu tiên.
          </p>
          <Button
            className="rounded-lg bg-[#0f4c81] hover:bg-[#0c3d68] dark:bg-sky-400 dark:text-slate-950 dark:hover:bg-sky-300"
            asChild
          >
            <Link href={TARGET_HREF}>
              Đi tới trang Mục tiêu
              <ArrowRight className="ml-1.5 size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="m-0 list-none space-y-0 p-0">
          {goals.map((g, idx) => (
            <li
              key={`${g.facultyName}-${g.universityName}-${idx}`}
              className="pc-rank-row !items-start py-3.5"
            >
              <span className="pc-rank-num mt-0.5" aria-label={`Ưu tiên ${idx + 1}`}>
                {idx + 1}
              </span>
              <div className="min-w-0 flex-1 space-y-2.5">
                <div className="flex items-start gap-2 text-sm">
                  <GraduationCap
                    className="mt-0.5 size-4 shrink-0 text-[#0f4c81] dark:text-sky-300"
                    aria-hidden
                  />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Ngành
                    </p>
                    <p className="text-[15px] font-semibold leading-snug text-foreground">
                      {g.facultyName}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Building2
                    className="mt-0.5 size-4 shrink-0 text-[#0f4c81]/70 dark:text-sky-400/80"
                    aria-hidden
                  />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Trường
                    </p>
                    <p className="font-medium leading-snug text-foreground">
                      {g.universityName}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  if (bodyOnly) return body;

  return (
    <section className="pc-panel">
      <div className="pc-panel-header px-4 py-3.5 sm:px-5 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,#0f4c81_10%,transparent)] text-[#0f4c81] dark:bg-sky-500/15 dark:text-sky-300">
              <Target className="size-4" aria-hidden />
            </span>
            <div>
              <h3 className="pc-display text-base leading-tight text-foreground sm:text-lg">
                Mục tiêu
              </h3>
              <p className="mt-0.5 hidden text-xs text-muted-foreground sm:block">
                Ngành & trường ưu tiên của bạn
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:pt-0.5">
            <StatusBadge isComplete={isComplete} />
            <Button variant="outline" size="sm" className="gap-1.5 rounded-lg" asChild>
              <Link href={TARGET_HREF}>
                Quản lý mục tiêu
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </div>
      {body}
    </section>
  );
};
