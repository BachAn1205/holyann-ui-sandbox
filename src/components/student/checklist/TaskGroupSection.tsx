"use client";

import React from "react";
import { motion } from "framer-motion";
import type { Task } from "@/components/types";
import type { TaskGroupKey } from "./checklist-utils";
import { GROUP_LABELS } from "./checklist-utils";
import { TaskCard } from "./TaskCard";
import type { TaskCardProps } from "./TaskCard";

const groupOrder: TaskGroupKey[] = ["overdue", "today", "upcoming", "completed"];

const sectionStyles: Record<TaskGroupKey, string> = {
  overdue: "border-l-destructive/60 bg-destructive/5 dark:bg-destructive/10",
  today: "border-l-primary/60 bg-primary/5 dark:bg-primary/10",
  upcoming: "border-l-muted dark:bg-muted/20",
  completed: "border-l-muted bg-muted/5 dark:bg-muted/10",
};

export interface TaskGroupSectionProps
  extends Pick<
    TaskCardProps,
    | "onToggle"
    | "onExpand"
    | "onTaskClick"
    | "onCVUpload"
    | "onCVDelete"
    | "scanningCV"
    | "uploadingTaskId"
    | "cvScanError"
    | "scannedProfile"
    | "onSendFeedback"
    | "onUpdateStudentFeedback"
  > {
  groups: Record<TaskGroupKey, Task[]>;
  expandedTaskIds: Set<string>;
}

export function TaskGroupSection(props: TaskGroupSectionProps) {
  const {
    groups,
    expandedTaskIds,
    onToggle,
    onExpand,
    onTaskClick,
    onCVUpload,
    onCVDelete,
    scanningCV,
    uploadingTaskId,
    cvScanError,
    scannedProfile,
    onSendFeedback,
    onUpdateStudentFeedback,
  } = props;

  return (
    <div className="space-y-8">
      {groupOrder.map((key) => {
        const tasks = groups[key];
        if (!tasks || tasks.length === 0) return null;

        return (
          <motion.section
            key={key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className={`rounded-2xl border border-border border-l-4 p-4 sm:p-5 ${sectionStyles[key]}`}
          >
            <h3 className="text-sm font-bold text-muted-foreground dark:text-foreground/80 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  key === "overdue"
                    ? "bg-destructive"
                    : key === "today"
                      ? "bg-primary"
                      : key === "completed"
                        ? "bg-primary/60"
                        : "bg-muted-foreground"
                }`}
              />
              {GROUP_LABELS[key]} ({tasks.length})
            </h3>
            <div className="space-y-3">
              {tasks.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.25 }}
                >
                  <TaskCard
                    task={task}
                    isExpanded={expandedTaskIds.has(task.id)}
                    onToggle={onToggle}
                    onExpand={onExpand}
                    onTaskClick={onTaskClick}
                    onCVUpload={onCVUpload}
                    onCVDelete={onCVDelete}
                    scanningCV={scanningCV}
                    uploadingTaskId={uploadingTaskId}
                    cvScanError={cvScanError}
                    scannedProfile={scannedProfile}
                    onSendFeedback={onSendFeedback}
                    onUpdateStudentFeedback={onUpdateStudentFeedback}
                  />
                </motion.div>
              ))}
            </div>
          </motion.section>
        );
      })}
    </div>
  );
}
