"use client"
import { useState, useEffect, useMemo } from 'react'
import UserAvatar from '@/components/ui/UserAvatar'
import { Button } from '@/components/ui/button'
import EditSubscriptionModal from './EditSubscriptionModal'
import type { User } from '@/types/admin'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, Mail, Phone, GraduationCap, Target, Building2, Pencil } from 'lucide-react'

interface Student {
  id: string
  name: string | null
  email: string | null
  isActive: boolean | null
  avatarUrl: string | null
  createdAt: string | Date | null
  subscriptionPlan?: string | null
  subscriptionStart?: string | Date | null
  subscriptionEnd?: string | Date | null
}

interface StudentsResponse {
  students: Student[]
  count: number
}

interface StudentDetailData {
  id: string
  full_name: string | null
  email: string | null
  phone_number: string | null
  avatar_url: string | null
  is_active: boolean | null
  created_at: string | Date | null
  subscription_plan?: string | null
  subscription_start?: string | Date | null
  subscription_end?: string | Date | null
  students: {
    current_school: string | null
    current_grade: string | null
    current_address: string | null
    date_of_birth: string | Date | null
    talents: string | null
    hobbies: string | null
    target_faculty_name: string | null
    target_university_name: string | null
    yearly_budget: number | null
    yearly_budget_currency: string | null
    personal_desire: string | null
    assessments_completed: boolean | null
  } | null
  student_applications: Array<{
    id: string
    category: string
    status: string
    personal_notes: string | null
    universities: { id: number; name: string; country: string | null; current_ranking: number | null } | null
  }>
}

function planLabel(p?: string | null) {
  const labels: Record<string, string> = { FREE: 'Free', PLUS: 'Plus', PREMIUM: 'Premium' }
  return labels[(p ?? 'FREE').toUpperCase()] ?? 'Free'
}

function studentRowToUser(s: Student): User {
  return {
    id: s.id,
    full_name: s.name ?? 'Học viên',
    email: s.email ?? '',
    phone_number: null,
    role: 'STUDENT',
    is_active: s.isActive ?? true,
    avatar_url: s.avatarUrl,
    created_at: (s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt) ?? new Date().toISOString(),
    subscriptionPlan: s.subscriptionPlan ?? 'FREE',
    subscriptionStart: s.subscriptionStart ?? undefined,
    subscriptionEnd: s.subscriptionEnd ?? undefined,
  }
}

function detailDataToUser(d: StudentDetailData): User {
  return {
    id: d.id,
    full_name: d.full_name ?? 'Học viên',
    email: d.email ?? '',
    phone_number: d.phone_number,
    role: 'STUDENT',
    is_active: d.is_active ?? true,
    avatar_url: d.avatar_url,
    created_at: (d.created_at instanceof Date ? d.created_at.toISOString() : d.created_at) ?? new Date().toISOString(),
    subscriptionPlan: d.subscription_plan ?? 'FREE',
    subscriptionStart: d.subscription_start ?? undefined,
    subscriptionEnd: d.subscription_end ?? undefined,
  }
}

export default function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageQuery, setPageQuery] = useState('1')
  const itemsPerPage = 10
  const [viewOpen, setViewOpen] = useState(false)
  const [viewStudentId, setViewStudentId] = useState<string | null>(null)
  const [viewDetail, setViewDetail] = useState<StudentDetailData | null>(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [viewError, setViewError] = useState<string | null>(null)
  const [subscriptionModalUser, setSubscriptionModalUser] = useState<User | null>(null)

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const response = await fetch('/api/admin/students?page=1&pageSize=500', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })

      if (!response.ok) {
        setError(`Server error: ${response.status}`)
        return
      }

      const result: StudentsResponse = await response.json()
      setStudents(result.students || [])
    } catch (err) {
      setError('Could not load students')
      console.error('Error fetching students:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filteredStudents = students.filter(student =>
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / itemsPerPage))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const indexOfFirstItem = (safeCurrentPage - 1) * itemsPerPage
  const indexOfLastItem = indexOfFirstItem + itemsPerPage
  const paginatedStudents = filteredStudents.slice(indexOfFirstItem, indexOfLastItem)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
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

  const formatDate = (date: string | Date | null) => {
    if (!date) return 'N/A'
    try {
      const d = new Date(date)
      if (isNaN(d.getTime())) return 'Invalid Date'
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch (error) {
      return 'Invalid Date'
    }
  }

  const handleSubscriptionSave = async (
    user: User,
    plan: string,
    startDate: Date | null,
    endDate: Date | null
  ) => {
    const body: { plan: string; subscriptionStart?: string; subscriptionEnd?: string } = { plan }
    if (plan !== 'FREE' && startDate) body.subscriptionStart = startDate.toISOString()
    if (plan !== 'FREE' && endDate) body.subscriptionEnd = endDate.toISOString()
    const response = await fetch(`/api/admin/users/${user.id}/subscription`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    })
    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      alert((data as { message?: string })?.message || 'Could not update subscription')
      return
    }
    await fetchStudents(true)
    if (viewOpen && viewStudentId === user.id) {
      setViewLoading(true)
      setViewError(null)
      try {
        const res = await fetch(`/api/admin/students/${user.id}`, { credentials: 'include' })
        const json = await res.json()
        if (json.success && json.data) setViewDetail(json.data)
        else setViewError(json.error || 'Failed to load')
      } catch {
        setViewError('Failed to load')
      } finally {
        setViewLoading(false)
      }
    }
  }

  const openView = (studentId: string) => {
    setViewStudentId(studentId)
    setViewDetail(null)
    setViewError(null)
    setViewOpen(true)
  }
  const closeView = () => {
    setViewOpen(false)
    setViewStudentId(null)
    setViewDetail(null)
    setViewError(null)
  }

  useEffect(() => {
    if (!viewOpen || !viewStudentId) return
    setViewLoading(true)
    setViewError(null)
    fetch(`/api/admin/students/${viewStudentId}`, { credentials: 'include' })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) setViewDetail(json.data)
        else setViewError(json.error || 'Failed to load')
      })
      .catch(() => setViewError('Failed to load'))
      .finally(() => setViewLoading(false))
  }, [viewOpen, viewStudentId])

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto min-h-[300px] flex flex-col">
        <div className="flex-1 p-6 md:p-8 space-y-6">
          <h1 className="text-xl font-semibold text-foreground">Students</h1>
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Student</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground hidden md:table-cell">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground hidden sm:table-cell">Plan</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground hidden lg:table-cell">Joined</th>
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
                      <td className="py-3 px-4 hidden md:table-cell">
                        <div className="h-3 w-44 rounded bg-muted animate-pulse" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="h-6 w-20 rounded-full bg-muted animate-pulse" />
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell">
                        <div className="h-3 w-14 rounded bg-muted animate-pulse" />
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="ml-auto h-7 w-16 rounded bg-muted animate-pulse" />
                      </td>
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

  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto min-h-[300px] flex flex-col">
        <div className="flex-1 p-6 md:p-8 space-y-6">
          <h1 className="text-xl font-semibold text-foreground">Students</h1>
          <div className="text-center py-8">
            <div className="text-destructive mb-4">
              <i className="fas fa-exclamation-triangle text-3xl" />
            </div>
            <p className="text-destructive mb-4">{error}</p>
            <button
              onClick={() => fetchStudents(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <i className="fas fa-refresh mr-2" />
              Retry
            </button>
          </div>
        </div>
        <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border mt-4">
          Admin © 2025 <span className="text-primary font-heading font-bold">HOLYANN EXPLORE</span>
        </footer>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto min-h-[300px] flex flex-col">
      <div className="flex-1 p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-xl font-semibold text-foreground">Students</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {students.length} student{students.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => fetchStudents(true)}
              disabled={refreshing}
              className="text-sm text-primary hover:underline flex items-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {refreshing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <i className="fas fa-refresh text-xs" />
              )}
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="relative max-w-md">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {filteredStudents.length === 0 ? (
          <div className="text-center py-12 border border-border rounded-xl bg-muted/20">
            <div className="text-muted-foreground mb-4">
              <i className="fas fa-user-graduate text-4xl" />
            </div>
            <p className="text-muted-foreground">
              {searchTerm ? 'No students match your search' : 'No students yet'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-4 text-primary hover:underline text-sm"
              >
                Clear filter
              </button>
            )}
          </div>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Student</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground hidden md:table-cell">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground hidden sm:table-cell">Plan</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground hidden lg:table-cell">Joined</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => openView(student.id)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            src={student.avatarUrl}
                            name={student.name}
                            role="STUDENT"
                            size="md"
                            showInitials={true}
                          />
                          <div>
                            <div className="font-semibold text-foreground">
                              {student.name || 'N/A'}
                            </div>
                            <div className="text-xs text-muted-foreground md:hidden">
                              {student.email || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground hidden md:table-cell">
                        {student.email || 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          student.isActive
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {student.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground hidden sm:table-cell">
                        {planLabel(student.subscriptionPlan)}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground hidden lg:table-cell">
                        {formatDate(student.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1 text-xs"
                            title="Edit subscription"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSubscriptionModalUser(studentRowToUser(student))
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Plan
                          </Button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              openView(student.id)
                            }}
                            className="text-primary hover:text-primary/80 px-2 py-1 rounded transition-colors inline-flex items-center gap-1.5 text-sm"
                            title="View details"
                          >
                            <i className="fas fa-eye" />
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredStudents.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
                <div className="text-sm text-muted-foreground">
                  Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredStudents.length)} / {filteredStudents.length}
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
          </div>
        )}

        {/* Student view modal */}
        <Dialog open={viewOpen} onOpenChange={(open) => !open && closeView()}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
              <DialogTitle>Student details</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {viewLoading && (
                <div className="py-12 flex items-center justify-center gap-3 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  Loading…
                </div>
              )}
              {viewError && !viewLoading && (
                <div className="py-8 text-center">
                  <p className="text-destructive mb-4">{viewError}</p>
                  <button
                    onClick={() => {
                      if (!viewStudentId) return
                      setViewLoading(true)
                      setViewError(null)
                      fetch(`/api/admin/students/${viewStudentId}`, { credentials: 'include' })
                        .then((r) => r.json())
                        .then((j) => {
                          if (j.success && j.data) {
                            setViewDetail(j.data)
                            setViewError(null)
                          } else setViewError(j.error || 'Failed to load')
                        })
                        .catch(() => setViewError('Failed to load'))
                        .finally(() => setViewLoading(false))
                    }}
                    className="text-sm text-primary hover:underline"
                  >
                    Retry
                  </button>
                </div>
              )}
              {viewDetail && !viewLoading && (
                <div className="space-y-6 pt-2">
                  {/* Header card */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border">
                    <UserAvatar
                      src={viewDetail.avatar_url}
                      name={viewDetail.full_name}
                      role="STUDENT"
                      size="xl"
                      showInitials={true}
                      className="shrink-0"
                    />
                    <div className="min-w-0">
                      <h2 className="text-xl font-semibold text-foreground">{viewDetail.full_name ?? 'N/A'}</h2>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail size={14} />
                          {viewDetail.email ?? '–'}
                        </span>
                        {viewDetail.phone_number && (
                          <span className="flex items-center gap-1">
                            <Phone size={14} />
                            {viewDetail.phone_number}
                          </span>
                        )}
                      </div>
                      <div className="mt-2">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                          viewDetail.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {viewDetail.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="ml-2 text-xs text-muted-foreground">Joined {formatDate(viewDetail.created_at)}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-muted-foreground">Subscription:</span>
                        <span className="text-sm font-medium text-foreground">{planLabel(viewDetail.subscription_plan)}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1 text-xs"
                          onClick={() => setSubscriptionModalUser(detailDataToUser(viewDetail))}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit plan
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Education & goals grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-border p-4">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                        <GraduationCap size={16} className="text-primary" />
                        Education
                      </h3>
                      <dl className="space-y-2 text-sm">
                        <div>
                          <dt className="text-muted-foreground">School</dt>
                          <dd className="text-foreground">{viewDetail.students?.current_school ?? '–'}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Grade</dt>
                          <dd className="text-foreground">{viewDetail.students?.current_grade ?? '–'}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Address</dt>
                          <dd className="text-foreground">{viewDetail.students?.current_address ?? '–'}</dd>
                        </div>
                      </dl>
                    </div>
                    <div className="rounded-xl border border-border p-4">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                        <Target size={16} className="text-primary" />
                        Goals
                      </h3>
                      <dl className="space-y-2 text-sm">
                        <div>
                          <dt className="text-muted-foreground">Major</dt>
                          <dd className="text-foreground">{viewDetail.students?.target_faculty_name && viewDetail.students?.target_university_name ? `${viewDetail.students.target_faculty_name} @ ${viewDetail.students.target_university_name}` : '–'}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Target country</dt>
                          <dd className="text-foreground">{viewDetail.students?.target_university_name ?? '–'}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Budget (yearly)</dt>
                          <dd className="text-foreground">
                            {viewDetail.students?.yearly_budget != null
                              ? `${Number(viewDetail.students.yearly_budget).toLocaleString('vi-VN')} ${viewDetail.students.yearly_budget_currency || 'USD'}`
                              : '–'}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  {/* Optional: talents, hobbies, desire */}
                  {(viewDetail.students?.talents || viewDetail.students?.hobbies || viewDetail.students?.personal_desire) && (
                    <div className="rounded-xl border border-border p-4 space-y-3">
                      {viewDetail.students?.talents && (
                        <div>
                          <h3 className="text-sm font-semibold text-foreground mb-1">Talents</h3>
                          <p className="text-sm text-muted-foreground">{viewDetail.students.talents}</p>
                        </div>
                      )}
                      {viewDetail.students?.hobbies && (
                        <div>
                          <h3 className="text-sm font-semibold text-foreground mb-1">Hobbies</h3>
                          <p className="text-sm text-muted-foreground">{viewDetail.students.hobbies}</p>
                        </div>
                      )}
                      {viewDetail.students?.personal_desire && (
                        <div>
                          <h3 className="text-sm font-semibold text-foreground mb-1">Personal statement</h3>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{viewDetail.students.personal_desire}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Assessments */}
                  <div className="rounded-xl border border-border p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-2">Assessments</h3>
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                      viewDetail.students?.assessments_completed ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {viewDetail.students?.assessments_completed ? 'Completed' : 'Not completed'}
                    </span>
                  </div>

                  {/* Applications */}
                  {viewDetail.student_applications && viewDetail.student_applications.length > 0 && (
                    <div className="rounded-xl border border-border overflow-hidden">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 p-4 border-b border-border">
                        <Building2 size={16} className="text-primary" />
                        Applications ({viewDetail.student_applications.length})
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border bg-muted/30">
                              <th className="text-left py-2 px-3 font-medium text-muted-foreground">University</th>
                              <th className="text-left py-2 px-3 font-medium text-muted-foreground">Country</th>
                              <th className="text-left py-2 px-3 font-medium text-muted-foreground">Rank</th>
                              <th className="text-left py-2 px-3 font-medium text-muted-foreground">Category</th>
                              <th className="text-left py-2 px-3 font-medium text-muted-foreground">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {viewDetail.student_applications.map((app) => (
                              <tr key={app.id} className="border-b border-border last:border-0">
                                <td className="py-2 px-3 text-foreground">{app.universities?.name ?? '–'}</td>
                                <td className="py-2 px-3 text-muted-foreground">{app.universities?.country ?? '–'}</td>
                                <td className="py-2 px-3 text-muted-foreground">{app.universities?.current_ranking ? `#${app.universities.current_ranking}` : '–'}</td>
                                <td className="py-2 px-3">{app.category}</td>
                                <td className="py-2 px-3">{app.status}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <EditSubscriptionModal
          isOpen={!!subscriptionModalUser}
          onClose={() => setSubscriptionModalUser(null)}
          user={subscriptionModalUser}
          onSave={async (plan, startDate, endDate) => {
            if (subscriptionModalUser) {
              await handleSubscriptionSave(subscriptionModalUser, plan, startDate, endDate)
            }
          }}
        />
      </div>
      <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border mt-4">
        Admin © 2025 <span className="text-primary font-heading font-bold">HOLYANN EXPLORE</span>
      </footer>
    </div>
  )
}
