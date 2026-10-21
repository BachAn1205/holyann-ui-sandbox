"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BRAND_COLORS } from "../../lib/data";

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function HeroSection() {
  return (
    <section className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center overflow-hidden bg-white selection:bg-sky-200 selection:text-slate-900">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(148, 163, 184, 0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.10) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <motion.div
            variants={container}
            initial="hidden"
            animate="visible"
            className="text-center lg:text-left"
          >
            <motion.p
              variants={item}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-500 shadow-sm"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
              Holyann Explore
            </motion.p>

            <motion.h1
              variants={item}
              className="mb-6 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-[1.05]"
            >
              <span className="block">Vẽ đường tương lai.</span>
              <span className={`block pb-2 ${BRAND_COLORS.textGradient}`}>
                Định hình ngày mai.
              </span>
            </motion.h1>

            <motion.p
              variants={item}
              className="mb-10 max-w-xl mx-auto lg:mx-0 text-lg sm:text-xl text-slate-600 leading-relaxed"
            >
              Đừng bước ra thế giới một mình khi bạn có thể có những người bạn
              đồng hành luôn nỗ lực hết sức vì bạn. Với tư duy tiên phong và
              những phương pháp sáng tạo mới mẻ, nền tảng của chúng tôi kết hợp
              {` `}
              <span className="font-semibold text-amber-600">
                sự thông minh của công nghệ
              </span>
              {` `}
              cùng{` `}
              <span className="font-semibold text-amber-600">
                tâm huyết của người đi trước
              </span>
              . Chúng tôi sát sao dìu dắt, lấy nỗ lực của chính mình làm bệ
              phóng vững chắc cho mọi bứt phá của bạn.
            </motion.p>

            <motion.div
              variants={item}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Button
                asChild
                size="lg"
                className="group h-12 rounded-full px-8 text-base font-semibold bg-gradient-to-r from-sky-600 to-cyan-500 text-white shadow-md shadow-sky-500/20 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-sky-500/30"
              >
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2"
                >
                  Khám phá ngay
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="h-12 rounded-full px-8 text-base font-semibold border-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-all duration-200"
              >
                <Link
                  href="#gioi-thieu"
                  className="inline-flex items-center justify-center gap-2"
                >
                  Tìm hiểu thêm
                </Link>
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="relative flex justify-center lg:justify-end"
          >
            <motion.div
              className="relative w-[500px] h-[500px] sm:w-[500px] sm:h-[500px] md:w-[500px] md:h-[500px] lg:w-[500px] lg:h-[500px]"
              animate={{
                x: [-20, -8, 0, 12, 24, 12, 0, -8, -20],
                y: [0, -10, -18, -24, -18, -10, 0, -6, -12],
                rotate: [-10, -6, -3, 0, 3, 0, -3, -6, -10],
              }}
              transition={{
                duration: 14,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Image
                src="/images/holy/pencil.png"
                alt="Holy đang bay cùng bạn"
                fill
                className="object-contain drop-shadow-xl"
                sizes="(max-width: 1024px) 260px, 340px"
                priority
              />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
