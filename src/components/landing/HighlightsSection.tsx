"use client";
import React from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import FadeInView from "@/components/ui/FadeInView";
import SectionHeading from "@/components/ui/SectionHeading";

import { HIGHLIGHTS } from "../../lib/data";

function HighlightCard({ item, variant }: { item: {title: string, bullets: string[]}, variant: 'yellow' | 'blue' }) {
    const isYellow = variant === 'yellow';
    
    return (
        <motion.div
            whileHover={{ y: -5 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`p-6 md:p-8 rounded-[2rem] shadow-sm flex flex-col ${
                isYellow 
                ? "bg-[#f8faff] border-2 border-blue-400/80"
                : "bg-[#64a1e8] shadow-blue-500/20"
            }`}
        >
            <h3 className={`text-xl md:text-2xl font-black mb-6 text-center leading-[1.3] whitespace-pre-line ${
                isYellow ? "text-blue-600" : "text-white"
            }`}>
               {item.title}
            </h3>
            <ul className="space-y-4">
                {item.bullets.map((bullet, idx) => (
                    <li key={idx} className="flex gap-3 items-start">
                        <div className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${isYellow ? "bg-blue-500" : "bg-white"}`} />
                        <span className={`text-sm md:text-[15px] font-medium leading-relaxed ${isYellow ? "text-blue-800" : "text-white"}`}>
                            {bullet}
                        </span>
                    </li>
                ))}
            </ul>
        </motion.div>
    );
}

export default function HighlightsSection() {
  return (
    <section id="diem-noi-bat" className="py-20 scroll-mt-24 bg-white bg-[linear-gradient(to_right,rgba(148,163,184,0.14)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.10)_1px,transparent_1px)] bg-[size:32px_32px]">
      <div className="container mx-auto px-4 max-w-5xl">
        <SectionHeading subtitle="Tại Sao Chọn Chúng Tôi">
          Điểm Nổi Bật
        </SectionHeading>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12 mt-12 md:mt-16 relative">
          
          {/* Cột trái */}
          <div className="space-y-8 flex flex-col">
            <FadeInView delay={0.1}>
                <HighlightCard item={HIGHLIGHTS[0]} variant="yellow" />
            </FadeInView>
            
            <FadeInView delay={0.3}>
                <HighlightCard item={HIGHLIGHTS[1]} variant="blue" />
            </FadeInView>
            
            {/* Decorative Stars Bottom Left */}
            <FadeInView delay={0.5}>
                <div className="pt-2 pb-6 flex justify-center gap-4 text-[#fcd34d]">
                    <Star className="w-9 h-9 md:w-11 md:h-11 fill-current rotate-[-12deg]" />
                    <Star className="w-10 h-10 md:w-12 md:h-12 fill-current rotate-[4deg] translate-y-2" />
                    <Star className="w-9 h-9 md:w-11 md:h-11 fill-current rotate-[14deg]" />
                </div>
            </FadeInView>
          </div>

          {/* Cột phải */}
          <div className="space-y-8 flex flex-col md:mt-16">
            {/* Decorative Stars Top Right */}
            <FadeInView delay={0.2}>
                <div className="pb-2 pt-6 md:pt-0 flex justify-center gap-4 text-[#fcd34d]">
                    <Star className="w-9 h-9 md:w-11 md:h-11 fill-current rotate-[-8deg]" />
                    <Star className="w-10 h-10 md:w-12 md:h-12 fill-current rotate-[6deg] -translate-y-2" />
                    <Star className="w-9 h-9 md:w-11 md:h-11 fill-current rotate-[18deg]" />
                </div>
            </FadeInView>

            <FadeInView delay={0.4}>
                <HighlightCard item={HIGHLIGHTS[2]} variant="blue" />
            </FadeInView>
            
            <FadeInView delay={0.6}>
                <HighlightCard item={HIGHLIGHTS[3]} variant="yellow" />
            </FadeInView>
          </div>
          
        </div>
      </div>
    </section>
  );
}
