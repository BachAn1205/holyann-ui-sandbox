"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Headphones,
  LayoutDashboard,
  LogOut,
  Menu,
  PenSquare,
  ScrollText,
  Settings,
  X,
} from "lucide-react";

import { useAuthSession } from "@/hooks/useAuthSession";

const MARKETING_BASE = "/marketing";

const navItems = [
  { name: "Tổng quan", href: `${MARKETING_BASE}`, icon: LayoutDashboard },
  { name: "Bài viết", href: `${MARKETING_BASE}/posts`, icon: ScrollText },
  { name: "Tạo bài", href: `${MARKETING_BASE}/posts/new`, icon: PenSquare },
  { name: "Hỗ trợ", href: `${MARKETING_BASE}/support`, icon: Headphones },
];

function isActive(pathname: string, href: string) {
  if (href === `${MARKETING_BASE}/posts/new`) return pathname === href;
  if (href === `${MARKETING_BASE}/posts`) {
    if (pathname === `${MARKETING_BASE}/posts/new`) return false;
    return pathname === href || pathname.startsWith(href + "/");
  }
  if (href === `${MARKETING_BASE}/support`) {
    return pathname === href || pathname.startsWith(href + "/");
  }
  if (href === MARKETING_BASE) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

export default function MarketingNavbar() {
  const { user, isAuthenticated } = useAuthSession();
  const pathname = usePathname();
  const logout = () => signOut({ callbackUrl: "/login" });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
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
        <div className="flex items-center gap-3">
          <Link
            href={MARKETING_BASE}
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
                ${active ? "bg-white/20 text-white ring-1 ring-white/25 shadow-sm" : "text-white/80 hover:bg-white/10 hover:text-white"}`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? "text-white" : "opacity-70"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <div className="relative hidden xl:block" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-2 py-1.5 pr-2 md:px-3 md:py-2 hover:bg-white/15 hover:border-white/30 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 active:scale-[0.98]"
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
              >
                <span className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full bg-white/90 text-primary text-sm font-bold ring-1 ring-white/50 shadow-md">
                  {(user?.name?.charAt(0) ?? user?.email?.charAt(0) ?? "M").toUpperCase()}
                </span>
                <span className="hidden max-w-[180px] truncate text-sm font-medium text-white xl:block">
                  {(user?.name?.trim() || user?.email) ?? ""} - Marketing
                </span>
                <ChevronDown className={`h-4 w-4 text-white/80 transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`} />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-56 origin-top-right rounded-xl border border-border bg-card p-1 shadow-xl text-foreground animate-in fade-in-0 zoom-in-95 duration-200">
                  <div className="px-2 py-2 border-b border-border mb-1">
                    <p className="text-[10px] text-muted-foreground tracking-widest font-semibold">Xin chào</p>
                    <p className="truncate text-sm font-bold text-foreground">
                      {(user?.name?.trim() || user?.email) ?? ""} - Marketing
                    </p>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                    Về dashboard
                  </Link>
                  <Link
                    href={`${MARKETING_BASE}/settings`}
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
              )}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="xl:hidden flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/10 hover:bg-white/20 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 active:scale-[0.97]"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5 text-white" /> : <Menu className="h-5 w-5 text-white/90" />}
          </button>
        </div>
      </div>

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
                    active ? "bg-white/20 text-white ring-1 ring-white/20" : "text-white/85 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${active ? "opacity-100" : "opacity-70"}`} />
                  {item.name}
                </Link>
              );
            })}
            <div className="mt-2 border-t border-white/10 pt-2">
              <Link
                href={`${MARKETING_BASE}/settings`}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-full px-4 py-3 text-sm text-white/85 hover:bg-white/10 hover:text-white transition-all duration-200"
              >
                <Settings className="h-4 w-4 opacity-70" />
                Cài đặt
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
          </nav>
        </div>
      )}
    </header>
  );
}

