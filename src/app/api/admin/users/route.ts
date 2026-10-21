import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
    try {
        const rows = await prisma.users.findMany({
            select: {
                id: true,
                full_name: true,
                email: true,
                phone_number: true,
                role: true,
                is_active: true,
                avatar_url: true,
                created_at: true,
                auth_provider: true,
                subscription_plan: true,
                subscription_start: true,
                subscription_end: true,
            },
            orderBy: {
                created_at: 'desc'
            }
        })

        const users = rows.map((u) => ({
            ...u,
            subscriptionPlan: u.subscription_plan ?? undefined,
            subscriptionStart: u.subscription_start ?? undefined,
            subscriptionEnd: u.subscription_end ?? undefined,
        }))

        return NextResponse.json({ users })
    } catch (error) {
        console.error('Error fetching users:', error)
        return NextResponse.json(
            { message: 'Lỗi khi lấy danh sách người dùng' },
            { status: 500 }
        )
    }
}

async function createRegularUserViaSql(data: {
    id: string
    full_name: string
    email: string
    phone_number: string | null
    role: string
    is_active: boolean
    password_hash: string
}) {
    const rows = await prisma.$queryRaw<Array<{
        id: string
        full_name: string
        email: string
        phone_number: string | null
        role: string
        is_active: boolean
        auth_provider: string | null
    }>>`
        INSERT INTO "users" (
            "id",
            "full_name",
            "email",
            "phone_number",
            "role",
            "is_active",
            "password_hash",
            "auth_provider"
        )
        VALUES (
            ${data.id},
            ${data.full_name},
            ${data.email},
            ${data.phone_number},
            CAST(${data.role} AS "UserRole"),
            ${data.is_active},
            ${data.password_hash},
            'LOCAL'
        )
        RETURNING "id", "full_name", "email", "phone_number", "role", "is_active", "auth_provider"
    `

    return rows[0]
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { full_name, email, phone_number, role, is_active, password, mentor_type } = body

        if (!full_name || !email || !password) {
            return NextResponse.json(
                { message: 'Thiếu thông tin bắt buộc' },
                { status: 400 }
            )
        }

        if (role === 'MENTOR' && !mentor_type) {
            return NextResponse.json(
                { message: 'Kiểu Cố vấn is required for mentor role' },
                { status: 400 }
            )
        }

        const existingUser = await prisma.users.findUnique({
            where: { email }
        })

        if (existingUser) {
            return NextResponse.json(
                { message: 'Email đã tồn tại' },
                { status: 409 }
            )
        }

        const password_hash = await bcrypt.hash(password, 10)
        const userId = crypto.randomUUID()

        if (role === 'MENTOR') {
            const result = await prisma.$transaction(async (tx) => {
                const user = await tx.users.create({
                    data: {
                        id: userId,
                        full_name,
                        email,
                        phone_number: phone_number || null,
                        role,
                        is_active: is_active !== undefined ? is_active : true,
                        password_hash,
                        auth_provider: 'LOCAL'
                    }
                })

                await tx.mentors.create({
                    data: {
                        user_id: userId,
                        specialization: mentor_type
                    }
                })

                return user
            })

            return NextResponse.json(
                { message: 'Tạo người dùng thành công', user: result },
                { status: 201 }
            )
        }

        const user = await createRegularUserViaSql({
            id: userId,
            full_name,
            email,
            phone_number: phone_number || null,
            role: role || 'STUDENT',
            is_active: is_active !== undefined ? is_active : true,
            password_hash,
        })

        return NextResponse.json(
            { message: 'Tạo người dùng thành công', user },
            { status: 201 }
        )
    } catch (error) {
        console.error('Error creating user:', error)
        const message = error instanceof Error ? error.message : 'Lỗi khi tạo người dùng'
        return NextResponse.json(
            { message: process.env.NODE_ENV === 'development' ? message : 'Lỗi khi tạo người dùng' },
            { status: 500 }
        )
    }
}