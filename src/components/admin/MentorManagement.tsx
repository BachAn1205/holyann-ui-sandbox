'use client'

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { getMentorsAction } from '@/actions/admin/get-mentors'
import { assignMentorToStudent, unassignMentor } from '@/actions/admin/assign-mentor'
import UserAvatar from '@/components/ui/UserAvatar'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Mail, Phone, Globe, Linkedin, Briefcase, GraduationCap, Star, Users, Pencil } from 'lucide-react'

// Define type based on action return
type MentorWithUser = {
    user_id: string
    specialization: string
    bio: string | null
    linkedin_url: string | null
    website_url: string | null
    university_name: string | null
    degree: string | null
    major: string | null
    graduation_year: number | null
    current_company: string | null
    current_job_title: string | null
    years_of_experience: number | null
    expertises: any
    outstanding_achievements: any
    is_accepting_students: boolean | null
    max_students: number | null
    rating: number | null
    users: {
        id: string
        full_name: string
        email: string
        avatar_url: string | null
        phone_number: string | null
        role?: string
        is_active: boolean | null
        created_at: Date | null
    }
    mentor_assignments: any[]
}

type StudentOption = { id: string; name: string | null; email: string | null }

export default function MentorManagement() {
    const [mentors, setMentors] = useState<MentorWithUser[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageQuery, setPageQuery] = useState('1')
    const [selectedMentor, setSelectedMentor] = useState<MentorWithUser | null>(null)
    const [profileOpen, setProfileOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [assignMentor, setAssignMentor] = useState<MentorWithUser | null>(null)
    const [assignOpen, setAssignOpen] = useState(false)
    const [assignStudents, setAssignStudents] = useState<StudentOption[]>([])
    const [assignStudentsLoading, setAssignStudentsLoading] = useState(false)
    const [assignStudentsPage, setAssignStudentsPage] = useState(1)
    const [assignStudentsTotalPages, setAssignStudentsTotalPages] = useState(1)
    const [assignStudentsTotal, setAssignStudentsTotal] = useState(0)
    const [assignSearchInput, setAssignSearchInput] = useState('')
    const [assignSearchTerm, setAssignSearchTerm] = useState('')
    const [assignStudentIds, setAssignStudentIds] = useState<Set<string>>(new Set())
    const [unassignStudentIds, setUnassignStudentIds] = useState<Set<string>>(new Set())
    const [assignLoading, setAssignLoading] = useState(false)
    const [unassignLoading, setUnassignLoading] = useState(false)
    const [assignMessage, setAssignMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
    const [editOpen, setEditOpen] = useState(false)
    const [editingMentor, setEditingMentor] = useState<MentorWithUser | null>(null)
    const [editLoading, setEditLoading] = useState(false)
    const [editForm, setEditForm] = useState<{
        full_name: string
        email: string
        phone_number: string
        role: string
        is_active: boolean
        specialization: string
        bio: string
        linkedin_url: string
        website_url: string
        university_name: string
        degree: string
        major: string
        graduation_year: string
        current_company: string
        current_job_title: string
        years_of_experience: string
        is_accepting_students: boolean
        max_students: string
    } | null>(null)

    const openEdit = (mentor: MentorWithUser) => {
        setEditingMentor(mentor)
        setEditForm({
            full_name: mentor.users.full_name,
            email: mentor.users.email,
            phone_number: mentor.users.phone_number ?? '',
            role: (mentor.users as { role?: string }).role ?? 'MENTOR',
            is_active: mentor.users.is_active ?? true,
            specialization: mentor.specialization,
            bio: mentor.bio ?? '',
            linkedin_url: mentor.linkedin_url ?? '',
            website_url: mentor.website_url ?? '',
            university_name: mentor.university_name ?? '',
            degree: mentor.degree ?? '',
            major: mentor.major ?? '',
            graduation_year: mentor.graduation_year != null ? String(mentor.graduation_year) : '',
            current_company: mentor.current_company ?? '',
            current_job_title: mentor.current_job_title ?? '',
            years_of_experience: mentor.years_of_experience != null ? String(mentor.years_of_experience) : '',
            is_accepting_students: mentor.is_accepting_students ?? true,
            max_students: mentor.max_students != null ? String(mentor.max_students) : '5',
        })
        setEditOpen(true)
    }
    const closeEdit = () => {
        setEditOpen(false)
        setEditingMentor(null)
        setEditForm(null)
    }
    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingMentor || !editForm) return
        setEditLoading(true)
        try {
            const res = await fetch(`/api/admin/mentors/${editingMentor.user_id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: editForm.full_name,
                    email: editForm.email,
                    phone_number: editForm.phone_number || null,
                    role: editForm.role,
                    is_active: editForm.is_active,
                    specialization: editForm.specialization,
                    bio: editForm.bio || null,
                    linkedin_url: editForm.linkedin_url || null,
                    website_url: editForm.website_url || null,
                    university_name: editForm.university_name || null,
                    degree: editForm.degree || null,
                    major: editForm.major || null,
                    graduation_year: editForm.graduation_year ? Number(editForm.graduation_year) : null,
                    current_company: editForm.current_company || null,
                    current_job_title: editForm.current_job_title || null,
                    years_of_experience: editForm.years_of_experience ? Number(editForm.years_of_experience) : null,
                    is_accepting_students: editForm.is_accepting_students,
                    max_students: editForm.max_students ? Number(editForm.max_students) : null,
                }),
            })
            if (res.ok) {
                toast.success('Mentor updated')
                const result = await getMentorsAction()
                if (result.success && result.data) setMentors(result.data as MentorWithUser[])
                closeEdit()
            } else {
                const data = await res.json().catch(() => ({}))
                toast.error(data.message || 'Failed to update')
            }
        } catch {
            toast.error('Failed to update mentor')
        } finally {
            setEditLoading(false)
        }
    }

    const openProfile = (mentor: MentorWithUser) => {
        setSelectedMentor(mentor)
        setProfileOpen(true)
    }
    const closeProfile = () => {
        setProfileOpen(false)
        setSelectedMentor(null)
    }

    const openAssign = (mentor: MentorWithUser) => {
        setAssignMentor(mentor)
        setAssignStudentIds(new Set())
        setUnassignStudentIds(new Set())
        setAssignMessage(null)
        setAssignSearchInput('')
        setAssignSearchTerm('')
        setAssignStudentsPage(1)
        setAssignOpen(true)
    }
    const closeAssign = () => {
        setAssignOpen(false)
        setAssignMentor(null)
        setAssignStudentIds(new Set())
        setUnassignStudentIds(new Set())
        setAssignMessage(null)
        setAssignSearchInput('')
        setAssignSearchTerm('')
        setAssignStudentsPage(1)
        setAssignStudents([])
    }
    const toggleUnassignStudent = (id: string) => {
        setUnassignStudentIds((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }
    const toggleAssignStudent = (id: string) => {
        setAssignStudentIds((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }
    const clearAllAssignStudents = () => setAssignStudentIds(new Set())

    useEffect(() => {
        const timer = setTimeout(() => {
            setAssignSearchTerm(assignSearchInput.trim())
            setAssignStudentsPage(1)
        }, 300)
        return () => clearTimeout(timer)
    }, [assignSearchInput])

    useEffect(() => {
        if (!assignOpen) return

        const controller = new AbortController()
        const params = new URLSearchParams({
            premiumOnly: 'true',
            page: String(assignStudentsPage),
            pageSize: '10',
        })
        if (assignSearchTerm) params.set('q', assignSearchTerm)

        setAssignStudentsLoading(true)
        fetch(`/api/admin/students?${params.toString()}`, { signal: controller.signal })
            .then(res => res.ok ? res.json() : { students: [], totalPages: 1, total: 0 })
            .then(data => {
                setAssignStudents(data.students || [])
                setAssignStudentsTotalPages(Math.max(1, Number(data.totalPages) || 1))
                setAssignStudentsTotal(Number(data.total) || 0)
            })
            .catch((error) => {
                if (error?.name === 'AbortError') return
                setAssignStudents([])
                setAssignStudentsTotalPages(1)
                setAssignStudentsTotal(0)
            })
            .finally(() => setAssignStudentsLoading(false))

        return () => controller.abort()
    }, [assignOpen, assignSearchTerm, assignStudentsPage])

    const handleAssignSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!assignMentor || assignStudentIds.size === 0) return
        const mentorType = assignMentor.specialization as 'AS' | 'ACS' | 'ARD'
        if (!['AS', 'ACS', 'ARD'].includes(mentorType)) return

        const currentCount = (assignMentor.mentor_assignments ?? []).filter(
            (a: { status?: string }) => (a.status ?? 'ACTIVE') === 'ACTIVE'
        ).length
        const maxStudents = assignMentor.max_students ?? 0
        const freeSlots = Math.max(0, maxStudents - currentCount)
        if (freeSlots <= 0) {
            toast.error('This mentor has reached the maximum number of students.')
            return
        }
        const ids = Array.from(assignStudentIds)
        if (ids.length > freeSlots) {
            toast.error(`This mentor can only accept ${freeSlots} more student(s) (max ${maxStudents}). Please deselect some.`)
            return
        }

        setAssignLoading(true)
        setAssignMessage(null)
        const ok: string[] = []
        const err: string[] = []
        try {
            for (const studentId of ids) {
                const result = await assignMentorToStudent(studentId, assignMentor.user_id, mentorType)
                if (result.success) ok.push(studentId)
                else err.push(result.message)
            }
            if (err.length === 0) {
                setAssignMessage({ type: 'success', text: `Assigned ${ok.length} student(s) successfully.` })
                setAssignStudentIds(new Set())
                const result = await getMentorsAction()
                if (result.success && result.data) {
                    setMentors(result.data as MentorWithUser[])
                    const updated = (result.data as MentorWithUser[]).find((m) => m.user_id === assignMentor.user_id)
                    if (updated) setAssignMentor(updated)
                }
            } else if (ok.length > 0) {
                setAssignMessage({
                    type: 'error',
                    text: `Assigned ${ok.length}; ${err.length} failed. You can retry the remaining.`
                })
                setAssignStudentIds(new Set(ids.filter((id) => !ok.includes(id))))
            } else {
                setAssignMessage({ type: 'error', text: err[0] ?? 'Failed to assign' })
            }
        } catch {
            setAssignMessage({ type: 'error', text: 'Failed to assign' })
        } finally {
            setAssignLoading(false)
        }
    }

    const handleUnassignSubmit = async () => {
        if (!assignMentor || unassignStudentIds.size === 0) return
        const mentorType = assignMentor.specialization as 'AS' | 'ACS' | 'ARD'
        if (!['AS', 'ACS', 'ARD'].includes(mentorType)) return
        setUnassignLoading(true)
        setAssignMessage(null)
        const ids = Array.from(unassignStudentIds)
        const ok: string[] = []
        const err: string[] = []
        try {
            for (const studentId of ids) {
                const result = await unassignMentor(studentId, mentorType)
                if (result.success) ok.push(studentId)
                else err.push(result.message ?? 'Failed')
            }
            if (err.length === 0) {
                setAssignMessage({ type: 'success', text: `Unassigned ${ok.length} student(s).` })
                setUnassignStudentIds(new Set())
                const result = await getMentorsAction()
                if (result.success && result.data) {
                    setMentors(result.data as MentorWithUser[])
                    const updated = (result.data as MentorWithUser[]).find((m) => m.user_id === assignMentor.user_id)
                    if (updated) setAssignMentor(updated)
                }
            } else {
                setAssignMessage({ type: 'error', text: err[0] ?? 'Unassign failed' })
            }
        } catch {
            setAssignMessage({ type: 'error', text: 'Unassign failed' })
        } finally {
            setUnassignLoading(false)
        }
    }

    useEffect(() => {
        const fetchMentors = async () => {
            const result = await getMentorsAction()
            if (result.success) {
                setMentors(result.data as any)
            }
            setLoading(false)
        }
        fetchMentors()
    }, [])

    const filteredMentors = mentors.filter(mentor =>
        mentor.users.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mentor.users.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    const itemsPerPage = 10
    const totalPages = Math.max(1, Math.ceil(filteredMentors.length / itemsPerPage))
    const safeCurrentPage = Math.min(currentPage, totalPages)
    const indexOfFirstItem = (safeCurrentPage - 1) * itemsPerPage
    const indexOfLastItem = indexOfFirstItem + itemsPerPage
    const paginatedMentors = filteredMentors.slice(indexOfFirstItem, indexOfLastItem)

    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm])

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages)
    }, [currentPage, totalPages])

    useEffect(() => {
        setPageQuery(String(safeCurrentPage))
    }, [safeCurrentPage])

    const visiblePages = useMemo(() => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1)
        }
        const pages = new Set<number>([1, totalPages, safeCurrentPage])
        if (safeCurrentPage - 1 > 1) pages.add(safeCurrentPage - 1)
        if (safeCurrentPage + 1 < totalPages) pages.add(safeCurrentPage + 1)
        return Array.from(pages).sort((a, b) => a - b)
    }, [safeCurrentPage, totalPages])

    const jumpToPage = () => {
        const target = Number(pageQuery)
        if (!Number.isFinite(target)) return
        const normalized = Math.min(totalPages, Math.max(1, Math.floor(target)))
        setCurrentPage(normalized)
    }

    const handleRefreshMentors = async () => {
        setRefreshing(true)
        const result = await getMentorsAction()
        if (result.success && result.data) {
            setMentors(result.data as MentorWithUser[])
        }
        setRefreshing(false)
    }

    if (loading) {
        return (
            <div className="w-full max-w-6xl mx-auto min-h-[300px] flex flex-col">
                <div className="flex-1 p-6 md:p-8 space-y-6">
                    <h1 className="text-xl font-semibold text-foreground">Mentors</h1>
                    <div className="border border-border rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border bg-muted/20">
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Cố vấn</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground hidden md:table-cell">Email</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground hidden lg:table-cell">Specialization</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Rating</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Active</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Status</th>
                                        <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.from({ length: 6 }).map((_, index) => (
                                        <tr key={index} className="border-b border-border">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                                                    <div className="space-y-2">
                                                        <div className="h-3 w-28 rounded bg-muted animate-pulse" />
                                                        <div className="h-2.5 w-36 rounded bg-muted animate-pulse md:hidden" />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 hidden md:table-cell"><div className="h-3 w-44 rounded bg-muted animate-pulse" /></td>
                                            <td className="py-3 px-4 hidden lg:table-cell"><div className="h-3 w-24 rounded bg-muted animate-pulse" /></td>
                                            <td className="py-3 px-4"><div className="h-3 w-12 rounded bg-muted animate-pulse" /></td>
                                            <td className="py-3 px-4"><div className="h-3 w-10 rounded bg-muted animate-pulse" /></td>
                                            <td className="py-3 px-4"><div className="h-6 w-16 rounded-full bg-muted animate-pulse" /></td>
                                            <td className="py-3 px-4"><div className="ml-auto h-7 w-28 rounded bg-muted animate-pulse" /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full max-w-6xl mx-auto min-h-[300px] flex flex-col">
            <div className="flex-1 p-6 md:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h1 className="text-xl font-semibold text-foreground">Mentors</h1>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                            {filteredMentors.length} mentor{filteredMentors.length !== 1 ? 's' : ''}
                        </span>
                        <Button variant="outline" size="sm" onClick={handleRefreshMentors} disabled={refreshing}>
                            {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <i className="fas fa-refresh mr-2" />}
                            {refreshing ? 'Refreshing...' : 'Refresh'}
                        </Button>
                    </div>
                </div>

                <div className="relative max-w-md">
                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search mentors..."
                        className="w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {filteredMentors.length === 0 ? (
                    <div className="text-center py-16 border border-border rounded-xl bg-muted/20 border-dashed">
                        <Users className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                        <h3 className="text-lg font-medium text-foreground">No mentors found</h3>
                        <p className="text-muted-foreground text-sm">Try a different search.</p>
                    </div>
                ) : (
                    <>
                    <div className="border border-border rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border bg-muted/20">
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Cố vấn</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground hidden md:table-cell">Email</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground hidden lg:table-cell">Specialization</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Rating</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Active</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Status</th>
                                        <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedMentors.map((mentor) => (
                                        <tr
                                            key={mentor.user_id}
                                            className="border-b border-border hover:bg-muted/30 transition-colors"
                                        >
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <UserAvatar src={mentor.users.avatar_url} name={mentor.users.full_name} role="MENTOR" size="md" showInitials={true} />
                                                    <div>
                                                        <div className="font-semibold text-foreground">{mentor.users.full_name}</div>
                                                        <div className="text-xs text-muted-foreground md:hidden">{mentor.users.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-muted-foreground hidden md:table-cell">
                                                {mentor.users.email}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-muted-foreground hidden lg:table-cell max-w-[180px] truncate" title={mentor.specialization}>
                                                {mentor.specialization || '-'}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="inline-flex items-center gap-1 text-sm">
                                                    <Star size={14} className="text-amber-500 shrink-0" fill="currentColor" />
                                                    {mentor.rating != null ? mentor.rating.toFixed(1) : '-'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-muted-foreground">
                                                {(mentor.mentor_assignments ?? []).filter((a: { status?: string }) => (a.status ?? 'ACTIVE') === 'ACTIVE').length}/{mentor.max_students ?? '-'}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                    mentor.is_accepting_students
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                    {mentor.is_accepting_students ? 'Accepting' : 'Full'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => openEdit(mentor)}
                                                        className="text-primary hover:text-primary/80"
                                                        title="Chỉnh sửa Cố vấn"
                                                    >
                                                        <Pencil className="h-4 w-4 mr-1" />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => openAssign(mentor)}
                                                        className="text-primary hover:text-primary/80"
                                                        title="Assign to student"
                                                    >
                                                        <i className="fas fa-user-plus mr-1" />
                                                        Assign
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => openProfile(mentor)}
                                                        className="text-primary hover:text-primary/80"
                                                    >
                                                        <i className="fas fa-eye mr-1" />
                                                        View
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {filteredMentors.length > 0 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
                            <div className="text-sm text-muted-foreground">
                                Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredMentors.length)} / {filteredMentors.length}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={safeCurrentPage === 1}
                                    className="px-3 py-1.5 text-sm rounded-md border border-border bg-background text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                {visiblePages.map((page, index) => {
                                    const prev = visiblePages[index - 1]
                                    const showGap = index > 0 && prev != null && page - prev > 1
                                    return (
                                        <div key={page} className="flex items-center gap-2">
                                            {showGap && <span className="px-1.5 py-1.5 text-sm text-muted-foreground">...</span>}
                                            <button
                                                type="button"
                                                onClick={() => setCurrentPage(page)}
                                                className={`min-w-8 px-2.5 py-1.5 text-sm rounded-md border transition-colors ${
                                                    safeCurrentPage === page
                                                        ? 'border-primary bg-primary text-primary-foreground'
                                                        : 'border-border bg-background text-foreground hover:bg-muted'
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        </div>
                                    )
                                })}
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={safeCurrentPage === totalPages}
                                    className="px-3 py-1.5 text-sm rounded-md border border-border bg-background text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                                <div className="hidden sm:flex items-center gap-1 ml-1">
                                    <input
                                        type="number"
                                        min={1}
                                        max={totalPages}
                                        value={pageQuery}
                                        onChange={(e) => setPageQuery(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') jumpToPage()
                                        }}
                                        className="w-16 h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground"
                                        aria-label="Jump page"
                                    />
                                    <button
                                        type="button"
                                        onClick={jumpToPage}
                                        className="px-2.5 py-1.5 text-xs rounded-md border border-border bg-background text-foreground hover:bg-muted"
                                    >
                                        Go
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    </>
                )}

                {/* Chỉnh sửa Cố vấn modal */}
                <Dialog open={editOpen} onOpenChange={(open) => !open && closeEdit()}>
                    <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
                        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
                            <DialogTitle>Chỉnh sửa Cố vấn</DialogTitle>
                        </DialogHeader>
                        {editForm && editingMentor && (
                            <form onSubmit={handleEditSubmit} className="flex flex-col flex-1 min-h-0">
                                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-semibold text-foreground">User</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-full_name">Full name</Label>
                                                <Input
                                                    id="edit-full_name"
                                                    value={editForm.full_name}
                                                    onChange={(e) => setEditForm((f) => f ? { ...f, full_name: e.target.value } : f)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-email">Email</Label>
                                                <Input
                                                    id="edit-email"
                                                    type="email"
                                                    value={editForm.email}
                                                    onChange={(e) => setEditForm((f) => f ? { ...f, email: e.target.value } : f)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-phone">Phone</Label>
                                                <Input
                                                    id="edit-phone"
                                                    value={editForm.phone_number}
                                                    onChange={(e) => setEditForm((f) => f ? { ...f, phone_number: e.target.value } : f)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-role">Role</Label>
                                                <select
                                                    id="edit-role"
                                                    value={editForm.role}
                                                    onChange={(e) => setEditForm((f) => f ? { ...f, role: e.target.value } : f)}
                                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                >
                                                    <option value="STUDENT">Student</option>
                                                    <option value="MENTOR">Cố vấn</option>
                                                    <option value="ADMIN">Admin</option>
                                                </select>
                                            </div>
                                            <div className="flex items-center gap-2 pt-6">
                                                <input
                                                    type="checkbox"
                                                    id="edit-is_active"
                                                    checked={editForm.is_active}
                                                    onChange={(e) => setEditForm((f) => f ? { ...f, is_active: e.target.checked } : f)}
                                                    className="h-4 w-4 rounded border-border"
                                                />
                                                <Label htmlFor="edit-is_active" className="cursor-pointer">Active</Label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-semibold text-foreground">Hồ sơ Cố vấn</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-specialization">Specialization</Label>
                                                <select
                                                    id="edit-specialization"
                                                    value={editForm.specialization}
                                                    onChange={(e) => setEditForm((f) => f ? { ...f, specialization: e.target.value } : f)}
                                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                >
                                                    <option value="AS">AS</option>
                                                    <option value="ACS">ACS</option>
                                                    <option value="ARD">ARD</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-max_students">Max students</Label>
                                                <Input
                                                    id="edit-max_students"
                                                    type="number"
                                                    min={1}
                                                    value={editForm.max_students}
                                                    onChange={(e) => setEditForm((f) => f ? { ...f, max_students: e.target.value } : f)}
                                                />
                                            </div>
                                            <div className="space-y-2 sm:col-span-2">
                                                <Label htmlFor="edit-bio">Bio</Label>
                                                <textarea
                                                    id="edit-bio"
                                                    rows={3}
                                                    value={editForm.bio}
                                                    onChange={(e) => setEditForm((f) => f ? { ...f, bio: e.target.value } : f)}
                                                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-current_company">Current company</Label>
                                                <Input
                                                    id="edit-current_company"
                                                    value={editForm.current_company}
                                                    onChange={(e) => setEditForm((f) => f ? { ...f, current_company: e.target.value } : f)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-current_job_title">Job title</Label>
                                                <Input
                                                    id="edit-current_job_title"
                                                    value={editForm.current_job_title}
                                                    onChange={(e) => setEditForm((f) => f ? { ...f, current_job_title: e.target.value } : f)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-years_of_experience">Years of experience</Label>
                                                <Input
                                                    id="edit-years_of_experience"
                                                    type="number"
                                                    min={0}
                                                    value={editForm.years_of_experience}
                                                    onChange={(e) => setEditForm((f) => f ? { ...f, years_of_experience: e.target.value } : f)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-university_name">University</Label>
                                                <Input
                                                    id="edit-university_name"
                                                    value={editForm.university_name}
                                                    onChange={(e) => setEditForm((f) => f ? { ...f, university_name: e.target.value } : f)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-degree">Degree</Label>
                                                <Input
                                                    id="edit-degree"
                                                    value={editForm.degree}
                                                    onChange={(e) => setEditForm((f) => f ? { ...f, degree: e.target.value } : f)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-major">Major</Label>
                                                <Input
                                                    id="edit-major"
                                                    value={editForm.major}
                                                    onChange={(e) => setEditForm((f) => f ? { ...f, major: e.target.value } : f)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-graduation_year">Graduation year</Label>
                                                <Input
                                                    id="edit-graduation_year"
                                                    type="number"
                                                    value={editForm.graduation_year}
                                                    onChange={(e) => setEditForm((f) => f ? { ...f, graduation_year: e.target.value } : f)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-linkedin_url">LinkedIn URL</Label>
                                                <Input
                                                    id="edit-linkedin_url"
                                                    value={editForm.linkedin_url}
                                                    onChange={(e) => setEditForm((f) => f ? { ...f, linkedin_url: e.target.value } : f)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-website_url">Website URL</Label>
                                                <Input
                                                    id="edit-website_url"
                                                    value={editForm.website_url}
                                                    onChange={(e) => setEditForm((f) => f ? { ...f, website_url: e.target.value } : f)}
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="edit-is_accepting_students"
                                                    checked={editForm.is_accepting_students}
                                                    onChange={(e) => setEditForm((f) => f ? { ...f, is_accepting_students: e.target.checked } : f)}
                                                    className="h-4 w-4 rounded border-border"
                                                />
                                                <Label htmlFor="edit-is_accepting_students" className="cursor-pointer">Accepting students</Label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
                                    <Button type="button" variant="outline" onClick={closeEdit}>Cancel</Button>
                                    <Button type="submit" disabled={editLoading}>
                                        {editLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save'}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Mentor view modal - redesigned */}
                <Dialog open={profileOpen} onOpenChange={(open) => !open && closeProfile()}>
                    <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
                        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
                            <DialogTitle>Hồ sơ Cố vấn</DialogTitle>
                        </DialogHeader>
                        {selectedMentor && (
                            <div className="flex-1 overflow-y-auto px-6 pb-6">
                                <div className="space-y-6 pt-4">
                                    {/* Header card */}
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border">
                                        <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 bg-muted flex items-center justify-center">
                                            {selectedMentor.users.avatar_url ? (
                                                <img src={selectedMentor.users.avatar_url} alt={selectedMentor.users.full_name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-2xl font-bold text-primary">{selectedMentor.users.full_name?.charAt(0) ?? 'M'}</span>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h2 className="text-xl font-semibold text-foreground">{selectedMentor.users.full_name}</h2>
                                            <p className="text-sm text-primary font-medium flex items-center gap-1.5 mt-0.5">
                                                <Briefcase size={14} />
                                                {selectedMentor.current_job_title || 'Mentor'} @ {selectedMentor.current_company || 'Freelance'}
                                            </p>
                                            <span className="inline-block mt-2 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                                {selectedMentor.specialization}
                                            </span>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-muted-foreground">
                                                <a href={`mailto:${selectedMentor.users.email}`} className="flex items-center gap-1 hover:text-foreground">
                                                    <Mail size={14} /> {selectedMentor.users.email}
                                                </a>
                                                {selectedMentor.users.phone_number && (
                                                    <span className="flex items-center gap-1">
                                                        <Phone size={14} /> {selectedMentor.users.phone_number}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex gap-2 mt-2">
                                                {selectedMentor.linkedin_url && (
                                                    <a href={selectedMentor.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                                                        <Linkedin size={18} />
                                                    </a>
                                                )}
                                                {selectedMentor.website_url && (
                                                    <a href={selectedMentor.website_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                                                        <Globe size={18} />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats row */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <div className="rounded-xl border border-border p-3 text-center">
                                            <div className="text-lg font-bold text-foreground">{selectedMentor.years_of_experience ?? 0}</div>
                                            <div className="text-xs text-muted-foreground">Years exp.</div>
                                        </div>
                                        <div className="rounded-xl border border-border p-3 text-center">
                                            <div className="text-lg font-bold text-foreground">{selectedMentor.rating != null ? selectedMentor.rating.toFixed(1) : '-'}</div>
                                            <div className="text-xs text-muted-foreground">Rating</div>
                                        </div>
                                        <div className="rounded-xl border border-border p-3 text-center">
                                            <div className="text-lg font-bold text-foreground">{(selectedMentor.mentor_assignments ?? []).filter((a: { status?: string }) => (a.status ?? 'ACTIVE') === 'ACTIVE').length}/{selectedMentor.max_students ?? '-'}</div>
                                            <div className="text-xs text-muted-foreground">Active</div>
                                        </div>
                                        <div className="rounded-xl border border-border p-3 text-center">
                                            <div className="text-lg font-bold text-primary">{selectedMentor.specialization}</div>
                                            <div className="text-xs text-muted-foreground">Role</div>
                                        </div>
                                    </div>

                                    {/* About */}
                                    <div className="rounded-xl border border-border p-4">
                                        <h3 className="text-sm font-semibold text-foreground mb-2">About</h3>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedMentor.bio || 'No bio yet.'}</p>
                                    </div>

                                    {/* Education */}
                                    <div className="rounded-xl border border-border p-4">
                                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                                            <GraduationCap size={16} className="text-primary" />
                                            Education
                                        </h3>
                                        {selectedMentor.university_name ? (
                                            <div>
                                                <p className="font-medium text-foreground">{selectedMentor.university_name}</p>
                                                <p className="text-sm text-muted-foreground">{selectedMentor.degree} - {selectedMentor.major}</p>
                                                {selectedMentor.graduation_year && (
                                                    <p className="text-xs text-muted-foreground mt-1">Graduated {selectedMentor.graduation_year}</p>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground italic">No education info.</p>
                                        )}
                                    </div>

                                    {/* Achievements */}
                                    {Array.isArray(selectedMentor.outstanding_achievements) && selectedMentor.outstanding_achievements.length > 0 && (
                                        <div className="rounded-xl border border-border p-4">
                                            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                                                <Star size={16} className="text-amber-500" fill="currentColor" />
                                                Achievements
                                            </h3>
                                            <ul className="space-y-2">
                                                {selectedMentor.outstanding_achievements.map((item: any, idx: number) => (
                                                    <li key={idx} className="text-sm text-foreground flex items-start gap-2 py-2 border-b border-border last:border-0">
                                                        <span className="text-amber-500 mt-0.5">•</span>
                                                        <span>{typeof item === 'string' ? item : JSON.stringify(item)}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Assign mentor to students (multiple) */}
                <Dialog open={assignOpen} onOpenChange={(open) => !open && closeAssign()}>
                    <DialogContent className="max-w-md max-h-[90vh] flex flex-col gap-0 p-0">
                        <DialogHeader className="px-6 pt-6 pb-3 border-b border-border">
                            <DialogTitle className="text-lg">
                                {assignMentor?.users.full_name?.trim() || assignMentor?.users.email || 'Mentor'}
                            </DialogTitle>
                            <p className="text-sm text-muted-foreground">
                                {assignMentor?.specialization}
                                {assignMentor && (
                                    <span className="ml-2 font-medium text-foreground">
                                        · {(() => {
                                            const n = (assignMentor.mentor_assignments ?? []).filter(
                                                (a: { status?: string }) => (a.status ?? 'ACTIVE') === 'ACTIVE'
                                            ).length
                                            const max = assignMentor.max_students ?? 0
                                            return `${n}/${max} slots`
                                        })()}
                                    </span>
                                )}
                            </p>
                        </DialogHeader>
                        {assignMessage && (
                            <div className={`mt-3 mx-6 px-3 py-2 rounded-md text-sm ${
                                assignMessage.type === 'success'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                                {assignMessage.text}
                            </div>
                        )}
                        {assignMentor && (() => {
                            const assignedList = (assignMentor.mentor_assignments ?? []).filter(
                                (a: { status?: string }) => (a.status ?? 'ACTIVE') === 'ACTIVE'
                            ).map((a: { student_id: string; students?: { users?: { full_name?: string } } }) => ({
                                student_id: a.student_id,
                                name: a.students?.users?.full_name ?? 'N/A'
                            }))
                            const assignedIds = new Set(assignedList.map((a) => a.student_id))
                            const studentsToAssign = assignStudents.filter((s) => !assignedIds.has(s.id))
                            return (
                        <div className="flex flex-col gap-4 pt-4 pb-6 px-6 overflow-y-auto min-h-0 flex-1">
                            {/* Section: Currently assigned - Unassign */}
                            {assignedList.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-semibold text-foreground">
                                            Currently assigned ({assignedList.length})
                                        </h4>
                                        {unassignStudentIds.size > 0 && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={unassignLoading}
                                                onClick={handleUnassignSubmit}
                                            >
                                                {unassignLoading ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    `Unassign (${unassignStudentIds.size})`
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                    <div className="rounded-lg border border-border bg-muted/20 overflow-hidden">
                                        <ul className="max-h-32 overflow-y-auto divide-y divide-border">
                                            {assignedList.map((a) => (
                                                <li key={a.student_id}>
                                                    <label className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={unassignStudentIds.has(a.student_id)}
                                                            onChange={() => toggleUnassignStudent(a.student_id)}
                                                            className="rounded border-border"
                                                        />
                                                        <span className="text-sm font-medium">{a.name}</span>
                                                    </label>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {/* Section: Assign new students */}
                            <form onSubmit={handleAssignSubmit} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-semibold text-foreground">
                                        Assign premium students
                                    </h4>
                                    <div className="flex gap-1">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-xs"
                                            onClick={() => setAssignStudentIds(new Set(studentsToAssign.map((s) => s.id)))}
                                        >
                                            All
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-xs"
                                            onClick={clearAllAssignStudents}
                                        >
                                            Clear
                                        </Button>
                                    </div>
                                </div>
                                <Input
                                    value={assignSearchInput}
                                    onChange={(e) => setAssignSearchInput(e.target.value)}
                                    placeholder="Search premium students by name or email..."
                                />
                                <div className="rounded-lg border border-border bg-muted/20 overflow-hidden">
                                    {assignStudentsLoading ? (
                                        <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
                                    ) : assignStudents.length === 0 ? (
                                        <div className="p-4 text-center text-sm text-muted-foreground">No premium students found.</div>
                                    ) : studentsToAssign.length === 0 ? (
                                        <div className="p-4 text-center text-sm text-muted-foreground">All students are already assigned.</div>
                                    ) : (
                                        <ul className="max-h-40 overflow-y-auto divide-y divide-border">
                                            {studentsToAssign.map((s) => (
                                                <li key={s.id}>
                                                    <label className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={assignStudentIds.has(s.id)}
                                                            onChange={() => toggleAssignStudent(s.id)}
                                                            className="rounded border-border"
                                                        />
                                                        <div className="min-w-0 flex-1">
                                                            <span className="text-sm font-medium block truncate">{s.name ?? 'N/A'}</span>
                                                            {s.email && (
                                                                <span className="text-xs text-muted-foreground truncate block">{s.email}</span>
                                                            )}
                                                        </div>
                                                    </label>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>
                                        Page {assignStudentsPage}/{assignStudentsTotalPages} · {assignStudentsTotal} premium students
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-7 px-2 text-xs"
                                            disabled={assignStudentsPage <= 1 || assignStudentsLoading}
                                            onClick={() => setAssignStudentsPage((p) => Math.max(1, p - 1))}
                                        >
                                            Prev
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-7 px-2 text-xs"
                                            disabled={assignStudentsPage >= assignStudentsTotalPages || assignStudentsLoading}
                                            onClick={() => setAssignStudentsPage((p) => Math.min(assignStudentsTotalPages, p + 1))}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>

                                {/* Footer actions */}
                                <div className="flex gap-2 justify-end pt-2 border-t border-border shrink-0">
                                    <Button type="button" variant="outline" onClick={closeAssign}>
                                        Close
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={assignLoading || assignStudentIds.size === 0}
                                    >
                                        {assignLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Assigning...
                                            </>
                                        ) : (
                                            `Assign (${assignStudentIds.size})`
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                            )
                        })()}
                    </DialogContent>
                </Dialog>
            </div>
            <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border mt-4">
                Admin © 2025 <span className="text-primary font-heading font-bold">HOLYANN EXPLORE</span>
            </footer>
        </div>
    )
}
