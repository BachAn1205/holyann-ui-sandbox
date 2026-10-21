import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/services/auth.service'
import { RegisterData } from '@/lib/types/auth.types'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { email, password, full_name, role } = body

        // Validate basic fields
        if (!email || !password || !full_name) {
            return NextResponse.json(
                { success: false, message: 'Vui lòng điền đầy đủ thông tin (email, password, full_name)' },
                { status: 400 }
            )
        }

        const registerData: RegisterData = {
            email,
            password,
            full_name,
            role: role || 'STUDENT' // Default to STUDENT if not provided, though Register.tsx doesn't send role so it defaults here.
        }

        const result = await AuthService.register(registerData)

        if (!result.success) {
            return NextResponse.json(
                { success: false, message: result.message },
                { status: 400 }
            )
        }

        return NextResponse.json(result)

    } catch (error: any) {
        console.error('Registration API error:', error)
        return NextResponse.json(
            { success: false, message: 'Đã xảy ra lỗi hệ thống khi đăng ký' },
            { status: 500 }
        )
    }
}
