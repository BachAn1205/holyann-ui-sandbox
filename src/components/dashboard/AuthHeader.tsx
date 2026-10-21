'use client'

import Link from 'next/link'
import {useAuthSession} from '@/hooks/useAuthSession'
import {signOut} from 'next-auth/react'
import {useState, useEffect, useMemo} from 'react'
import {usePathname} from 'next/navigation'
import {Menu, X} from 'lucide-react'
import { getRoleDashboardPath, getRoleChatPath, getRoleBasePath } from '@/lib/utils/role-paths'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

export default function AuthHeader() {
    const {user, isAuthenticated} = useAuthSession()
    const logout = () => signOut({ callbackUrl: '/login' })
    const pathname = usePathname()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    // Get dashboard URL based on user role
    const dashboardUrl = useMemo(() => getRoleDashboardPath(user?.role), [user?.role]);

    // Get chat URL based on user role
    const chatUrl = useMemo(() => getRoleChatPath(user?.role), [user?.role]);
    
    // Get base URL for role
    const baseUrl = useMemo(() => getRoleBasePath(user?.role), [user?.role]);

    const navItems = [
        {name: 'TỔNG QUAN', href: dashboardUrl},
        {name: 'HỒ SƠ', href: `${baseUrl}/profile`},
        {name: 'CHECKLIST', href: `${baseUrl}/checklist`},
        {name: 'MỤC TIÊU', href: `${baseUrl}/profile/schools`},
        {name: 'TRAO ĐỔI', href: chatUrl},
        {name: 'CÀI ĐẶT', href: `${baseUrl}/settings`},
    ]

    return (
        <header className="navbar-header sticky top-0 z-50 px-4 sm:px-6 md:px-8">
            <div className="flex h-16 items-center justify-between gap-4 w-full">
                {/* Logo */}
                <div className="flex items-center gap-3">
                    <Link href={dashboardUrl} className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded-lg transition-all duration-200 ease-in-out active:scale-[0.98]">
                        <div className="relative w-10 h-10 md:w-11 md:h-11 bg-primary-foreground/10 rounded-full flex items-center justify-center border border-primary-foreground/20 transition-colors group-hover:bg-primary-foreground/15 dark:bg-white/10 dark:border-white/10 dark:group-hover:bg-white/15">
                            <i className="fas fa-paper-plane text-accent text-lg md:text-xl transform -rotate-12"></i>
                        </div>
                        <div className="flex flex-col justify-center leading-none gap-0.5">
                            <span className="font-semibold tracking-[0.08em] text-primary-foreground dark:text-white">HOLYANN</span>
                            <span className="font-medium text-[0.5rem] sm:text-[0.6rem] md:text-[0.7rem] tracking-[0.25em] text-primary-foreground/60 uppercase dark:text-white/60">Explore</span>
                        </div>
                    </Link>
                </div>

                {/* Desktop nav */}
                <nav className="hidden lg:flex items-center gap-1">
                    {navItems.map((item) => {
                        const active = pathname === item.href || (item.href === dashboardUrl && pathname === dashboardUrl)
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`rounded-full px-4 py-2 text-sm font-medium tracking-wide transition-all duration-200 ease-in-out cursor-pointer
                                  focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900
                                  hover:scale-[1.02] active:scale-[0.98]
                                  ${active ? 'bg-primary-foreground/20 text-primary-foreground dark:bg-gradient-to-r dark:from-indigo-600/20 dark:to-blue-500/20 dark:text-white dark:shadow-[0_1px_0_0_rgba(255,255,255,0.08)]' : 'text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground dark:text-white/80 dark:hover:bg-slate-800 dark:hover:text-white'}`}
                            >
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>

                {/* Right: Theme, User */}
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                    <ThemeToggle
                        variant="icon"
                        className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/10 dark:hover:bg-slate-800 border border-primary-foreground/20 dark:border-white/10 flex-shrink-0 text-primary-foreground transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
                    />
                    <div className="h-6 w-px bg-primary-foreground/20 dark:bg-white/10 hidden md:block" />

                    {isAuthenticated ? (
                        <div className="flex items-center gap-2 sm:gap-3 pl-1 sm:pl-2">
                            <div className="text-right hidden xl:block">
                                <p className="text-xs text-primary-foreground/60 font-sans dark:text-white/60">Xin chào,</p>
                                <p className="text-sm font-bold text-primary-foreground max-w-[100px] truncate dark:text-white">{user?.name}</p>
                            </div>
                            <div className="relative group cursor-pointer">
                                <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center text-primary-foreground font-bold border border-primary-foreground/30 hover:bg-primary-foreground/10 dark:bg-white/10 dark:text-white dark:border-white/10 dark:hover:bg-slate-800 transition-all duration-200 text-xs sm:text-sm md:text-base flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40">
                                    {(user?.name ?? '').charAt(0).toUpperCase() || '?'}
                                </div>
                                <div className="absolute right-0 top-full mt-2 w-32 bg-popover dark:bg-slate-900/95 dark:backdrop-blur-md rounded-xl border border-border dark:border-white/10 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right scale-95 group-hover:scale-100 z-50">
                                    <button
                                        onClick={logout}
                                        className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 dark:text-red-400 dark:hover:bg-red-500/10 rounded-lg font-medium transition-colors"
                                    >
                                        <i className="fas fa-sign-out-alt mr-2"></i> Đăng xuất
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-2 sm:gap-3 pl-1 sm:pl-2">
                            <Link href="/login" className="hidden md:block px-4 sm:px-5 py-2 text-xs sm:text-sm font-medium text-primary-foreground/90 hover:bg-primary-foreground/10 hover:text-primary-foreground dark:text-white/90 dark:hover:bg-slate-800 dark:hover:text-white rounded-full transition-all duration-200 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40">
                                Đăng nhập
                            </Link>
                            <Link href="/register" className="px-4 sm:px-6 py-2 text-xs sm:text-sm font-semibold bg-accent text-accent-foreground dark:bg-amber-500 dark:text-slate-900 rounded-full shadow-lg hover:bg-accent/90 dark:hover:bg-amber-400 transition-all duration-200 active:scale-[0.98] flex items-center gap-1 sm:gap-2 whitespace-nowrap">
                                Đăng ký <i className="fas fa-arrow-right text-xs"></i>
                            </Link>
                        </div>
                    )}

                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="lg:hidden w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/10 dark:hover:bg-slate-800 border border-primary-foreground/20 dark:border-white/10 transition-all duration-200 flex-shrink-0 ml-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 active:scale-[0.98]"
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="lg:hidden border-t border-primary-foreground/20 bg-primary/95 dark:border-white/6 dark:bg-slate-900/95 dark:backdrop-blur-md w-full">
                    <nav className="px-4 py-4 flex flex-col gap-1">
                        {navItems.map((item) => {
                            const active = pathname === item.href || (item.href === dashboardUrl && pathname === dashboardUrl)
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`block px-4 py-3 rounded-full font-medium text-sm tracking-wide transition-all duration-200 ${
                                        active ? 'bg-gradient-to-r from-indigo-600/20 to-blue-500/20 text-white' : 'text-white/80 hover:bg-slate-800 hover:text-white'
                                    }`}
                                >
                                    {item.name}
                                </Link>
                            )
                        })}
                        {isAuthenticated && (
                            <div className="mt-2 pt-2 border-t border-primary-foreground/20 dark:border-white/6">
                                <div className="px-4 py-2 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center text-primary-foreground font-bold border border-primary-foreground/30 dark:bg-white/10 dark:text-white dark:border-white/10">
                                        {(user?.name ?? '').charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <div>
                                        <p className="text-xs text-primary-foreground/60 font-sans dark:text-white/60">XIN CHÀO,</p>
                                        <p className="text-sm font-bold text-primary-foreground dark:text-white">{user?.name}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { logout(); setMobileMenuOpen(false) }}
                                    className="w-full mt-2 px-4 py-3 rounded-full text-sm text-destructive hover:bg-destructive/10 dark:text-red-400 dark:hover:bg-red-500/10 font-medium text-left transition-colors"
                                >
                                    <i className="fas fa-sign-out-alt mr-2"></i> Đăng xuất
                                </button>
                            </div>
                        )}
                    </nav>
                </div>
            )}
        </header>
    )
}
