"use client";
import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import { NAV_LINKS, BRAND_COLORS } from "../../lib/data";
import Image from "next/image";
import { LeadGenerationModal } from "@/components/landing/LeadGenerationModal";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white backdrop-blur-md shadow-sm border-b border-slate-100">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 h-16 sm:h-18 md:h-20 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex-shrink-0">
          <Image
            src="/images/logos/logo%20vien%20(1).png"
            alt="Holyann Logo"
            width={240}
            height={80}
            className="cursor-pointer w-auto h-10 sm:h-12 md:h-14 object-contain"
            priority
          />
        </div>

        {/* Desktop Menu */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-slate-700 hover:text-[var(--brand-blue)] transition-colors uppercase text-xs xl:text-sm tracking-wide font-bold whitespace-nowrap"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* CTA & Mobile Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="/dashboard"
            className="hidden lg:flex items-center justify-center h-10 px-4 xl:px-5 rounded-full border-2 border-slate-300 text-slate-700 font-semibold text-xs xl:text-sm hover:bg-slate-50 hover:border-sky-400 hover:text-sky-700 transition-all whitespace-nowrap"
          >
            Khám phá ngay
          </a>
          <div className="hidden lg:block">
            <LeadGenerationModal
              triggerText="Nhận ngay định hướng cho riêng bạn"
              triggerClassName={`h-10 px-4 xl:px-6 py-2 xl:py-2.5 rounded-full text-white font-semibold text-xs xl:text-sm shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 whitespace-nowrap ${BRAND_COLORS.primaryGradient}`}
            />
          </div>
          <button
            className="lg:hidden w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700" />
            ) : (
              <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-slate-100 absolute w-full left-0 right-0 shadow-xl max-h-[calc(100vh-4rem)] overflow-y-auto">
          <nav className="px-4 sm:px-6 py-4 flex flex-col gap-2">
            {NAV_LINKS.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="block text-slate-700 font-bold py-3 px-4 rounded-lg hover:bg-slate-50 transition-colors text-base sm:text-lg uppercase"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </a>
            ))}
            <a
              href="/dashboard"
              className="mt-2 px-4 py-3 rounded-lg border-2 border-slate-300 text-slate-700 font-semibold text-sm text-center hover:bg-slate-50 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Khám phá ngay
            </a>
            <div onClick={() => setMobileMenuOpen(false)}>
              <LeadGenerationModal
                triggerText="Nhận ngay định hướng cho riêng bạn"
                triggerClassName={`w-full px-4 py-3 rounded-lg text-white font-semibold text-sm shadow-lg text-center ${BRAND_COLORS.primaryGradient}`}
              />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
