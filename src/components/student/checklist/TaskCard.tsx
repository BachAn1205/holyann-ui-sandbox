"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import FeedbackChatBox from "@/components/shared/FeedbackChatBox";
import {
  CheckSquare,
  Square,
  ChevronDown,
  Calendar,
  Clock,
  AlertTriangle,
  MessageSquare,
  UploadCloud,
  FileText,
  RefreshCw,
  Trash2,
  Sparkles,
  ArrowRight,
  Loader2,
} from "lucide-react";
import type { Task } from "@/components/types";
import type { StudentProfile } from "@/components/types";
import { getTaskPriority, getCVDisplayName, getCleanFilename } from "./checklist-utils";

const priorityStyles: Record<"low" | "medium" | "high", string> = {
  low: "bg-muted text-muted-foreground ring-muted dark:bg-muted/60 dark:text-foreground/80",
  medium:
    "bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-500/20",
  high: "bg-destructive/10 text-destructive ring-destructive/20 dark:bg-destructive/20",
};

const priorityLabels: Record<"low" | "medium" | "high", string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
};

export interface TaskCardProps {
  task: Task;
  isExpanded: boolean;
  onToggle: (taskId: string) => void;
  onExpand: (taskId: string) => void;
  onTaskClick: (task: Task) => void;
  onCVUpload?: (e: React.ChangeEvent<HTMLInputElement>, taskId: string) => void;
  onCVDelete?: (taskId: string) => void;
  scanningCV?: boolean;
  uploadingTaskId?: string | null;
  cvScanError?: string;
  scannedProfile?: StudentProfile | null;
  onSendFeedback?: (task: Task, message: string) => Promise<void> | void;
  onUpdateStudentFeedback?: (
    task: Task,
    nextRaw: string | null
  ) => Promise<void> | void;
}

export function TaskCard({
  task,
  isExpanded,
  onToggle,
  onExpand,
  onTaskClick,
  onCVUpload,
  onCVDelete,
  scanningCV = false,
  uploadingTaskId = null,
  cvScanError = "",
  scannedProfile = null,
  onSendFeedback,
  onUpdateStudentFeedback,
}: TaskCardProps) {
  const router = useRouter();
  const priority = getTaskPriority(task);
  const needsFile = task.requiresFile;

  const isTestTask = !!task.linkTo;
  const isManuallyCompletable = isTestTask; // Only test tasks are auto-completed by student action

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.isLocked || task.isCompleted) return; // Already done
    if (!isManuallyCompletable) return; // Only mentor can mark non-test tasks as complete
    const cvTaskBlocked = task.linkToManageUpload && !task.uploadedFile;
    if (!cvTaskBlocked) {
      onToggle(task.id);
    }
  };

  const statusBadge = (includeCompleted = true) => {
    if (task.isCompleted && !includeCompleted) return null;
    if (task.isCompleted)
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary ring-1 ring-primary/20">
          <CheckSquare size={12} /> Đã hoàn thành
        </span>
      );
    if (task.status === "SUBMITTED")
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20">
          <Clock size={12} /> Đang review
        </span>
      );
    if (task.status === "NEEDS_REVISION")
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive ring-1 ring-destructive/20">
          <AlertTriangle size={12} /> Cần sửa lại
        </span>
      );
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${priorityStyles[priority]}`}
      >
        {priorityLabels[priority]}
      </span>
    );
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`group rounded-2xl border transition-all duration-300 cursor-pointer ${task.isCompleted
          ? "border-border/60 bg-muted/5 dark:bg-muted/10"
          : `border-border bg-card shadow-sm hover:shadow-md hover:border-primary/20 dark:hover:border-primary/30 ${isExpanded ? "ring-1 ring-primary/20 shadow-md" : "hover:-translate-y-0.5"}`
        } ${task.linkTo && !task.isCompleted ? "hover:border-primary/30" : ""}`}
      onClick={() => onTaskClick(task)}
    >
      <div className="flex items-center gap-4 p-4 sm:p-5">
        <button
          type="button"
          onClick={handleCheckboxClick}
          disabled={
            task.isLocked ||
            task.isCompleted ||
            !isManuallyCompletable ||
            (!!task.linkToManageUpload && !task.uploadedFile)
          }
          title={
            task.isCompleted
              ? "Đã hoàn thành – xác nhận bởi Cố vấn"
              : task.isLocked
                ? "Đã xác nhận từ hệ thống"
                : !isManuallyCompletable
                  ? "Chỉ Cố vấn mới có thể xác nhận hoàn thành task này sau khi review"
                  : task.linkToManageUpload && !task.uploadedFile
                    ? "Vui lòng tải CV lên trang Quản lý tài liệu"
                    : undefined
          }
          className="shrink-0 rounded-lg p-0.5 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-70"
        >
          {task.isCompleted ? (
            <motion.span
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="text-primary"
            >
              <CheckSquare size={24} className="fill-primary/20" />
            </motion.span>
          ) : task.status === "SUBMITTED" ? (
            <Clock size={24} className="text-amber-500 fill-amber-500/20" />
          ) : task.status === "NEEDS_REVISION" ? (
            <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-destructive bg-destructive/10">
              <AlertTriangle size={14} className="text-destructive" />
            </span>
          ) : (
            <Square
              size={24}
              className="text-muted-foreground group-hover:text-primary transition-colors"
            />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`font-medium text-base transition-all duration-300 ${task.isCompleted
                  ? "text-muted-foreground line-through decoration-2 decoration-muted-foreground/50"
                  : "text-foreground"
                }`}
            >
              {task.title}
            </span>
            {task.category && (
              <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground dark:bg-muted/60 dark:text-foreground/80">
                {task.category}
              </span>
            )}
            {task.linkTo && !task.isCompleted && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                <Sparkles size={12} /> Làm bài test
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar size={14} /> {task.deadline}
            </span>
            {statusBadge(false)}
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onExpand(task.id);
          }}
          className={`shrink-0 p-2 rounded-xl transition-all duration-200 ${isExpanded
              ? "bg-primary/10 text-primary rotate-180"
              : "bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground dark:bg-muted/50 dark:hover:bg-muted/70"
            }`}
          aria-expanded={isExpanded}
        >
          <ChevronDown size={20} />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden border-t border-border/60"
          >
            <div className="px-4 pb-6 pt-4 sm:px-6 sm:pl-14 space-y-5">
              <div className="flex flex-wrap items-center gap-4 pb-4 border-b border-border/60 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Calendar size={16} />
                  Hạn chót:{" "}
                  <span className="font-semibold text-foreground">
                    {task.deadline}
                  </span>
                </span>
                {statusBadge(true)}
              </div>

              {/* Mentor feedback */}
              {task.feedback &&
                (task.status === "NEEDS_REVISION" ||
                  task.status === "SUBMITTED" ||
                  task.status === "COMPLETED") && (
                  <div
                    className={`p-3 rounded-xl border-l-4 ${task.status === "NEEDS_REVISION"
                        ? "bg-destructive/10 border-destructive"
                        : task.status === "SUBMITTED"
                          ? "bg-amber-500/10 border-amber-500"
                          : "bg-primary/10 border-primary"
                      }`}
                  >
                    <div className="flex items-start gap-2">
                      <MessageSquare
                        size={16}
                        className={`mt-0.5 shrink-0 ${task.status === "NEEDS_REVISION"
                            ? "text-destructive"
                            : task.status === "SUBMITTED"
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-primary"
                          }`}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground mb-1">
                          {task.status === "NEEDS_REVISION"
                            ? "Nhận xét từ Cố vấn – Cần sửa lại:"
                            : "Nhận xét từ Cố vấn:"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {task.feedback}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              <div className="rounded-xl border border-border/60 bg-background/60 p-3">
                <FeedbackChatBox
                  mentorFeedback={task.feedback || task.mentorNote || null}
                  studentFeedback={task.studentNote || null}
                  inputPlaceholder="Nhập phản hồi cho Cố vấn..."
                  onSendMessage={
                    onSendFeedback
                      ? (message) => onSendFeedback(task, message)
                      : undefined
                  }
                  onUpdateStudentFeedback={
                    onUpdateStudentFeedback
                      ? (nextRaw) => onUpdateStudentFeedback(task, nextRaw)
                      : undefined
                  }
                />
              </div>

              {/* CV task: chuyển sang trang Quản lý tài liệu, hoàn thành khi có ít nhất 1 CV */}
              {task.linkToManageUpload && (
                <div className="rounded-2xl border border-border/60 bg-muted/20 dark:bg-muted/30 p-4">
                  {task.uploadedFile ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="shrink-0 p-2 bg-card rounded-xl border border-border/60 text-primary">
                        <FileText size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-foreground">
                          {task.uploadedFile}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          Task hoàn thành khi đã có ít nhất 1 CV trên trang Quản lý tài liệu.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-foreground mb-3">
                        Task này hoàn thành khi bạn đã tải ít nhất 1 CV lên trang Quản lý tài liệu.
                      </p>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        className="rounded-xl"
                        onClick={(e) => e.stopPropagation()}
                        asChild
                      >
                        <Link href={task.linkTo || "/student/manage-upload"}>
                          <ArrowRight className="mr-2 h-4 w-4" />
                          Đến trang Quản lý tài liệu
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              )}

              {/* File upload (các task khác cần file, không phải CV manage-upload) */}
              {needsFile && !task.linkToManageUpload && onCVUpload && onCVDelete && (
                <div>
                  {scanningCV ? (
                    <div className="flex flex-col items-center justify-center p-8 bg-muted/30 dark:bg-muted/40 border border-border/60 rounded-2xl">
                      <Loader2 className="h-10 w-10 text-primary animate-spin" />
                      <p className="mt-3 text-sm font-medium text-foreground">
                        Đang xử lý file...
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Vui lòng đợi trong giây lát
                      </p>
                    </div>
                  ) : task.uploadedFile ? (
                    <div className="p-4 bg-muted/20 dark:bg-muted/30 border border-border/60 rounded-2xl">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <div className="shrink-0 p-2 bg-card rounded-xl border border-border/60 text-primary">
                          <FileText size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold text-foreground block truncate">
                            {getCleanFilename(task.title)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Đã tải lên
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            id={`cv-replace-${task.id}`}
                            type="file"
                            accept=".pdf,.doc,.docx,.txt"
                            className="hidden"
                            onChange={(e) => onCVUpload(e, task.id)}
                            disabled={!!uploadingTaskId}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              document
                                .getElementById(`cv-replace-${task.id}`)
                                ?.click()
                            }
                            disabled={!!uploadingTaskId}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-card text-foreground text-xs font-medium hover:bg-muted dark:hover:bg-muted/80 disabled:opacity-50"
                          >
                            {uploadingTaskId === task.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <RefreshCw size={14} />
                            )}{" "}
                            Đổi file
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCVDelete(task.id);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-destructive/50 text-destructive text-xs font-medium hover:bg-destructive/10"
                          >
                            <Trash2 size={14} /> Xóa file
                          </button>
                        </div>
                      </div>
                      {scannedProfile && (
                        <div className="bg-card dark:bg-muted/20 rounded-xl p-4 border border-border/60">
                          <p className="text-xs font-bold text-primary mb-2">
                            Thông tin đã trích xuất:
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">
                                Họ tên:
                              </span>{" "}
                              <span className="font-semibold text-foreground">
                                {scannedProfile.name}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Email:
                              </span>{" "}
                              <span className="font-semibold text-foreground">
                                {scannedProfile.email}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                GPA:
                              </span>{" "}
                              <span className="font-semibold text-foreground">
                                {scannedProfile.gpa}/{scannedProfile.gpaScale}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Tiếng Anh:
                              </span>{" "}
                              <span className="font-semibold text-foreground">
                                {scannedProfile.englishLevel}
                              </span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-muted-foreground">
                                Hoạt động:
                              </span>{" "}
                              <span className="font-semibold text-foreground">
                                {scannedProfile.extracurriculars?.length ?? 0}{" "}
                                hoạt động
                              </span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-muted-foreground">
                                Thành tích:
                              </span>{" "}
                              <span className="font-semibold text-foreground">
                                {scannedProfile.achievements?.length ?? 0} thành
                                tích
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <label
                      htmlFor={`cv-upload-${task.id}`}
                      className={`relative flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border bg-muted/30 dark:bg-muted/40 hover:bg-primary/5 hover:border-primary/40 dark:hover:bg-primary/10 dark:hover:border-primary/50 rounded-2xl p-6 transition-colors ${uploadingTaskId === task.id
                          ? "cursor-wait"
                          : "cursor-pointer"
                        }`}
                    >
                      {uploadingTaskId === task.id && (
                        <div className="absolute inset-0 bg-background/80 z-10 flex flex-col items-center justify-center rounded-2xl">
                          <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
                          <span className="text-sm font-medium text-foreground">
                            Đang tải lên...
                          </span>
                        </div>
                      )}
                      <input
                        id={`cv-upload-${task.id}`}
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        className="hidden"
                        onChange={(e) => onCVUpload(e, task.id)}
                        disabled={!!uploadingTaskId}
                      />
                      <div className="p-3 bg-card rounded-full shadow-sm text-muted-foreground group-hover:text-primary transition-colors">
                        <UploadCloud size={24} />
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        {task.id === "1-2" ? "Đăng tải CV" : "Đăng tải file"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PDF, DOCX, TXT – tối đa 10MB
                      </p>
                    </label>
                  )}
                  {cvScanError && (
                    <div className="mt-3 p-3 bg-destructive/10 border border-destructive/30 rounded-xl">
                      <p className="text-xs text-destructive">{cvScanError}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tài liệu / Khám phá bản thân – feedback & CTA */}
              {task.category === "Tài liệu cần thiết" && task.feedback && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare size={16} className="text-primary" />
                    <span className="text-sm font-bold text-foreground">
                      Nhận xét từ người hướng dẫn
                    </span>
                  </div>
                  <div className="bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/20 dark:border-amber-500/40 rounded-xl p-4">
                    <p className="text-sm text-foreground leading-relaxed">
                      {task.feedback}
                    </p>
                  </div>
                </div>
              )}

              {task.category === "Khám phá bản thân" && (
                <div className="space-y-4">
                  {task.feedback && (
                    <div className="p-4 bg-primary/5 dark:bg-primary/10 border border-border/60 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={16} className="text-primary" />
                        <span className="text-sm font-bold text-foreground">
                          Mô tả bài test
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {task.feedback}
                      </p>
                    </div>
                  )}
                  {task.linkTo && !task.isCompleted && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(task.linkTo!);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold transition-all"
                    >
                      <Sparkles size={18} /> Làm bài test ngay{" "}
                      <ArrowRight size={18} />
                    </button>
                  )}
                  {task.isCompleted && (
                    <div className="p-4 bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/40 rounded-xl">
                      <div className="flex items-center gap-2">
                        <CheckSquare size={18} className="text-primary" />
                        <span className="text-sm font-bold text-primary">
                          {task.isLocked
                            ? "Bài test đã hoàn thành và được xác nhận từ hệ thống."
                            : "Bạn đã hoàn thành bài test này!"}
                        </span>
                      </div>
                      {task.isLocked && (
                        <p className="text-xs text-primary mt-2 ml-6">
                          Tiến độ được đồng bộ tự động. Không thể thay đổi thủ
                          công.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
