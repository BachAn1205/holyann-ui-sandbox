"use client";

import { motion } from "framer-motion";
import { GraduationCap, Globe } from "lucide-react";

const statItem = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

export default function AchievementSection() {
  return (
    <ul className="grid grid-cols-2 gap-4 list-none p-0 m-0" aria-label="Thống kê thành tựu">
      <motion.li
        variants={statItem}
        initial="hidden"
        animate="show"
        transition={{ delay: 0.1, duration: 0.35 }}
        className="rounded-xl border border-amber-200/50 dark:border-amber-800/30 bg-amber-500/10 p-5 text-center hover:shadow-sm transition-shadow"
      >
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 mb-3" aria-hidden>
          <GraduationCap className="h-6 w-6" />
        </span>
        <p className="text-2xl font-bold text-foreground m-0 tabular-nums">2,500+</p>
        <p className="text-sm text-muted-foreground mt-1 m-0">học viên trúng tuyển</p>
      </motion.li>
      <motion.li
        variants={statItem}
        initial="hidden"
        animate="show"
        transition={{ delay: 0.2, duration: 0.35 }}
        className="rounded-xl border border-amber-200/50 dark:border-amber-800/30 bg-amber-500/10 p-5 text-center hover:shadow-sm transition-shadow"
      >
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 mb-3" aria-hidden>
          <Globe className="h-6 w-6" />
        </span>
        <p className="text-2xl font-bold text-foreground m-0 tabular-nums">15+</p>
        <p className="text-sm text-muted-foreground mt-1 m-0">Quốc gia hỗ trợ</p>
      </motion.li>
    </ul>
  );
}
