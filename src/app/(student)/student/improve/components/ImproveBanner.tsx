'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

export function ImproveBanner() {
  return (
    <motion.header
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative rounded-2xl overflow-hidden mb-8 border border-primary/20 shadow-lg"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-primary/10 to-orange-500/10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,var(--tw-gradient-from),transparent)] from-primary/25 to-transparent" />
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 4L4 20v20l26 16 26-16V20L30 4z' fill='none' stroke='%230f4c81' stroke-width='1'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6 px-6 py-8 sm:px-8 sm:py-10">
        <div className="flex-1 min-w-0">
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="text-sm font-medium text-primary uppercase tracking-wider"
          >
            Cải thiện hồ sơ
          </motion.p>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mt-1">Improve</h1>
          <p className="text-muted-foreground mt-2 text-base sm:text-lg max-w-xl leading-relaxed">
            Nâng cao CV và bài luận với AI. Phân tích và nhận đề xuất cải thiện từ dữ liệu profile của bạn.
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="relative w-full md:w-56 h-36 md:h-40 rounded-xl overflow-hidden border border-white/20 shadow-xl shrink-0"
        >
          <Image
            src="/images/auth/left.jpg"
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 14rem"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-amber-600/50 to-transparent" />
        </motion.div>
      </div>
    </motion.header>
  );
}
