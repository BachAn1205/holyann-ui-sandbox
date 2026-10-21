"use client";

import React, { type ReactNode } from "react";
import { motion } from "framer-motion";

interface StudentHeroShellProps {
  ariaLabel: string;
  left: ReactNode;
  right?: ReactNode;
  className?: string;
}

export function StudentHeroShell({
  ariaLabel,
  left,
  right,
  className = "",
}: StudentHeroShellProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`relative mb-8 overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-lg ${className}`}
      aria-label={ariaLabel}
    >
      <div className="absolute inset-0 bg-linear-to-br from-amber-500/20 via-primary/10 to-orange-500/10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,var(--tw-gradient-from),transparent)] from-primary/25 to-transparent" />
      <div className="absolute -left-24 -bottom-24 h-48 w-48 rounded-full bg-primary/25 blur-3xl" />
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-amber-400/25 blur-3xl" />

      <div className="relative flex flex-col gap-8 px-4 py-8 sm:px-8 sm:py-12 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 min-w-0 space-y-4">{left}</div>

        {right && (
          <div className="w-full max-w-md shrink-0 md:w-[260px] lg:w-[320px] mt-6 md:mt-0 mx-auto md:mx-0">
            {right}
          </div>
        )}
      </div>
    </motion.header>
  );
}

