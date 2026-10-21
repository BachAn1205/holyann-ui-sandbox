"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { QuickStatItem } from "./types";

import { useGreeting } from "@/hooks/useGreeting";

interface DashboardHeroProps {
  userName: string;
  stats: QuickStatItem[];
}

export function DashboardHero({ userName, stats }: DashboardHeroProps) {
  const greeting = useGreeting(userName);

  const topStats = (stats ?? []).slice(0, 3);

  return (
    <section
      aria-label="Chào mừng"
      className="relative mb-6 overflow-hidden text-white"
      style={{
        background:
          "linear-gradient(135deg, var(--primary) 0%, var(--brand-deep) 50%, var(--brand-cyan) 100%)",
      }}
    >
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-8 right-1/4 h-40 w-80 rounded-full bg-[var(--brand-cyan)]/20 blur-2xl" />

      {/* Subtle grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative px-5 py-3 sm:px-8 sm:py-4">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 md:grid md:grid-cols-[1.15fr_0.85fr] md:items-center">
          {/* Left: Greeting & CTAs */}
          <div>
            {/* Greeting label */}
            <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-xs sm:text-sm font-sans font-medium tracking-tight text-white/90">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
              {greeting || "Đang tải lời chào..."}
            </p>

            {/* Main heading */}
            <h1 className="mt-1.5 font-university-display text-xl font-bold leading-tight text-white sm:text-2xl md:text-3xl lg:text-[2rem] lg:leading-[1.1]">
              <span className="block">Tổng quan</span>
              <span className="relative mt-0.5 inline-block">
                <span className="bg-gradient-to-r from-[#FFD56A] via-white to-[#8BE9FF] bg-clip-text text-transparent">
                  hành trình du học
                </span>
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-1.5 max-w-[600px] text-sm sm:text-base leading-relaxed text-white/75">
              Gói gọn trong này là tiến độ hiện tại, những công việc cần xử lý và cả mục tiêu dài hơi của bạn.
              Để mỗi ngày ngồi vào bàn, bạn biết mình đang nhích gần hơn một chút tới chân trời mới.
              Cùng Holie Mate bắt đầu từ những nhịp bước thật êm và bền bỉ từ hôm nay nhé!
            </p>


          </div>

          {/* Right: Holy illustration with gentle float animation and speech bubble */}
          <div className="mt-4 md:mt-0 flex flex-col items-center md:items-end relative md:justify-center">
            {/* Speech Bubble */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="relative z-10 w-[260px] sm:w-[300px] rounded-2xl bg-white/95 backdrop-blur-sm p-3 shadow-xl mb-2 md:mr-2
                after:absolute after:-bottom-3 after:right-1/2 md:after:right-16 after:translate-x-1/2 md:after:translate-x-0
                after:border-l-[10px] after:border-r-[10px] after:border-t-[12px] 
                after:border-l-transparent after:border-r-transparent after:border-t-white/95 text-left"
            >
              <p className="text-[13px] font-medium leading-relaxed text-slate-800">
                <span className="font-bold text-primary mr-1">Mình là Holie Mate đây!</span> 
                Hãy xem mình như một người bạn luôn sẵn sàng gỡ rối cùng bạn bất kể sớm hôm nhé. Mình mong có thể ghé vai gánh bớt những lo âu để hành trình nộp hồ sơ sắp tới của bạn chỉ còn lại sự hào hứng và tự tin.
              </p>
            </motion.div>

            <motion.div
              className="relative h-32 w-32 sm:h-40 sm:w-40 md:h-44 md:w-44"
              animate={{ y: [-4, 3, -4] }}
              transition={{
                duration: 8,
                repeat: Infinity,
                repeatType: "mirror",
                ease: "easeInOut",
              }}
            >
              <Image
                src="/holy/16.png"
                alt="Holy đồng hành cùng hành trình du học của bạn"
                fill
                priority
                className="object-contain drop-shadow-xl"
                sizes="(min-width: 1024px) 176px, 128px"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
