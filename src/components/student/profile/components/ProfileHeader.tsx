"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Edit3, BarChart3 } from "lucide-react";

interface ProfileHeaderProps {
  onEditClick: () => void;
  /** Link to profile analysis page. If set, shows "Đánh giá hồ sơ" button. */
  analyzeHref?: string;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  onEditClick,
  analyzeHref,
}) => {
  const reduce = useReducedMotion();

  return (
    <motion.header
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative mb-5 sm:mb-6 lg:mb-8 overflow-hidden pc-hero-surface pc-sticker-shadow transition-colors duration-300"
      aria-label="Tiêu đề hồ sơ"
    >
      <div className="relative flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:px-6 sm:py-5 lg:px-7 lg:py-5">
        <div className="flex min-w-0 flex-1 items-center gap-3.5 sm:gap-4">
          <div className="relative h-12 w-12 sm:h-14 sm:w-14 shrink-0 overflow-hidden rounded-2xl border border-[color-mix(in_srgb,#0f4c81_14%,transparent)] bg-white/90 dark:border-white/15 dark:bg-slate-900/60">
            <Image
              src="/holy/2.png"
              alt="Biểu tượng hồ sơ Holyann"
              fill
              className="object-contain p-1"
              sizes="56px"
              priority
            />
          </div>
          <div className="min-w-0">
            <h1 className="pc-display text-xl text-slate-900 sm:text-2xl lg:text-[1.75rem] dark:text-foreground">
              Hồ sơ cá nhân
            </h1>
            <p className="pc-read-sans mt-0.5 text-sm text-slate-500 dark:text-muted-foreground">
              Quản lý thông tin và tài liệu du học
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {analyzeHref && (
            <Link
              href={analyzeHref}
              className="pc-chip-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0c3d68] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f4c81] focus-visible:ring-offset-2 active:scale-[0.98] dark:hover:opacity-90"
            >
              <BarChart3 size={16} aria-hidden />
              Phân tích hồ sơ
            </Link>
          )}
          <button
            type="button"
            onClick={onEditClick}
            className="pc-chip-ghost inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-[color-mix(in_srgb,#0f4c81_6%,transparent)] hover:text-[#0f4c81] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f4c81] focus-visible:ring-offset-2 active:scale-[0.98] sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm dark:text-foreground dark:hover:bg-slate-800/90 dark:hover:text-sky-300"
          >
            <Edit3 className="size-3.5 sm:size-4" aria-hidden />
            <span className="sm:hidden">Sửa</span>
            <span className="hidden sm:inline">Cập nhật hồ sơ</span>
          </button>
        </div>
      </div>
    </motion.header>
  );
};
