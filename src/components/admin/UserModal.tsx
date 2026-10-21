'use client'

import { useState, useEffect } from 'react'
import { User, UserFormData, MentorType } from '@/types/admin'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface UserModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (data: UserFormData) => void | Promise<void>
    user: User | null
    apiError?: string | null
}

export default function UserModal({ isOpen, onClose, onSave, user, apiError }: UserModalProps) {
    const [formData, setFormData] = useState<UserFormData>({
        full_name: '',
        email: '',
        phone_number: '',
        role: 'STUDENT',
        is_active: true,
        password: '',
        mentor_type: undefined,
    })
    const [errors, setErrors] = useState<Record<string, string>>({})

    useEffect(() => {
        if (user) {
            setFormData({
                full_name: user.full_name,
                email: user.email,
                phone_number: user.phone_number || '',
                role: user.role,
                is_active: user.is_active,
                password: '',
                mentor_type: undefined,
            })
        } else {
            setFormData({
                full_name: '',
                email: '',
                phone_number: '',
                role: 'STUDENT',
                is_active: true,
                password: '',
                mentor_type: undefined,
            })
        }
        setErrors({})
    }, [user, isOpen])

    const validate = () => {
        const newErrors: Record<string, string> = {}
        if (!formData.full_name.trim()) newErrors.full_name = 'Name is required'
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email'
        }
        if (!user && !formData.password) {
            newErrors.password = 'Password is required'
        } else if (!user && formData.password && formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters'
        }
        if (formData.role === 'MENTOR' && !formData.mentor_type) {
            newErrors.mentor_type = 'Kiểu Cố vấn is required'
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const [saving, setSaving] = useState(false)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validate()) return
        setSaving(true)
        try {
            await Promise.resolve(onSave(formData))
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md flex flex-col gap-0 p-0">
                <div className="shrink-0 px-6 pt-6 pb-2 pr-10 border-b border-border">
                    <DialogHeader>
                        <DialogTitle>{user ? 'Edit user' : 'Create user'}</DialogTitle>
                    </DialogHeader>
                </div>
                <div className="px-6 py-4">
                {apiError && (
                    <div className="rounded-lg bg-destructive/10 text-destructive text-sm p-3 mb-4">
                        {apiError}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                            Full name <span className="text-destructive">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary ${errors.full_name ? 'border-destructive' : 'border-border'}`}
                            placeholder="Full name"
                        />
                        {errors.full_name && (
                            <p className="text-destructive text-xs mt-1">{errors.full_name}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                            Email <span className="text-destructive">*</span>
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-60 ${errors.email ? 'border-destructive' : 'border-border'}`}
                            placeholder="email@example.com"
                            disabled={!!user}
                        />
                        {errors.email && (
                            <p className="text-destructive text-xs mt-1">{errors.email}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Phone</label>
                        <input
                            type="tel"
                            value={formData.phone_number}
                            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                            placeholder="Phone number"
                        />
                    </div>
                    {!user && (
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                Password <span className="text-destructive">*</span>
                            </label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary ${errors.password ? 'border-destructive' : 'border-border'}`}
                                placeholder="Min. 6 characters"
                            />
                            {errors.password && (
                                <p className="text-destructive text-xs mt-1">{errors.password}</p>
                            )}
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Role</label>
                        <select
                            value={formData.role}
                            onChange={(e) => {
                                const newRole = e.target.value as User['role'];
                                setFormData({
                                    ...formData,
                                    role: newRole,
                                    mentor_type: newRole === 'MENTOR' ? formData.mentor_type : undefined,
                                });
                            }}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                        >
                            <option value="STUDENT">Student</option>
                            <option value="MENTOR">Cố vấn</option>
                            <option value="MARKETING">Marketing</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>
                    {formData.role === 'MENTOR' && (
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                Mentor Type <span className="text-destructive">*</span>
                            </label>
                            <select
                                value={formData.mentor_type || ''}
                                onChange={(e) => setFormData({ ...formData, mentor_type: e.target.value as MentorType })}
                                className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary ${errors.mentor_type ? 'border-destructive' : 'border-border'}`}
                            >
                                <option value="">-- Chọn loại Cố vấn --</option>
                                <option value="AS">AS - Academic Support</option>
                                <option value="ACS">ACS - Academic Counseling Support</option>
                                <option value="ARD">ARD - Admission & Research Development</option>
                            </select>
                            {errors.mentor_type && (
                                <p className="text-destructive text-xs mt-1">{errors.mentor_type}</p>
                            )}
                        </div>
                    )}
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="rounded border-border"
                        />
                        <span className="text-sm font-medium text-foreground">Active account</span>
                    </label>
                    <div className="flex gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={saving}>
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1" disabled={saving}>
                            {saving ? 'Saving…' : user ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </form>
                </div>
            </DialogContent>
        </Dialog>
    )
}