"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckSquare, Award, Calendar, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActivityItem } from "./types";

const ICONS = {
  task: CheckSquare,
  grade: Award,
  deadline: Calendar,
  milestone: Zap,
};

interface RecentActivityFeedProps {
  items: ActivityItem[];
}

export function RecentActivityFeed({ items }: RecentActivityFeedProps) {
  const list = items;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
    >
      <Card className="rounded-2xl border border-border shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border px-6 py-4">
          <CardTitle className="text-base font-semibold m-0">Hoạt động gần đây</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {list.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">
              Chưa có hoạt động gần đây.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {list.map((item, i) => {
                const Icon = ICONS[item.type] ?? CheckSquare;
                return (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.03 * i }}
                    className="flex gap-4 px-6 py-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.time}
                        {item.meta && ` · ${item.meta}`}
                      </p>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
