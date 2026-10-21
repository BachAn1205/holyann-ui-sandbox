import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PATCH - Thay đổi trạng thái người dùng
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { is_active } = body

        const user = await prisma.users.update({
            where: { id },
            data: { is_active }
        })

        return NextResponse.json({
            message: `${is_active ? 'Kích hoạt' : 'Khóa'} người dùng thành công`,
            user
        })
    } catch (error: unknown) {
        console.error('Error updating user status:', error)
        return NextResponse.json(
            { message: error instanceof Error ? error.message : 'Lỗi khi cập nhật trạng thái' },
            { status: 500 }
        )
    }
}
