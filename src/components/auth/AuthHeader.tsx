'use client'

import Link from 'next/link'
import {useAuthSession} from '@/hooks/useAuthSession'
import {signOut} from 'next-auth/react'
import {useState, useMemo} from 'react'
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

    const navItems = user?.role === 'admin' || user?.role === 'ADMIN' ? [
        {name: 'TỔNG QUAN', href: dashboardUrl},
        {name: 'NGƯỜI DÙNG', href: `${baseUrl}/users`},
        {name: 'HỌC VIÊN', href: `${baseUrl}/students`},
        {name: 'Cố vấn', href: `${baseUrl}/mentors`},
        {name: 'TRAO ĐỔI', href: chatUrl},
    ] : [
        {name: 'TỔNG QUAN', href: dashboardUrl},
        {name: 'HỒ SƠ', href: `${baseUrl}/profile`},
        {name: 'CHECKLIST', href: `${baseUrl}/checklist`},
        {name: 'MỤC TIÊU', href: `${baseUrl}/profile/schools`},
        {name: 'TRAO ĐỔI', href: chatUrl},
        {name: 'CÀI ĐẶT', href: `${baseUrl}/settings`},
    ]

    return (
        <header
            className="bg-gradient-to-r from-primary to-secondary text-primary-foreground px-8 py-4 shadow-md flex justify-between items-center sticky top-0 z-50 transition-colors duration-300">

            {/* 1. LOGO KHU VỰC */}
            <div className="flex items-center gap-3">
                <Link href={dashboardUrl} className="flex items-center gap-3 group">
                    <div
                        className="relative w-10 h-10 md:w-12 md:h-12 bg-primary-foreground/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-primary-foreground/20">
                        {/* Logo Icon */}
                        <i className="fas fa-paper-plane text-accent text-lg md:text-xl transform -rotate-12 group-hover:scale-110 transition-transform"></i>
                    </div>

                        {/* Typography Logo */}
                        <div className="flex flex-col justify-center leading-none">
                            <span className="font-heading font-extrabold text-base sm:text-lg md:text-xl tracking-wider text-primary-foreground group-hover:text-accent transition-colors">
                                HOLYANN
                            </span>
                            <span className="font-heading font-medium text-[0.5rem] sm:text-[0.6rem] md:text-[0.7rem] tracking-[0.3em] text-primary-foreground/90 uppercase">
                                Explore
                            </span>
                        </div>
                    </Link>
                </div>

            {/* 2. NAVIGATION */}
            <nav className="hidden md:flex items-center gap-8">
                {navItems.map((item) => (
                    <Link
                        key={item.name}
                        href={item.href}
                        className={`
                            font-heading text-sm font-semibold tracking-wide transition-all duration-300 relative py-1
                            ${pathname === item.href || (item.href === dashboardUrl && pathname === dashboardUrl)
                            ? 'text-primary-foreground after:w-full'
                            : 'text-primary-foreground/80 hover:text-primary-foreground after:w-0 hover:after:w-full'
                        }
                            after:absolute after:bottom-0 after:left-0 after:h-[2px] after:bg-accent after:transition-all after:duration-300
                        `}
                    >
                        {item.name}
                    </Link>
                ))}
            </nav>

                {/* 3. USER ACTION & THEME TOGGLE */}
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                    {/* NÚT CHUYỂN ĐỔI THEME */}
                    <ThemeToggle
                        variant="icon"
                        className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 border border-primary-foreground/10 hover:border-accent flex-shrink-0 text-primary-foreground"
                    />

                    {/* Phân cách */}
                    <div className="h-6 w-[1px] bg-primary-foreground/20 hidden md:block"></div>

                    {isAuthenticated ? (
                        <div className="flex items-center gap-2 sm:gap-3 pl-1 sm:pl-2">
                            <div className="text-right hidden xl:block">
                                <p className="text-xs text-white font-sans">Xin chào,</p>
                                <p className="text-sm font-bold font-heading text-primary-foreground max-w-[100px] truncate">{user?.name}</p>
                            </div>

                            <div className="relative group cursor-pointer">
                                <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center text-primary-foreground font-bold border-2 border-primary-foreground/30 shadow-lg group-hover:border-accent transition-colors text-xs sm:text-sm md:text-base flex-shrink-0">
                                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>

                                <div className="absolute right-0 top-full mt-2 w-32 bg-popover dark:bg-card rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right text-foreground z-50">
                                    <button
                                        onClick={logout}
                                        className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20 rounded-lg font-medium"
                                    >
                                        <i className="fas fa-sign-out-alt mr-2"></i> Đăng xuất
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-2 sm:gap-3 pl-1 sm:pl-2">
                            <Link
                                href="/login"
                                className="hidden md:block px-4 sm:px-5 py-2 text-xs sm:text-sm font-heading font-bold text-primary-foreground hover:text-accent transition-colors whitespace-nowrap"
                            >
                                Đăng nhập
                            </Link>
                            <Link
                                href="/register"
                                className="px-4 sm:px-6 py-2 text-xs sm:text-sm font-heading font-bold bg-accent text-accent-foreground rounded-full shadow-lg hover:bg-accent/90 transform hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-1 sm:gap-2 whitespace-nowrap"
                            >
                                Đăng ký <i className="fas fa-arrow-right text-xs"></i>
                            </Link>
                        </div>
                    )}

                    {/* Mobile Menu Toggle Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="lg:hidden w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-all border border-primary-foreground/10 hover:border-accent flex-shrink-0 ml-1"
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? (
                            <X className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
                        ) : (
                            <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
                        )}
                    </button>
                </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="lg:hidden border-t border-primary-foreground/20 bg-primary/95 backdrop-blur-md">
                    <nav className="px-4 py-4 flex flex-col gap-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`
                                    block px-4 py-3 rounded-lg font-heading text-sm font-semibold tracking-wide transition-all duration-300
                                    ${pathname === item.href || (item.href === '/dashboard' && pathname === '/dashboard')
                                    ? 'bg-primary-foreground/20 text-primary-foreground'
                                    : 'text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground'
                                }
                                `}
                            >
                                {item.name}
                            </Link>
                        ))}

                        {isAuthenticated && (
                            <div className="mt-2 pt-2 border-t border-primary-foreground/20">
                                <div className="px-4 py-2 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center text-primary-foreground font-bold border-2 border-primary-foreground/30">
                                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                        <p className="text-xs text-primary-foreground/70 font-sans">Xin chào,</p>
                                        <p className="text-sm font-bold font-heading text-primary-foreground">{user?.name}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        logout()
                                        setMobileMenuOpen(false)
                                    }}
                                    className="w-full mt-2 px-4 py-3 rounded-lg text-sm text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20 font-medium text-left"
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
