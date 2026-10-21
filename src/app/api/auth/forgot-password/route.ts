import { NextRequest, NextResponse } from 'next/server';
import { sendResetCode } from '@/actions/auth-reset'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email là bắt buộc' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim()
    const result = await sendResetCode(normalizedEmail)

    if (!result.success) {
      if (result.message.includes('Không tìm thấy')) {
        return NextResponse.json(
          { error: 'Email không tồn tại trong hệ thống' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, message: result.message })

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Forgot password error:', errMsg, error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra. Vui lòng thử lại sau.', detail: errMsg },
      { status: 500 }
    );
  }
}
