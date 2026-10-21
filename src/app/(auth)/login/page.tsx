"use client";

import Login from "@/components/auth/Login";
import { motion } from "framer-motion";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex flex-col md:flex-row bg-background text-foreground overflow-x-hidden overflow-y-auto transition-colors duration-300 dark:auth-page-grid">
      {/* Left: Marketing section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex md:w-[50%] lg:w-[52%] min-h-[40vh] md:min-h-screen relative flex-col justify-center px-6 sm:px-8 lg:px-14 xl:px-20 py-10 md:py-12 shrink-0 overflow-hidden"
      >
        {/* Light mode: full-cover illustration from Login Page.webp */}
        <div
          className="absolute inset-0 dark:hidden bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/backgrounds/Login Page.webp')" }}
          aria-hidden
        />

        {/* Dark mode: full-cover illustration */}
        <div
          className="absolute inset-0 hidden dark:block bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('/images/backgrounds/(dark mode) Login Page.webp')",
          }}
          aria-hidden
        />
      </motion.div>

      {/* Divider between left and right (hidden in dark mode) */}
      <div className="hidden md:block dark:hidden w-px min-h-screen bg-border/50 shrink-0" aria-hidden />

      {/* Right: Auth section: centered, constrained width */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
        className="w-full md:w-[50%] lg:w-[48%] min-h-[60vh] md:min-h-screen flex flex-col justify-center items-center p-6 sm:p-8 lg:p-12 xl:p-16 bg-background relative"
      >
        <div className="w-full max-w-[400px]">
          <Login />
        </div>
      </motion.div>
    </div>
  );
}
