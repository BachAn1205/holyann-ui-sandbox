"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { CalendarClock, CalendarX, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { DashboardDeadline } from "./types";

function getDaysRemaining(iso: string): { label: string; days: number } {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return { label: "Quá hạn", days: diff };
  if (diff === 1) return { label: "Ngày mai", days: diff };
  if (diff <= 7) return { label: `Còn ${diff} ngày`, days: diff };
  return {
    label: d.toLocaleDateString("vi-VN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    days: diff,
  };
}

const PRIORITY_LABELS: Record<DashboardDeadline["priority"], string> = {
  high: "Cao",
  medium: "Trung bình",
  low: "Thấp",
};

function PriorityBadge({
  priority,
}: {
  priority: DashboardDeadline["priority"];
}) {
  const styles = {
    high: "bg-destructive/10 text-destructive border-destructive/30",
    medium: "bg-accent/10 text-accent border-accent/30",
    low: "bg-muted text-muted-foreground border-border",
  };
  return (
    <Badge
      variant="outline"
      className={`text-xs font-medium ${styles[priority]}`}
    >
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}

interface UpcomingDeadlinesProps {
  items: DashboardDeadline[];
  onMarkComplete?: (id: string) => void;
}

export function UpcomingDeadlines({
  items,
  onMarkComplete,
}: UpcomingDeadlinesProps) {
  const list = items.filter((d) => !d.completed);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border px-6 py-4 bg-muted/30 dark:bg-muted/20">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-primary" />
              <CardTitle className="font-heading text-base font-bold text-primary m-0">
                Hạn nộp sắp tới
              </CardTitle>
            </div>
            <Button variant="ghost" size="sm" className="text-xs shrink-0" asChild>
              <Link href="/student/deadlines">Xem tất cả</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {list.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-muted-foreground">
              <CalendarX className="h-10 w-10 opacity-50" aria-hidden />
              <p className="text-sm">Chưa có hạn nộp nào sắp tới.</p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/student/deadlines">Quản lý hạn chót</Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-3" aria-label="Danh sách hạn nộp">
              {list.map((deadline) => {
                const { label, days } = getDaysRemaining(deadline.dueDate);
                const overdue = days <= 0;
                return (
                  <li
                    key={deadline.id}
                    className="flex gap-3 rounded-xl border border-border bg-muted/20 p-4 dark:bg-muted/10"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground leading-snug">
                          {deadline.title}
                        </p>
                        <PriorityBadge priority={deadline.priority} />
                      </div>
                      {deadline.subject ? (
                        <p className="text-xs text-muted-foreground">
                          {deadline.subject}
                        </p>
                      ) : null}
                      <p
                        className={`text-xs font-medium ${
                          overdue ? "text-destructive" : "text-muted-foreground"
                        }`}
                      >
                        {label}
                      </p>
                    </div>
                    {onMarkComplete ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        onClick={() => onMarkComplete(deadline.id)}
                        aria-label={`Đánh dấu hoàn thành: ${deadline.title}`}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
