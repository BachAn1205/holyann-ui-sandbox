"use client";
import React from "react";
import { motion } from "framer-motion";
import { BRAND_COLORS } from "../../lib/data";

export default function SectionHeading({
  children,
  subtitle,
  dark = false,
  light = false,
}: {
  children: React.ReactNode;
  subtitle?: string;
  dark?: boolean;
  light?: boolean;
}) {
  const textColor = light ? "text-white" : dark ? "text-slate-900" : "text-blue-600";
  const subtitleColor = light ? "text-blue-100" : BRAND_COLORS.textGradient;
  const gradient = light 
    ? "from-white to-white/90" 
    : "from-blue-600 via-blue-500 to-cyan-500";

  return (
    <div className="text-center mb-12">
      {subtitle && (
        <motion.span
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className={`uppercase tracking-wider font-bold text-sm mb-2 pb-1 block ${subtitleColor}`}
        >
          {subtitle}
        </motion.span>
      )}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className={`text-3xl md:text-4xl lg:text-5xl font-extrabold ${textColor} mb-2 pb-2 leading-tight bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}
      >
        {children}
      </motion.h2>
    </div>
  );
}
