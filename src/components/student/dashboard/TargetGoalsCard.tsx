"use client";

import React from "react";
import { motion } from "framer-motion";
import { Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardTargetGoal } from "./types";

interface TargetGoalsCardProps {
  items: DashboardTargetGoal[];
}

export function TargetGoalsCard({ items }: TargetGoalsCardProps) {
  if (!items || items.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="h-full flex"
    >
      <Card className="rounded-2xl border border-border shadow-sm overflow-hidden bg-card w-full flex flex-col">
        <CardHeader className="border-b border-border px-6 py-4 bg-muted/30 dark:bg-muted/20">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle className="font-heading text-base font-bold text-primary m-0">
              {items.length > 1 ? "Các mục tiêu" : "Mục tiêu"}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex flex-col flex-1">
          <ul className="divide-y divide-border">
            {items.map((g, idx) => (
              <li
                key={`${g.facultyName}-${g.universityName}-${idx}`}
                className="flex items-baseline gap-2 px-6 py-4 hover:bg-muted/20 transition-colors"
              >
                {items.length > 1 && (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs mt-0.5">
                    {idx + 1}
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm flex flex-wrap gap-1">
                    <span>{g.facultyName}</span>
                    <span className="text-muted-foreground font-normal">tại</span>
                    <span>{g.universityName}</span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
}
