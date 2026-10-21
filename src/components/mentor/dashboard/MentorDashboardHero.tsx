"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface MentorDashboardHeroProps {
  userName: string;
}

export default function MentorDashboardHero({ userName }: MentorDashboardHeroProps) {
  return (
    <section
      aria-label="Chào mừng"
      className="relative mb-6 overflow-hidden text-white"
      style={{
        background:
          "linear-gradient(135deg, var(--primary) 0%, var(--brand-deep) 50%, var(--brand-cyan) 100%)",
      }}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-8 right-1/4 h-40 w-80 rounded-full bg-(--brand-cyan)/20 blur-2xl" />

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative px-6 py-8 sm:px-10 sm:py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 md:grid md:grid-cols-[1.15fr_0.85fr] md:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-sm sm:text-base font-sans font-medium tracking-tight text-white/90">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
              Chào {userName}! Hôm nay bạn muốn ưu tiên học viên nào?
            </p>

            <h1 className="mt-3 font-university-display text-2xl font-bold leading-tight text-white sm:text-3xl md:text-4xl lg:text-[2.6rem] lg:leading-[1.05]">
              <span className="block">Tổng quan</span>
              <span className="relative mt-1 inline-block">
                <span className="bg-linear-to-r from-[#FFD56A] via-white to-[#8BE9FF] bg-clip-text text-transparent">
                  công việc cố vấn
                </span>
              </span>
            </h1>

            <p className="mt-4 max-w-[800px] text-lg leading-relaxed text-white/75">
              Theo dõi học viên, deadline quan trọng và các buổi tư vấn sắp tới trong một màn hình.
              Sắp xếp ưu tiên rõ ràng để đồng hành cùng học viên đúng lúc, đúng việc và hiệu quả hơn mỗi ngày.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                asChild
                size="sm"
                className="group rounded-xl bg-linear-to-r from-white to-white/90 px-5 font-sans font-semibold text-primary shadow-md shadow-black/10 transition-all hover:-translate-y-0.5 hover:shadow-xl"
              >
                <Link href="/mentor/students" className="flex items-center gap-1 whitespace-nowrap">
                  Danh sách học viên
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </Link>
              </Button>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="whitespace-nowrap rounded-xl border border-white/40 bg-white/5 px-5 font-sans font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/15"
              >
                <Link href="/mentor/deadlines">Quản lý deadline</Link>
              </Button>
            </div>
          </div>

          <div className="mt-12 md:mt-0 flex flex-col items-center md:items-end relative md:justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="relative z-10 w-[280px] sm:w-[340px] rounded-2xl bg-white/95 backdrop-blur-sm p-4 shadow-xl mb-4 md:mr-2
                after:absolute after:-bottom-3 after:right-1/2 md:after:right-20 after:translate-x-1/2 md:after:translate-x-0
                after:border-l-12 after:border-r-12 after:border-t-14
                after:border-l-transparent after:border-r-transparent after:border-t-white/95 text-left"
            >
              <p className="text-sm font-medium leading-relaxed text-slate-800">
                <span className="font-bold text-primary mr-1">Mình là Holie Mate đây!</span>
                Mình sẽ giúp bạn nhìn rõ việc nào cần ưu tiên cho từng học viên, để việc cố vấn luôn đúng trọng tâm và nhẹ đầu hơn.
              </p>
            </motion.div>

            <motion.div
              className="relative h-40 w-40 sm:h-48 sm:w-48 md:h-56 md:w-56"
              animate={{ y: [-6, 4, -6] }}
              transition={{
                duration: 8,
                repeat: Infinity,
                repeatType: "mirror",
                ease: "easeInOut",
              }}
            >
              <Image
                src="/holy/16.png"
                alt="Holy đồng hành cùng cố vấn"
                fill
                priority
                className="object-contain drop-shadow-xl"
                sizes="(min-width: 1024px) 224px, 176px"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

