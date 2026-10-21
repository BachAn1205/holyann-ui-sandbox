import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-config'
import { prisma } from '@/lib/prisma'

const ALLOWED_PLANS = ['FREE', 'PLUS', 'PREMIUM'] as const
type Plan = (typeof ALLOWED_PLANS)[number]

// PATCH - Admin đổi gói học viên
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { id } = await params
        const body = await request.json().catch(() => ({}))
        const plan = (body?.plan ?? body?.subscriptionPlan) as Plan | undefined
        const rawStart = body?.subscriptionStart ?? body?.subscription_start
        const rawEnd = body?.subscriptionEnd ?? body?.subscription_end

        if (!plan || !ALLOWED_PLANS.includes(plan)) {
            return NextResponse.json(
                { message: 'Gói không hợp lệ. Chọn FREE, PLUS hoặc PREMIUM.' },
                { status: 400 }
            )
        }

        const targetUser = await prisma.users.findUnique({
            where: { id },
            select: { role: true }
        })
        if (!targetUser) {
            return NextResponse.json({ message: 'Không tìm thấy người dùng' }, { status: 404 })
        }
        if (targetUser.role !== 'STUDENT') {
            return NextResponse.json(
                { message: 'Chỉ học viên mới có gói đăng ký. Mentor/Admin không áp dụng.' },
                { status: 400 }
            )
        }

        const now = new Date()
        let subscriptionStart: Date = now
        let subscriptionEnd: Date = new Date(now)
        subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 6)

        if (plan === 'FREE') {
            subscriptionStart = now
            subscriptionEnd = now
        } else {
            if (rawStart != null) {
                const d = new Date(rawStart)
                if (!isNaN(d.getTime())) subscriptionStart = d
            }
            if (rawEnd != null) {
                const d = new Date(rawEnd)
                if (!isNaN(d.getTime())) subscriptionEnd = d
            }
            if (subscriptionEnd < subscriptionStart) {
                subscriptionEnd = new Date(subscriptionStart)
                subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 6)
            }
        }

        const updated = await prisma.users.update({
            where: { id },
            data: {
                subscription_plan: plan,
                subscription_start: plan === 'FREE' ? null : subscriptionStart,
                subscription_end: plan === 'FREE' ? null : subscriptionEnd,
            },
            select: {
                id: true,
                subscription_plan: true,
                subscription_start: true,
                subscription_end: true,
            }
        })

        return NextResponse.json({
            message: `Đã đổi gói thành ${plan}`,
            user: {
                id: updated.id,
                subscriptionPlan: updated.subscription_plan,
                subscriptionStart: updated.subscription_start,
                subscriptionEnd: updated.subscription_end,
            }
        })
    } catch (error: unknown) {
        console.error('Error updating user subscription:', error)
        return NextResponse.json(
            { message: error instanceof Error ? error.message : 'Lỗi khi cập nhật gói' },
            { status: 500 }
        )
    }
}
