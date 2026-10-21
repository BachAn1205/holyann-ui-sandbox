"use client"
import { useState, useEffect } from 'react'

interface RecentUser {
  id: string
  full_name: string | null
  email: string | null
  role: string
  created_at: string | Date | null
  is_active: boolean | null
}

interface ApiResponse {
  success: boolean
  data?: RecentUser[]
  error?: string
}

export default function RecentUsersTable() {
  const [users, setUsers] = useState<RecentUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      fetchRecentUsers()
    }
  }, [mounted])

  const fetchRecentUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/admin/recent-users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })

      if (!response.ok) {
        if (response.status === 401) {
          setError('Please sign in to view this')
        } else if (response.status === 403) {
          setError('You do not have access')
        } else {
          setError(`Server error: ${response.status}`)
        }
        return
      }

      const result: ApiResponse = await response.json()

      if (result.success && result.data) {
        setUsers(result.data)
      } else {
        setError(result.error || 'Unknown error')
      }
    } catch (err) {
      setError('Could not connect to server')
      console.error('Error fetching recent users:', err)
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadge = (role: string) => {
    const badges = {
      STUDENT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      MENTOR: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      ADMIN: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      MARKETING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      user: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      mentor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    }
    return badges[role as keyof typeof badges] || badges.STUDENT
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      STUDENT: 'Student',
      MENTOR: 'Mentor',
      ADMIN: 'Admin',
      MARKETING: 'Marketing',
      user: 'Student',
      mentor: 'Mentor',
      admin: 'Admin',
    }
    return labels[role] ?? 'User'
  }

  const formatDate = (date: string | Date | null) => {
    if (!date) return 'N/A'
    try {
      const d = new Date(date)
      if (isNaN(d.getTime())) return 'Invalid Date'
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'Asia/Ho_Chi_Minh'
      })
    } catch (error) {
      return 'Invalid Date'
    }
  }

  const formatDateTime = (date: string | Date | null) => {
    if (!date) return 'N/A'
    try {
      const d = new Date(date)
      if (isNaN(d.getTime())) return 'Invalid Date'
      return d.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Ho_Chi_Minh'
      })
    } catch (error) {
      return 'Invalid Date'
    }
  }

  const title = 'Recent users (last 5 days)'

  if (!mounted) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-48 mb-2"></div>
            <div className="h-4 bg-muted rounded w-32"></div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <span className="ml-2 text-muted-foreground">Loading…</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
        </div>
        <div className="text-center py-8">
          <div className="text-destructive mb-2">
            <i className="fas fa-exclamation-triangle text-2xl" />
          </div>
          <p className="text-destructive text-sm">{error}</p>
          <button
            onClick={fetchRecentUsers}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {users.length} user{users.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={fetchRecentUsers}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            <i className="fas fa-refresh text-xs" />
            Refresh
          </button>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-8 border border-border rounded-lg bg-muted/30">
          <div className="text-muted-foreground mb-2">
            <i className="fas fa-users text-2xl" />
          </div>
          <p className="text-muted-foreground text-sm">No new users in the last 5 days</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground hidden md:table-cell">Email</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Role</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground hidden lg:table-cell">Created</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Status</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <i className="fas fa-user text-primary text-sm"></i>
                      </div>
                      <span className="font-semibold text-foreground">{user.full_name || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground hidden md:table-cell">
                    {user.email || 'N/A'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRoleBadge(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground hidden lg:table-cell">
                    <div className="flex flex-col">
                      <span>{formatDate(user.created_at)}</span>
                      <span className="text-xs text-muted-foreground/70">
                        {formatDateTime(user.created_at)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      user.is_active 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      className="text-primary hover:text-primary/80 mx-1"
                      title="Edit user"
                    >
                      <i className="fas fa-edit" />
                    </button>
                    <button
                      className="text-red-500 hover:text-red-600 mx-1"
                      title="Delete user"
                    >
                      <i className="fas fa-trash" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}