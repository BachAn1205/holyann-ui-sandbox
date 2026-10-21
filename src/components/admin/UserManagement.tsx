"use client"
import { useState, useEffect, useMemo } from 'react'
import { User, UserFormData, UserRole } from '@/types/admin'
import UserTable from './UserTable'
import UserModal from './UserModal'
import DeleteConfirmModal from './DeleteConfirmModal'
import EditSubscriptionModal from './EditSubscriptionModal'
// import AssignMentorForm from './AssignMentorForm'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { UserPlus } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

export default function UserManagement() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [roleFilter, setRoleFilter] = useState<string>('all')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [planFilter, setPlanFilter] = useState<string>('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [pageQuery, setPageQuery] = useState('1')
    const [itemsPerPage] = useState(10)

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [subscriptionModalUser, setSubscriptionModalUser] = useState<User | null>(null)
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [deletingUser, setDeletingUser] = useState<User | null>(null)
    // const [showAssignMentorForm, setShowAssignMentorForm] = useState(false)

    // Students and mentors data
    const [students, setStudents] = useState([])
    const [mentors, setMentors] = useState([])

    // Fetch users
    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/users')
            if (response.ok) {
                const data = await response.json()
                setUsers(data.users || [])
            }
        } catch (error) {
            console.error('Error fetching users:', error)
        } finally {
            setLoading(false)
        }
    }

    // Fetch students and mentors
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [studentsResponse, mentorsResponse] = await Promise.all([
                    fetch('/api/admin/students?page=1&pageSize=500'),
                    fetch('/api/admin/mentors')
                ])

                if (studentsResponse.ok && mentorsResponse.ok) {
                    const studentsData = await studentsResponse.json()
                    const mentorsData = await mentorsResponse.json()

                    setStudents(studentsData.students || [])
                    setMentors(mentorsData.mentors || [])
                } else {
                    const studentsError = !studentsResponse.ok ? `Students API: ${studentsResponse.status} ${studentsResponse.statusText}` : ''
                    const mentorsError = !mentorsResponse.ok ? `Mentors API: ${mentorsResponse.status} ${mentorsResponse.statusText}` : ''
                    console.error('Failed to fetch students or mentors:', studentsError, mentorsError)
                    
                    // Try to get error details
                    if (!studentsResponse.ok) {
                        try {
                            const errorData = await studentsResponse.json()
                            console.error('Students API error details:', errorData)
                        } catch (e) {
                            console.error('Could not parse students error response')
                        }
                    }
                    if (!mentorsResponse.ok) {
                        try {
                            const errorData = await mentorsResponse.json()
                            console.error('Mentors API error details:', errorData)
                        } catch (e) {
                            console.error('Could not parse mentors error response')
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching students/mentors data:', error)
                // Set empty arrays as fallback
                setStudents([])
                setMentors([])
            }
        }

        fetchData()
    }, [])

    // Filter users
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesRole = roleFilter === 'all' || user.role === roleFilter.toUpperCase()
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' ? user.is_active : !user.is_active)
        const userPlan = (user.subscriptionPlan ?? 'FREE').toUpperCase()
        const matchesPlan = planFilter === 'all' ||
            (user.role === 'STUDENT' && userPlan === planFilter.toUpperCase())

        return matchesSearch && matchesRole && matchesStatus && matchesPlan
    })

    // Pagination (aligned with /admin/students: ellipsis window, jump to page, clamp on filter)
    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage))
    const safeCurrentPage = Math.min(currentPage, totalPages)
    const indexOfFirstItem = (safeCurrentPage - 1) * itemsPerPage
    const indexOfLastItem = indexOfFirstItem + itemsPerPage
    const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem)

    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, roleFilter, statusFilter, planFilter])

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

    // Handlers
    const handleAddUser = () => {
        setEditingUser(null)
        setIsModalOpen(true)
    }

    const handleEditUser = (user: User) => {
        setEditingUser(user)
        setIsModalOpen(true)
    }

    const handleDeleteClick = (user: User) => {
        setDeletingUser(user)
        setIsDeleteModalOpen(true)
    }

    const handleSaveUser = async (userData: UserFormData) => {
        try {
            const url = editingUser
                ? `/api/admin/users/${editingUser.id}`
                : '/api/admin/users'

            const method = editingUser ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            })

            if (response.ok) {
                await fetchUsers()
                setIsModalOpen(false)
                setEditingUser(null)
            } else {
                // Check if response has content before parsing JSON
                const contentType = response.headers.get('content-type')
                if (contentType && contentType.includes('application/json')) {
                    const error = await response.json()
                    alert(error.message || 'Có lỗi xảy ra')
                } else {
                    alert('Có lỗi xảy ra khi lưu người dùng')
                }
            }
        } catch (error) {
            console.error('Error saving user:', error)
            alert('Có lỗi xảy ra khi lưu người dùng')
        }
    }

    const handleConfirmDelete = async () => {
        if (!deletingUser) return

        try {
            const response = await fetch(`/api/admin/users/${deletingUser.id}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                await fetchUsers()
                setIsDeleteModalOpen(false)
                setDeletingUser(null)
            } else {
                const contentType = response.headers.get('content-type')
                if (contentType && contentType.includes('application/json')) {
                    const error = await response.json()
                    alert(error.message || 'Có lỗi xảy ra')
                } else {
                    alert('Có lỗi xảy ra khi xóa người dùng')
                }
            }
        } catch (error) {
            console.error('Error deleting user:', error)
            alert('Có lỗi xảy ra khi xóa người dùng')
        }
    }

    const handleSubscriptionSave = async (
        user: User,
        plan: string,
        startDate: Date | null,
        endDate: Date | null
    ) => {
        try {
            const body: { plan: string; subscriptionStart?: string; subscriptionEnd?: string } = { plan }
            if (plan !== 'FREE' && startDate) body.subscriptionStart = startDate.toISOString()
            if (plan !== 'FREE' && endDate) body.subscriptionEnd = endDate.toISOString()
            const response = await fetch(`/api/admin/users/${user.id}/subscription`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (response.ok) {
                await fetchUsers()
            } else {
                const data = await response.json().catch(() => ({}))
                alert(data?.message || 'Không thể đổi gói')
            }
        } catch (error) {
            console.error('Error updating subscription:', error)
            alert('Có lỗi khi đổi gói')
        }
    }

    const handleRoleChange = async (user: User, newRole: UserRole) => {
        try {
            const response = await fetch(`/api/admin/users/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: user.full_name,
                    phone_number: user.phone_number,
                    role: newRole,
                    is_active: user.is_active
                })
            })

            if (response.ok) {
                await fetchUsers()
            } else {
                const contentType = response.headers.get('content-type')
                if (contentType && contentType.includes('application/json')) {
                    const error = await response.json()
                    alert(error.message || 'Có lỗi xảy ra')
                } else {
                    alert('Có lỗi xảy ra khi cập nhật vai trò')
                }
            }
        } catch (error) {
            console.error('Error updating role:', error)
            alert('Có lỗi xảy ra khi cập nhật vai trò')
        }
    }

    // Stats
    const stats = {
        total: users.length,
        active: users.filter(u => u.is_active).length,
        students: users.filter(u => u.role === 'STUDENT').length,
        mentors: users.filter(u => u.role === 'MENTOR').length,
        marketing: users.filter(u => u.role === 'MARKETING').length,
        admins: users.filter(u => u.role === 'ADMIN').length,
    }

    return (
        <div className="space-y-6">
            {/* Header - same as admin dashboard */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-xl font-semibold text-foreground">Người dùng</h1>
                <Button size="sm" className="shrink-0" onClick={handleAddUser}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Thêm người dùng
                </Button>
            </div>

            {/* Stats cards - same style as admin dashboard */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                <div className="rounded-xl border border-border p-4 bg-card">
                    <p className="text-sm text-muted-foreground">Tổng</p>
                    <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                </div>
                <div className="rounded-xl border border-border p-4 bg-card">
                    <p className="text-sm text-muted-foreground">Hoạt động</p>
                    <p className="text-2xl font-bold text-foreground">{stats.active}</p>
                </div>
                <div className="rounded-xl border border-border p-4 bg-card">
                    <p className="text-sm text-muted-foreground">Học viên</p>
                    <p className="text-2xl font-bold text-foreground">{stats.students}</p>
                </div>
                <div className="rounded-xl border border-border p-4 bg-card">
                    <p className="text-sm text-muted-foreground">Cố vấn</p>
                    <p className="text-2xl font-bold text-foreground">{stats.mentors}</p>
                </div>
                <div className="rounded-xl border border-border p-4 bg-card">
                    <p className="text-sm text-muted-foreground">Admin</p>
                    <p className="text-2xl font-bold text-foreground">{stats.admins}</p>
                </div>
                <div className="rounded-xl border border-border p-4 bg-card">
                    <p className="text-sm text-muted-foreground">Marketing</p>
                    <p className="text-2xl font-bold text-foreground">{stats.marketing}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="rounded-xl border border-border p-4 bg-card">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="sm:col-span-2 lg:col-span-1">
                        <input
                            type="text"
                            placeholder="Tìm theo tên hoặc email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                    </div>
                    <div>
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="Tất cả vai trò" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả vai trò</SelectItem>
                                <SelectItem value="student">Học viên</SelectItem>
                                <SelectItem value="mentor">Cố vấn</SelectItem>
                                <SelectItem value="marketing">Marketing</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="Tất cả trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                <SelectItem value="active">Hoạt động</SelectItem>
                                <SelectItem value="inactive">Không hoạt động</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Select value={planFilter} onValueChange={setPlanFilter}>
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="Tất cả gói" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả gói</SelectItem>
                                <SelectItem value="FREE">Free</SelectItem>
                                <SelectItem value="PLUS">Plus</SelectItem>
                                <SelectItem value="PREMIUM">Premium</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Table - same card style as dashboard */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <UserTable
                    users={currentUsers}
                    loading={loading}
                    onEdit={handleEditUser}
                    onDelete={handleDeleteClick}
                    onEditSubscription={(user) => setSubscriptionModalUser(user)}
                    onRoleChange={handleRoleChange}
                />

                {/* Pagination — same behavior as /admin/students (windowed pages + jump) */}
                {!loading && filteredUsers.length > 0 && (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-t border-border bg-muted/30">
                        <div className="text-sm text-muted-foreground">
                            Hiển thị {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredUsers.length)} / {filteredUsers.length}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={safeCurrentPage === 1}
                            >
                                Trước
                            </Button>
                            {visiblePages.map((page, index) => {
                                const prev = visiblePages[index - 1]
                                const showGap = index > 0 && prev != null && page - prev > 1
                                return (
                                    <div key={page} className="flex items-center gap-2">
                                        {showGap && (
                                            <span className="px-1.5 py-1.5 text-sm text-muted-foreground">...</span>
                                        )}
                                        <Button
                                            type="button"
                                            variant={safeCurrentPage === page ? 'default' : 'outline'}
                                            size="sm"
                                            className="min-w-8"
                                            onClick={() => setCurrentPage(page)}
                                        >
                                            {page}
                                        </Button>
                                    </div>
                                )
                            })}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={safeCurrentPage === totalPages}
                            >
                                Sau
                            </Button>
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
                                    aria-label="Chuyển tới trang"
                                />
                                <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={jumpToPage}>
                                    Đi
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            <UserModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false)
                    setEditingUser(null)
                }}
                onSave={handleSaveUser}
                user={editingUser}
            />

            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false)
                    setDeletingUser(null)
                }}
                onConfirm={handleConfirmDelete}
                userName={deletingUser?.full_name || ''}
            />

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

            {/* Assign mentor - commented out
            {showAssignMentorForm && (
                <Dialog open={showAssignMentorForm} onOpenChange={setShowAssignMentorForm}>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Gán Mentor cho Học viên</DialogTitle>
                        </DialogHeader>
                        <AssignMentorForm students={students} mentors={mentors} />
                    </DialogContent>
                </Dialog>
            )} */}
        </div>
    )
}
