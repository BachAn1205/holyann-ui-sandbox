"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Award } from "lucide-react";

const STUDENT_BASE = "/student";

export default function PersonalizedRecommendationsSection() {
  const items = [
    {
      text: "Top 5 học bổng cho sinh viên nghệ thuật",
      href: `${STUDENT_BASE}/essay-improve`,
      icon: Award,
    },
    {
      text: "Ebook: Bí quyết săn học bổng toàn phần",
      href: `${STUDENT_BASE}/essay-improve`,
      icon: BookOpen,
    },
  ];

  return (
    <nav className="flex flex-col gap-3" aria-label="Gợi ý dành cho bạn">
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * idx, duration: 0.3 }}
          >
            <Link
              href={item.href}
              className="flex items-center gap-3 rounded-xl border border-violet-200/50 dark:border-violet-800/30 bg-violet-500/5 px-4 py-3 hover:bg-violet-500/10 hover:border-violet-400/40 transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-700 dark:text-violet-400 group-hover:scale-105 transition-transform" aria-hidden>
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium text-foreground flex-1">
                {item.text}
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" aria-hidden />
            </Link>
          </motion.div>
        );
      })}
    </nav>
  );
}
