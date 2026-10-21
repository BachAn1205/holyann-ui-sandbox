"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { BRAND_COLORS } from "../../lib/data";

const SPLASH_DURATION_MS = 3500;

export default function WelcomeSplash({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash ? (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{
              opacity: 0,
              scale: 1.8,
              transition: { duration: 0.6, ease: "easeIn" },
            }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-background overflow-hidden"
            aria-live="polite"
            aria-label="Chào mừng"
          >
            <div
              className="hero-grid-bg absolute inset-0 opacity-60"
              aria-hidden
            />
            {/* Holi bay từ dưới lên, từ xa về gần */}
            <motion.div
              initial={{ y: "80vh", scale: 0.2, opacity: 0.6 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              transition={{
                duration: 2.2,
                ease: [0.22, 0.61, 0.36, 1],
              }}
              className="relative z-10 w-[140px] h-[140px] sm:w-[180px] sm:h-[180px] shrink-0 mb-6"
            >
              <Image
                src="/images/holy/pencil.png"
                alt="Holi"
                width={180}
                height={180}
                className="object-contain w-full h-full"
                priority
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.2, ease: "easeOut" }}
              className="relative z-10 text-center px-6"
            >
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4, duration: 0.4 }}
                className={`text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight ${BRAND_COLORS.textGradient} text-foreground mb-2`}
              >
                Holyann Explore
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.6, duration: 0.4 }}
                className="text-xl sm:text-2xl md:text-3xl font-semibold text-foreground"
              >
                xin chào !!
              </motion.p>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full min-h-screen flex flex-col"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
