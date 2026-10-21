import { User, UserRole } from '@/types/admin'
import { Button } from '@/components/ui/button'
import UserAvatar from '@/components/ui/UserAvatar'
import { Pencil } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

interface UserTableProps {
    users: User[]
    loading: boolean
    onEdit: (user: User) => void
    onDelete: (user: User) => void
    onEditSubscription: (user: User) => void
    onRoleChange: (user: User, newRole: UserRole) => void
}

export default function UserTable({ users, loading, onEdit, onDelete, onEditSubscription, onRoleChange }: UserTableProps) {
    const getRoleBadge = (role: string) => {
        const badges = {
            STUDENT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            MENTOR: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
            ADMIN: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            MARKETING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        }
        return badges[role as keyof typeof badges] || badges.STUDENT
    }

    const getRoleLabel = (role: string) => {
        const labels = {
            STUDENT: 'Học viên',
            MENTOR: 'Mentor',
            ADMIN: 'Admin',
            MARKETING: 'Marketing',
        }
        return labels[role as keyof typeof labels] || role
    }

    const getPlanLabel = (plan: string | null | undefined) => {
        const labels: Record<string, string> = {
            FREE: 'Free',
            PLUS: 'Plus',
            PREMIUM: 'Premium',
        }
        return labels[(plan ?? 'FREE').toUpperCase()] ?? 'Free'
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
                    <p className="text-muted-foreground">Đang tải dữ liệu...</p>
                </div>
            </div>
        )
    }

    if (users.length === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <i className="fas fa-users text-6xl text-muted-foreground/30 mb-4"></i>
                    <p className="text-muted-foreground">Không tìm thấy người dùng nào</p>
                </div>
            </div>
        )
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Người dùng</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground hidden md:table-cell">Email</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Vai trò</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Gói</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                            <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                    <UserAvatar
                                        src={user.avatar_url}
                                        name={user.full_name}
                                        role={user.role}
                                        size="md"
                                        showInitials={true}
                                    />
                                    <div>
                                        <div className="font-semibold text-foreground">{user.full_name}</div>
                                        <div className="text-xs text-muted-foreground md:hidden">{user.email}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground hidden md:table-cell">{user.email}</td>
                            <td className="py-3 px-4">
                                <Select
                                    value={user.role}
                                    onValueChange={(value) => onRoleChange(user, value as UserRole)}
                                >
                                    <SelectTrigger className={`h-7 w-28 text-xs font-semibold rounded-full border-none shadow-none focus:ring-0 cursor-pointer hover:opacity-80 transition-opacity ${getRoleBadge(user.role)}`}>
                                        <SelectValue>{getRoleLabel(user.role)}</SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="STUDENT">Học viên</SelectItem>
                                        <SelectItem value="MENTOR">Mentor</SelectItem>
                                        <SelectItem value="ADMIN">Admin</SelectItem>
                                        <SelectItem value="MARKETING">Marketing</SelectItem>
                                    </SelectContent>
                                </Select>
                            </td>
                            <td className="py-3 px-4 text-sm text-foreground">
                                {user.role === 'STUDENT' ? getPlanLabel(user.subscriptionPlan) : <span className="text-muted-foreground">:</span>}
                            </td>
                            <td className="py-3 px-4">
                                <div className="flex items-center justify-end gap-2">
                                    {user.role === 'STUDENT' && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-8 gap-1.5 text-xs font-medium"
                                            onClick={() => onEditSubscription(user)}
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                            Chỉnh sửa gói
                                        </Button>
                                    )}
                                    <button onClick={() => onEdit(user)} className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Sửa">
                                        <i className="fas fa-edit"></i>
                                    </button>
                                    <button onClick={() => onDelete(user)} className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Xóa">
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}