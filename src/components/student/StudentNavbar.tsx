"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuthSession } from "@/hooks/useAuthSession";
import { signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  User,
  Settings,
  LogOut,
  Sparkles,
  ClipboardList,
  Crown,
  Lock,
  Target,
  FileUp,
  Building2,
  Headset,
  Users,
} from "lucide-react";
import {
  aiToolGroups,
  mentorFeatures,
  AI_TOOLS_LABEL,
  MENTOR_HUB_LABEL,
} from "@/data/student-nav-features";
import { useSubscription } from "@/hooks/useSubscription";

const STUDENT_BASE = "/student";

const navItems = [
  {
    name: "Tổng quan",
    href: `${STUDENT_BASE}/dashboard`,
    icon: LayoutDashboard,
  },
  { name: "Hồ sơ", href: `${STUDENT_BASE}/profile`, icon: User },
  {
    name: "Trắc nghiệm ngành",
    href: `${STUDENT_BASE}/tests`,
    icon: ClipboardList,
  },
  {
    name: "Danh sách trường",
    href: `${STUDENT_BASE}/universities`,
    icon: Building2,
  },
  {
    name: "Mục tiêu",
    href: `${STUDENT_BASE}/target`,
    icon: Target,
  },
];

function isActive(pathname: string, href: string) {
  if (href === `${STUDENT_BASE}/dashboard`) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

export default function StudentNavbar() {
  const { user, isAuthenticated } = useAuthSession();
  const { isPaid } = useSubscription();
  const logout = () => signOut({ callbackUrl: "/login" });
  const pathname = usePathname();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [mobileFeaturesOpen, setMobileFeaturesOpen] = useState(false);
  const [mobilePremiumOpen, setMobilePremiumOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const featuresTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const premiumTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFeatures = () => {
    if (featuresTimerRef.current) clearTimeout(featuresTimerRef.current);
    if (premiumTimerRef.current) clearTimeout(premiumTimerRef.current);
    setPremiumOpen(false);
    setFeaturesOpen(true);
  };
  const hideFeatures = () => {
    featuresTimerRef.current = setTimeout(() => setFeaturesOpen(false), 220);
  };
  const clearFeaturesTimer = () => {
    if (featuresTimerRef.current) clearTimeout(featuresTimerRef.current);
  };

  const showPremium = () => {
    if (premiumTimerRef.current) clearTimeout(premiumTimerRef.current);
    if (featuresTimerRef.current) clearTimeout(featuresTimerRef.current);
    setFeaturesOpen(false);
    setPremiumOpen(true);
  };
  const hidePremium = () => {
    premiumTimerRef.current = setTimeout(() => setPremiumOpen(false), 220);
  };
  const clearPremiumTimer = () => {
    if (premiumTimerRef.current) clearTimeout(premiumTimerRef.current);
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className="font-university-sans sticky top-0 z-50 w-full px-4 sm:px-6 md:px-8
        bg-gradient-to-r from-[var(--primary)] via-[var(--brand-deep)] to-[var(--brand-cyan)]
        dark:from-[var(--secondary)] dark:via-[var(--brand-deep-darker)] dark:to-[var(--primary)]
        border-b-2 border-white/20 dark:border-primary/30
        shadow-[0_2px_8px_-2px_rgba(0,0,0,0.12)]
        dark:shadow-[0_2px_10px_-2px_rgba(0,0,0,0.35)]"
    >
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none dark:via-primary/40" />

      <div className="container flex h-16 max-w-screen-2xl items-center justify-between gap-4">
        {/* ── Logo ── */}
        <div className="flex items-center gap-3">
          <Link
            href={`${STUDENT_BASE}/dashboard`}
            className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-primary rounded-lg transition-all duration-200 active:scale-[0.97]"
          >
            <div className="relative h-[64px] w-[180px] shrink-0 transition-transform duration-300">
              <Image
                src="/images/logos/logo%20vien%20(1).png"
                alt="Holyann Explore logo"
                fill
                className="object-contain mix-blend-lighten"
                sizes="(max-width: 768px) 180px, 180px"
                priority
              />
            </div>
          </Link>
        </div>

        {/* ── Desktop nav ── */}
        <nav className="hidden xl:flex items-center gap-0.5 xl:gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`relative flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium tracking-wide transition-all duration-200
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40
                  hover:scale-[1.02] active:scale-[0.98]
                  ${
                    active
                      ? "bg-white/20 text-white ring-1 ring-white/25 shadow-sm"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${active ? "text-white" : "opacity-70"}`}
                />
                {item.name}
                {active && (
                  <span className="absolute inset-x-3 -bottom-0.5 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent rounded-full" />
                )}
              </Link>
            );
          })}

          {isAuthenticated && (
            <>
              {/* ── Công cụ AI (2 cột) ── */}
              <div
                className="relative flex items-center"
                onMouseEnter={showFeatures}
                onMouseLeave={hideFeatures}
              >
                <button
                  type="button"
                  onClick={() => setFeaturesOpen((o) => !o)}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium tracking-wide transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 hover:scale-[1.02] active:scale-[0.98] ${
                    featuresOpen
                      ? "bg-white/20 text-white ring-1 ring-white/25 shadow-sm"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                  aria-expanded={featuresOpen}
                >
                  <Sparkles className={`h-4 w-4 shrink-0 ${featuresOpen ? "text-white" : "opacity-70"}`} />
                  <span className="hidden xl:block">{AI_TOOLS_LABEL}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform duration-200 ${featuresOpen ? "rotate-180" : "opacity-70"}`}
                  />
                </button>

                {featuresOpen && (
                  <div
                    className="absolute left-0 top-full z-50 mt-2 w-[min(36rem,calc(100vw-2rem))] origin-top-left animate-in fade-in-0 zoom-in-95 duration-200 rounded-xl border border-[#0077b6]/20 bg-white p-3 shadow-2xl dark:border-[#00b4e6]/15 dark:bg-[#060d1a]/98 text-foreground"
                    onMouseEnter={clearFeaturesTimer}
                    onMouseLeave={hideFeatures}
                  >
                    <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-widest text-[#0077b6] dark:text-[#38bdf8]/60">
                      {AI_TOOLS_LABEL}
                    </p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {aiToolGroups.map((group) => (
                        <div key={group.id} className="min-w-0">
                          <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {group.label}
                          </p>
                          {group.items.map((item) => {
                            const Icon = item.icon;
                            return (
                              <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setFeaturesOpen(false)}
                                className="flex gap-2.5 rounded-lg px-2 py-2 text-sm text-foreground transition-colors hover:bg-[#0077b6]/5 dark:text-white/90 dark:hover:bg-[#00b4e6]/8 group/item"
                              >
                                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#0077b6]/60 transition-colors group-hover/item:text-[#0077b6] dark:text-[#38bdf8]/50 dark:group-hover/item:text-[#38bdf8]" />
                                <div className="min-w-0 flex-1">
                                  <span className="block font-semibold">{item.name}</span>
                                  <span className="mt-0.5 block text-xs text-muted-foreground dark:text-white/40">
                                    {item.description}
                                  </span>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Với Cố vấn ── */}
              <div
                className="relative flex items-center"
                onMouseEnter={showPremium}
                onMouseLeave={hidePremium}
              >
                <button
                  type="button"
                  onClick={() => setPremiumOpen((o) => !o)}
                  className="flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-2 text-sm font-bold text-accent transition-all duration-200 hover:bg-accent/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 active:scale-[0.98]"
                  aria-expanded={premiumOpen}
                >
                  <Users className="h-4 w-4 shrink-0" />
                  <span className="hidden xl:block">{MENTOR_HUB_LABEL}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform duration-200 ${premiumOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {premiumOpen && (
                  <div
                    className="absolute left-0 top-full z-50 mt-2 w-80 origin-top-left animate-in fade-in-0 zoom-in-95 duration-200 rounded-xl border border-accent/30 bg-card p-2 shadow-xl text-foreground"
                    onMouseEnter={clearPremiumTimer}
                    onMouseLeave={hidePremium}
                  >
                    <p className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-accent">
                      <Users className="h-3 w-3" />
                      {MENTOR_HUB_LABEL}
                    </p>
                    {!isPaid && (
                      <Link
                        href={`${STUDENT_BASE}/pricing`}
                        onClick={() => setPremiumOpen(false)}
                        className="mb-1 flex items-center justify-between gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-500/15 dark:text-amber-200"
                      >
                        <span>Nâng cấp Premium để mở khóa</span>
                        <Crown className="h-3.5 w-3.5 shrink-0" />
                      </Link>
                    )}
                    {mentorFeatures.map((item) => {
                      const Icon = item.icon;
                      const isLocked = !isPaid;
                      if (isLocked) {
                        return (
                          <Link
                            key={item.name}
                            href={`${STUDENT_BASE}/pricing`}
                            onClick={() => setPremiumOpen(false)}
                            className="flex gap-3 rounded-lg border border-transparent px-2 py-2 text-sm text-muted-foreground opacity-80 transition-colors hover:border-amber-500/20 hover:bg-amber-500/10 hover:opacity-100"
                          >
                            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-amber-500/60" />
                            <div className="min-w-0 flex-1">
                              <span className="block font-semibold text-foreground/80">
                                {item.name}
                              </span>
                              <span className="mt-0.5 block text-xs text-muted-foreground">
                                {item.description}
                              </span>
                            </div>
                            <Lock className="mt-1 h-3 w-3 shrink-0 text-amber-500/70" />
                          </Link>
                        );
                      }
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setPremiumOpen(false)}
                          className="flex gap-3 rounded-lg px-2 py-2 text-sm text-foreground transition-colors hover:bg-accent/5"
                        >
                          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-accent/80" />
                          <div className="min-w-0 flex-1">
                            <span className="block font-semibold">{item.name}</span>
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                              {item.description}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </nav>

        {/* ── Right: user menu (ẩn trên mobile; dùng menu hamburger thay combobox) ── */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <div className="relative hidden xl:block" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-2 py-1.5 pr-2 md:px-3 md:py-2 hover:bg-white/15 hover:border-white/30 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 active:scale-[0.98]"
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
              >
                <span className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full bg-white/90 text-primary text-sm font-bold ring-1 ring-white/50 shadow-md">
                  {(user?.name?.charAt(0) ?? user?.email?.charAt(0) ?? "U").toUpperCase()}
                </span>
                <span className="hidden max-w-[150px] truncate text-sm font-medium text-white xl:block">
                  {user?.name} - Học viên
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-white/80 transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {userMenuOpen && (
                <div
                  className="absolute right-0 top-full z-50 mt-2 flex items-start gap-0 origin-top-right animate-in fade-in-0 zoom-in-95 duration-200"
                  onMouseLeave={() => {
                    hideFeatures();
                    hidePremium();
                  }}
                >


                  {/* ── User dropdown ── */}
                  <div className="w-52 shrink-0 rounded-xl border border-border bg-card p-1 shadow-xl text-foreground">
                    <div className="px-2 py-2 border-b border-border mb-1">
                      <p className="text-[10px] text-muted-foreground tracking-widest font-semibold">
                        Xin chào
                      </p>
                      <p className="truncate text-sm font-bold text-foreground">
                        {user?.name} - Học viên
                      </p>
                    </div>



                    <Link
                      href={`${STUDENT_BASE}/pricing`}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-foreground hover:bg-muted transition-colors text-amber-600 dark:text-amber-500 font-medium"
                    >
                      <Crown className="h-4 w-4" />
                      Đăng ký gói
                    </Link>

                    <Link
                      href={`${STUDENT_BASE}/terms-of-service`}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <FileUp className="h-4 w-4 text-muted-foreground" />
                      Nội quy & điều khoản
                    </Link>
                    
                    <Link
                      href={`${STUDENT_BASE}/support`}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <Headset className="h-4 w-4 text-muted-foreground" />
                      Hỗ trợ
                    </Link>

                    <Link
                      href={`${STUDENT_BASE}/settings`}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      Cài đặt
                    </Link>

                    <div className="mt-1 pt-1 border-t border-border">
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="hidden rounded-full px-4 py-2 text-sm font-medium text-white/85 hover:bg-white/15 hover:text-white transition-all duration-200 xl:block focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="rounded-full px-4 py-2 text-sm font-bold bg-white text-primary shadow-md hover:bg-white/95 hover:shadow-lg transition-all duration-200 active:scale-[0.97]"
              >
                Đăng ký
              </Link>
            </div>
          )}

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="xl:hidden flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/10 hover:bg-white/20 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 active:scale-[0.97]"
            aria-label="Menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 text-white" />
            ) : (
              <Menu className="h-5 w-5 text-white/90" />
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-white/10 bg-primary/95 dark:bg-background/98 backdrop-blur-sm">
          <nav className="container flex flex-col gap-1 px-4 py-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 rounded-full px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    active
                      ? "bg-white/20 text-white ring-1 ring-white/20"
                      : "text-white/85 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${active ? "opacity-100" : "opacity-70"}`}
                  />
                  {item.name}
                </Link>
              );
            })}

            {isAuthenticated && (
              <div className="mt-2 border-t border-white/10 pt-2 space-y-0.5">
                <button
                  type="button"
                  onClick={() => setMobileFeaturesOpen((o) => !o)}
                  className="flex w-full items-center justify-between gap-2 rounded-full px-4 py-3 text-left text-sm text-white/85 transition-all duration-200 hover:bg-white/10 hover:text-white"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 opacity-70" />
                    {AI_TOOLS_LABEL}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 opacity-70 transition-transform duration-200 ${mobileFeaturesOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {mobileFeaturesOpen && (
                  <div className="ml-4 space-y-2 border-l-2 border-white/15 pl-3">
                    {aiToolGroups.map((group) => (
                      <div key={group.id} className="space-y-0.5">
                        <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/50">
                          {group.label}
                        </p>
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.name}
                              href={item.href}
                              onClick={() => {
                                setMobileMenuOpen(false);
                                setMobileFeaturesOpen(false);
                              }}
                              className="flex gap-3 rounded-lg px-3 py-2.5 text-sm text-white/85 transition-colors hover:bg-white/10"
                            >
                              <Icon className="mt-0.5 h-4 w-4 shrink-0 opacity-70" />
                              <span className="font-semibold">{item.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setMobilePremiumOpen((o) => !o)}
                  className="flex w-full items-center justify-between gap-2 rounded-full px-4 py-3 text-left text-sm text-white/85 transition-all duration-200 hover:bg-accent/15 hover:text-white"
                >
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-accent" />
                    {MENTOR_HUB_LABEL}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-accent/70 transition-transform duration-200 ${mobilePremiumOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {mobilePremiumOpen && (
                  <div className="ml-4 space-y-0.5 border-l-2 border-accent/20 pl-3">
                    <p className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-accent/80">
                      <Users className="h-3 w-3" /> {MENTOR_HUB_LABEL}
                    </p>
                    {!isPaid && (
                      <Link
                        href={`${STUDENT_BASE}/pricing`}
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setMobilePremiumOpen(false);
                        }}
                        className="mx-1 mb-1 flex items-center justify-between gap-2 rounded-lg border border-amber-400/30 bg-amber-500/15 px-3 py-2 text-xs font-semibold text-amber-100"
                      >
                        Nâng cấp Premium
                        <Crown className="h-3.5 w-3.5" />
                      </Link>
                    )}
                    {mentorFeatures.map((item) => {
                      const Icon = item.icon;
                      const isLocked = !isPaid;
                      return (
                        <Link
                          key={item.name}
                          href={isLocked ? `${STUDENT_BASE}/pricing` : item.href}
                          onClick={() => {
                            setMobileMenuOpen(false);
                            setMobilePremiumOpen(false);
                          }}
                          className={`flex gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                            isLocked
                              ? "text-white/60 hover:bg-amber-500/10"
                              : "text-white/85 hover:bg-accent/10"
                          }`}
                        >
                          <Icon
                            className={`mt-0.5 h-4 w-4 shrink-0 ${
                              isLocked ? "text-amber-400/70" : "text-accent/90"
                            }`}
                          />
                          <span className="flex-1 font-semibold">{item.name}</span>
                          {isLocked && (
                            <Lock className="mt-0.5 h-3 w-3 shrink-0 text-accent/60" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}

                <Link
                  href={`${STUDENT_BASE}/settings`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-full px-4 py-3 text-sm text-white/85 hover:bg-white/10 hover:text-white transition-all duration-200"
                >
                  <Settings className="h-4 w-4 opacity-70" />
                  Cài đặt
                </Link>

                <Link
                  href={`${STUDENT_BASE}/support`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-full px-4 py-3 text-sm text-white/85 hover:bg-white/10 hover:text-white transition-all duration-200"
                >
                  <Headset className="h-4 w-4 opacity-70" />
                  Hỗ trợ
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-full px-4 py-3 text-sm text-destructive hover:bg-destructive/15 text-left transition-all duration-200"
                >
                  <LogOut className="h-4 w-4" />
                  Đăng xuất
                </button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
