"use client";

import { motion } from "framer-motion";
import { Clock } from "lucide-react";

export default function LatestNewsSection() {
  const newsItems = [
    "Hạn chót học bổng Mỹ - Fall 2024",
    "Sự kiện Triển lãm Du học Anh Quốc",
    "Kinh nghiệm phỏng vấn Visa J-1",
  ];

  return (
    <ul className="flex flex-col gap-3 list-none p-0 m-0" aria-label="Tin tức và sự kiện">
      {newsItems.map((item, index) => (
        <motion.li
          key={index}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 * index, duration: 0.3 }}
          className="flex items-center gap-3 rounded-xl border border-emerald-200/50 dark:border-emerald-800/30 bg-emerald-500/5 px-4 py-3 hover:bg-emerald-500/10 transition-colors"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" aria-hidden>
            <Clock className="h-4 w-4" />
          </span>
          <span className="text-sm font-medium text-foreground flex-1">{item}</span>
        </motion.li>
      ))}
    </ul>
  );
}
