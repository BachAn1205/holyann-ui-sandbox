// src/app/page.tsx
import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/landing/HeroSection";
import AboutSection from "@/components/landing/AboutSection";
import HighlightsSection from "@/components/landing/HighlightsSection";
import AchievementsSection from "@/components/landing/AchievementsSection";
import ServicesSection from "@/components/landing/ServicesSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import ScrollProgress from "@/components/landing/ScrollProgress";
import WelcomeSplash from "@/components/landing/WelcomeSplash";

export default function Home() {
  return (
    <div className="landing-light">
      <WelcomeSplash>
        <main className="font-sans text-slate-600 bg-white selection:bg-sky-200 selection:text-slate-900 min-h-screen flex flex-col scroll-smooth">
          <ScrollProgress />
          <Header />

          <div className="flex-grow">
            <HeroSection />
            <AboutSection />
            <HighlightsSection />
            <AchievementsSection />
            <TestimonialsSection />
            <ServicesSection />
          </div>

          <Footer />
        </main>
      </WelcomeSplash>
    </div>
  );
}