"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import UserModal from "@/components/admin/UserModal"
import RecentUsersTable from "@/components/admin/RecentUsersTable"
import { UserFormData } from '@/types/admin'
import { Users, GraduationCap, Briefcase, Megaphone, UserPlus, Link2, FileText, UserCheck } from 'lucide-react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    ResponsiveContainer,
    Tooltip,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
    CartesianGrid,
} from 'recharts'

type DashboardStats = {
    totalUsers: number
    students: number
    mentors: number
    admins: number
    marketing: number
    activeAssignments: number
    newUsersLast7Days: number
    subscriptionFree?: number
    subscriptionPlus?: number
    subscriptionPremium?: number
    newUsersPerDay?: { date: string; count: number }[]
}

const ROLE_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444']
const PLAN_COLORS = ['#64748b', '#22c55e', '#eab308']

export default function AdminDashboard() {
    const [mounted, setMounted] = useState(false)
    const [addUserOpen, setAddUserOpen] = useState(false)
    const [createUserError, setCreateUserError] = useState<string | null>(null)
    const [refreshTableKey, setRefreshTableKey] = useState(0)
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [statsLoading, setStatsLoading] = useState(true)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (!mounted) return
        fetch('/api/admin/dashboard-stats', { credentials: 'include' })
            .then((r) => r.ok ? r.json() : null)
            .then((data) => data && setStats(data))
            .catch(() => setStats(null))
            .finally(() => setStatsLoading(false))
    }, [mounted])

    const handleCreateUser = async (data: UserFormData) => {
        setCreateUserError(null)
        const res = await fetch('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                full_name: data.full_name,
                email: data.email,
                phone_number: data.phone_number || '',
                role: data.role,
                is_active: data.is_active,
                password: data.password,
                mentor_type: data.mentor_type,
            }),
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) {
            setCreateUserError(json.message || 'Failed to create user')
            return
        }
        setAddUserOpen(false)
        setRefreshTableKey((k) => k + 1)
    }

    if (!mounted) {
        return (
            <div className="w-full max-w-6xl mx-auto min-h-[300px] flex flex-col">
                <div className="flex-1 p-6 md:p-8 flex items-center justify-center">
                    <div className="animate-pulse">
                        <div className="h-6 bg-muted rounded w-48 mb-4"></div>
                        <div className="h-4 bg-muted rounded w-64"></div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full max-w-6xl mx-auto min-h-[300px] flex flex-col">
            <div className="flex-1 p-6 md:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h1 className="text-xl font-semibold text-foreground">Overview</h1>
                    <Button size="sm" className="shrink-0" onClick={() => setAddUserOpen(true)}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add user
                    </Button>
                </div>
                <UserModal
                    isOpen={addUserOpen}
                    onClose={() => { setAddUserOpen(false); setCreateUserError(null) }}
                    onSave={handleCreateUser}
                    user={null}
                    apiError={createUserError}
                />

                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {statsLoading ? (
                        [...Array(5)].map((_, i) => (
                            <div key={i} className="rounded-xl border border-border p-4 bg-muted/20 animate-pulse">
                                <div className="h-4 w-16 bg-muted rounded mb-2" />
                                <div className="h-8 w-12 bg-muted rounded" />
                            </div>
                        ))
                    ) : stats ? (
                        <>
                            <div className="rounded-xl border border-border p-4 bg-card">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total users</p>
                                        <p className="text-2xl font-bold text-foreground">{stats.totalUsers}</p>
                                    </div>
                                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Users className="h-5 w-5 text-primary" />
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-xl border border-border p-4 bg-card">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Students</p>
                                        <p className="text-2xl font-bold text-foreground">{stats.students}</p>
                                    </div>
                                    <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                        <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-xl border border-border p-4 bg-card">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Mentors</p>
                                        <p className="text-2xl font-bold text-foreground">{stats.mentors}</p>
                                    </div>
                                    <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                        <Briefcase className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-xl border border-border p-4 bg-card">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Marketing</p>
                                        <p className="text-2xl font-bold text-foreground">{stats.marketing}</p>
                                    </div>
                                    <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                        <Megaphone className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-xl border border-border p-4 bg-card">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Assignments</p>
                                        <p className="text-2xl font-bold text-foreground">{stats.activeAssignments}</p>
                                    </div>
                                    <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                        <Link2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : null}
                </div>

                {stats && !statsLoading && (
                    <div className="space-y-4">
                        <h2 className="text-sm font-semibold text-foreground">Thống kê người dùng</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="rounded-xl border border-border p-4 bg-card">
                                <h3 className="text-xs font-medium text-muted-foreground mb-3">Phân bố theo vai trò</h3>
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Học viên', value: stats.students },
                                                { name: 'Mentor', value: stats.mentors },
                                                { name: 'Marketing', value: stats.marketing },
                                                { name: 'Admin', value: stats.admins },
                                            ]}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={2}
                                            dataKey="value"
                                            label={({ name, value }) => `${name}: ${value}`}
                                        >
                                            {[0, 1, 2, 3].map((i) => (
                                                <Cell key={i} fill={ROLE_COLORS[i]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => [value, '']} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="rounded-xl border border-border p-4 bg-card">
                                <h3 className="text-xs font-medium text-muted-foreground mb-3">Gói đăng ký (học viên)</h3>
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart
                                        data={[
                                            { name: 'Free', count: stats.subscriptionFree ?? 0 },
                                            { name: 'Plus', count: stats.subscriptionPlus ?? 0 },
                                            { name: 'Premium', count: stats.subscriptionPremium ?? 0 },
                                        ]}
                                        margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                                        <Tooltip />
                                        <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Số học viên">
                                            {[0, 1, 2].map((i) => (
                                                <Cell key={i} fill={PLAN_COLORS[i]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        {stats.newUsersPerDay && stats.newUsersPerDay.length > 0 && (
                            <div className="rounded-xl border border-border p-4 bg-card">
                                <h3 className="text-xs font-medium text-muted-foreground mb-3">Người dùng mới (7 ngày qua)</h3>
                                <ResponsiveContainer width="100%" height={200}>
                                    <AreaChart
                                        data={stats.newUsersPerDay.map(({ date, count }) => ({
                                            date: new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
                                            count,
                                        }))}
                                        margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
                                    >
                                        <defs>
                                            <linearGradient id="newUsersGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                        <Tooltip />
                                        <Area
                                            type="monotone"
                                            dataKey="count"
                                            stroke="hsl(var(--primary))"
                                            fill="url(#newUsersGradient)"
                                            name="Người dùng mới"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                )}

                <div className="rounded-xl border border-border p-4 bg-card">
                    <h2 className="text-sm font-semibold text-foreground mb-3">Quick access</h2>
                    <div className="flex flex-wrap gap-2">
                        <Link href="/admin/users">
                            <Button variant="outline" size="sm" className="gap-2">
                                <Users className="h-4 w-4" />
                                Users
                            </Button>
                        </Link>
                        <Link href="/admin/students">
                            <Button variant="outline" size="sm" className="gap-2">
                                <GraduationCap className="h-4 w-4" />
                                Students
                            </Button>
                        </Link>
                        <Link href="/admin/mentors">
                            <Button variant="outline" size="sm" className="gap-2">
                                <Briefcase className="h-4 w-4" />
                                Mentors
                            </Button>
                        </Link>
                        <Link href="/admin/file-review">
                            <Button variant="outline" size="sm" className="gap-2">
                                <FileText className="h-4 w-4" />
                                File review
                            </Button>
                        </Link>
                        <Link href="/admin/guests">
                            <Button variant="outline" size="sm" className="gap-2">
                                <UserCheck className="h-4 w-4" />
                                Guests
                            </Button>
                        </Link>
                    </div>
                </div>

                <RecentUsersTable key={refreshTableKey} />
            </div>
            <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border mt-4">
                Admin © 2025 <span className="text-primary font-heading font-bold">HOLYANN EXPLORE</span>
            </footer>
        </div>
    )
}