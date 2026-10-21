'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LayoutDashboard, PencilLine } from 'lucide-react';

type Props = {
  onOpenUpdate: () => void;
};

export default function MentorProfileHeader({ onOpenUpdate }: Props) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative mb-4 overflow-hidden rounded-2xl pc-hero-surface pc-sticker-shadow transition-colors duration-300 sm:mb-6 lg:mb-8"
      aria-label="Tiêu đề hồ sơ cố vấn"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='48' height='48' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='24' cy='24' r='2' fill='%23111827'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="relative flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 border-[#111827]/15 bg-white/80 pc-sticker-shadow dark:border-white/20 dark:bg-slate-900/50">
            <Image
              src="/holy/2.png"
              alt=""
              fill
              className="object-contain"
              sizes="64px"
              priority
            />
          </div>
          <div>
            <h1 className="pc-display text-2xl text-[#111827] dark:text-foreground sm:text-3xl lg:text-4xl">
              Hồ sơ chuyên môn
            </h1>
            <p className="pc-read-sans mt-1 text-xs font-medium text-[#111827]/75 dark:text-muted-foreground sm:text-sm">
              Xem tổng quan bên dưới — bấm <strong className="font-semibold">Cập nhật hồ sơ</strong> để
              mở modal chỉnh sửa (giống học viên).
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3">
          <Link
            href="/mentor/dashboard"
            className="pc-chip-primary inline-flex items-center gap-2 rounded-xl bg-[#3b82f6] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2563eb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6] focus-visible:ring-offset-2"
          >
            <LayoutDashboard size={16} aria-hidden />
            Bảng điều khiển
          </Link>
          <button
            type="button"
            onClick={onOpenUpdate}
            className="pc-chip-ghost inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#111827] transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-50/90 hover:text-blue-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6] focus-visible:ring-offset-2 dark:text-foreground dark:hover:bg-slate-800/90 dark:hover:text-blue-300 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
          >
            <PencilLine className="size-3.5 sm:size-4" aria-hidden />
            <span className="sm:hidden">Sửa hồ sơ</span>
            <span className="hidden sm:inline">Cập nhật hồ sơ</span>
          </button>
        </div>
      </div>
    </motion.header>
  );
}
