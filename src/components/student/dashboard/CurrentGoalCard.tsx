"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Target, BookOpen, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DashboardCurrentGoal } from "./types";

const STUDENT_BASE = "/student";

interface CurrentGoalCardProps {
  currentGoal: DashboardCurrentGoal;
}

export function CurrentGoalCard({ currentGoal }: CurrentGoalCardProps) {
  const { targetFacultyName, targetUniversityName, targetUniversityId, personalDesire } = currentGoal;
  const hasTarget =
    (targetFacultyName?.trim()?.length ?? 0) > 0 && (targetUniversityName?.trim()?.length ?? 0) > 0;
  const hasAny = hasTarget || (personalDesire?.trim()?.length ?? 0) > 0;
  const itemCount = [hasTarget ? 1 : 0, personalDesire?.trim() ? 1 : 0].filter(Boolean).reduce((a, b) => a + b, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border px-6 py-4 bg-muted/30 dark:bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle className="font-heading text-base font-bold text-primary m-0">
                Mục tiêu cao nhất
              </CardTitle>
            </div>
            {hasAny ? (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                {itemCount} mục
              </span>
            ) : (
              <Link
                href={`${STUDENT_BASE}/target`}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Thiết lập mục tiêu
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {!hasAny ? (
            <div className="py-10 text-center">
              <Target className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">
                Chưa thiết lập mục tiêu
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Chọn ngành và trường mục tiêu ở trang Target (chỉ thiết lập một lần)
              </p>
              <Button asChild size="sm" className="mt-4">
                <Link href={`${STUDENT_BASE}/target`}>
                  Đến trang Target
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {hasTarget && (
                <div className="rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:border-primary/30 hover:bg-muted/30">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Mục tiêu
                      </p>
                      <p className="mt-0.5 text-sm font-medium text-foreground">
                        {targetFacultyName}
                        {targetUniversityName && (
                          <>
                            {" "}
                            <span className="text-muted-foreground">tại</span>{" "}
                            {targetUniversityId != null ? (
                              <Link
                                href={`${STUDENT_BASE}/universities/${targetUniversityId}`}
                                className="text-primary hover:underline"
                              >
                                {targetUniversityName}
                              </Link>
                            ) : (
                              targetUniversityName
                            )}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {personalDesire?.trim() && (
                <div className="rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:border-primary/30 hover:bg-muted/30">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Target className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Nguyện vọng
                      </p>
                      <p className="mt-0.5 text-sm text-foreground line-clamp-3">
                        {personalDesire}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="pt-1 flex flex-wrap gap-3">
                {!hasTarget && (
                  <Link
                    href={`${STUDENT_BASE}/target`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                  >
                    Thiết lập mục tiêu
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
                <Link
                  href={`${STUDENT_BASE}/profile`}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                >
                  Chỉnh sửa hồ sơ
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
