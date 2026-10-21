"use client"

import { useState, useEffect } from 'react'
import { format, addMonths } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Calendar as CalendarIcon } from 'lucide-react'
import { User } from '@/types/admin'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const PLAN_OPTIONS = [
    { value: 'FREE', label: 'Free' },
    { value: 'PLUS', label: 'Plus' },
    { value: 'PREMIUM', label: 'Premium' },
] as const

function toDate(v: Date | string | null | undefined): Date | null {
    if (v == null) return null
    if (v instanceof Date) return v
    const d = new Date(v)
    return isNaN(d.getTime()) ? null : d
}

interface EditSubscriptionModalProps {
    isOpen: boolean
    onClose: () => void
    user: User | null
    onSave: (plan: string, startDate: Date | null, endDate: Date | null) => Promise<void>
}

export default function EditSubscriptionModal({
    isOpen,
    onClose,
    user,
    onSave,
}: EditSubscriptionModalProps) {
    const today = new Date()
    const defaultEnd = addMonths(today, 6)

    const [plan, setPlan] = useState<string>('FREE')
    const [startDate, setStartDate] = useState<Date>(today)
    const [endDate, setEndDate] = useState<Date>(defaultEnd)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (!isOpen || !user) return
        setPlan(user.subscriptionPlan || 'FREE')
        const start = toDate(user.subscriptionStart)
        const end = toDate(user.subscriptionEnd)
        const t = new Date()
        setStartDate(start || t)
        setEndDate(end || addMonths(t, 6))
    }, [isOpen, user])

    const handleSave = async () => {
        if (!user) return
        setSaving(true)
        try {
            const start = plan === 'FREE' ? null : startDate
            const end = plan === 'FREE' ? null : endDate
            await onSave(plan, start, end)
            onClose()
        } finally {
            setSaving(false)
        }
    }

    const endMin = startDate

    if (!user) return null

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md p-6 gap-6">
                <DialogHeader className="pb-0">
                    <DialogTitle>Chỉnh sửa gói: {user.full_name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Gói</label>
                        <Select value={plan} onValueChange={setPlan}>
                            <SelectTrigger className="w-full h-10 rounded-lg">
                                <SelectValue placeholder="Chọn gói" />
                            </SelectTrigger>
                            <SelectContent>
                                {PLAN_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Ngày bắt đầu</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className={cn(
                                        'w-full justify-start text-left font-normal h-10',
                                        'rounded-lg border-border'
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                                    {format(startDate, 'dd/MM/yyyy', { locale: vi })}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={startDate}
                                    onSelect={(d) => d && setStartDate(d)}
                                    locale={vi}
                                    autoFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Ngày kết thúc</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className={cn(
                                        'w-full justify-start text-left font-normal h-10',
                                        'rounded-lg border-border'
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                                    {format(endDate, 'dd/MM/yyyy', { locale: vi })}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={endDate}
                                    onSelect={(d) => d && setEndDate(d)}
                                    locale={vi}
                                    disabled={(date) => date < endMin}
                                    autoFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    {plan === 'FREE' && (
                        <p className="text-xs text-muted-foreground">
                            Gói Free không lưu ngày bắt đầu/kết thúc.
                        </p>
                    )}

                    <div className="flex gap-2 justify-end pt-2 border-t border-border">
                        <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                            Hủy
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? 'Đang lưu...' : 'Lưu'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
