import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-config'

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ message: 'Bạn không có quyền thực hiện hành động này' }, { status: 403 })
        }

        const { id } = await params
        const body = await request.json()
        const { full_name, phone_number, role, is_active } = body

        const rows = await prisma.$queryRaw<Array<{
            id: string
            full_name: string
            email: string
            phone_number: string | null
            role: string
            is_active: boolean
        }>>`
            UPDATE "users"
            SET
                "full_name" = ${full_name},
                "phone_number" = ${phone_number || null},
                "role" = CAST(${role} AS "UserRole"),
                "is_active" = ${is_active}
            WHERE "id" = ${id}
            RETURNING "id", "full_name", "email", "phone_number", "role", "is_active"
        `

        const user = rows[0]

        if (!user) {
            return NextResponse.json({ message: 'Không tìm thấy người dùng' }, { status: 404 })
        }

        return NextResponse.json({ message: 'Cập nhật thành công', user })
    } catch (error: unknown) {
        console.error('Error updating user:', error)
        return NextResponse.json(
            { message: error instanceof Error ? error.message : 'Lỗi khi cập nhật người dùng' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ message: 'Bạn không có quyền thực hiện hành động này' }, { status: 403 })
        }

        const { id } = await params
        await prisma.users.delete({
            where: { id }
        })

        return NextResponse.json({ message: 'Xóa người dùng thành công' })
    } catch (error: unknown) {
        console.error('Error deleting user:', error)
        return NextResponse.json(
            { message: error instanceof Error ? error.message : 'Lỗi khi xóa người dùng' },
            { status: 500 }
        )
    }
}