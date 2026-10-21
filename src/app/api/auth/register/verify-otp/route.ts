import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Vui lòng cung cấp email và mã OTP' }, { status: 400 });
    }

    const otpRecord = await prisma.otp_tokens.findUnique({
      where: { email },
    });

    if (!otpRecord) {
      return NextResponse.json({ error: 'Không tìm thấy mã OTP cho email này' }, { status: 400 });
    }

    if (otpRecord.attempts >= 5) {
      await prisma.otp_tokens.delete({ where: { email } });
      return NextResponse.json({ error: 'Bạn đã nhập sai mã OTP quá 5 lần. Vui lòng đăng ký lại để nhận mã mới.' }, { status: 400 });
    }

    if (otpRecord.expires_at < new Date()) {
      return NextResponse.json({ error: 'Mã OTP đã hết hạn' }, { status: 400 });
    }

    if (otpRecord.otp !== otp) {
      await prisma.otp_tokens.update({
        where: { email },
        data: { attempts: { increment: 1 } },
      });
      return NextResponse.json({ error: 'Mã OTP không chính xác' }, { status: 400 });
    }

    // Return success but DO NOT delete OTP yet, so it can be verified in complete step
    return NextResponse.json({ message: 'Mã xác thực hợp lệ' }, { status: 200 });
  } catch (error) {
    console.error('Lỗi khi xác thực OTP:', error);
    return NextResponse.json({ error: 'Đã có lỗi xảy ra khi xác thực OTP' }, { status: 500 });
  }
}
