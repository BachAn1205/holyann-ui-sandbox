import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendOTPEmail } from '@/lib/email';

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Vui lòng cung cấp email' }, { status: 400 });
    }

    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      if (existingUser.is_verified) {
        return NextResponse.json({ error: 'Email này đã được đăng ký và xác thực' }, { status: 400 });
      }
      // If exists but not verified, we allow sending OTP again
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await prisma.otp_tokens.upsert({
      where: { email },
      update: {
        otp,
        expires_at: expiresAt,
        attempts: 0,
        created_at: new Date(),
      },
      create: {
        email,
        otp,
        expires_at: expiresAt,
        attempts: 0,
      },
    });

    await sendOTPEmail(email, otp);

    return NextResponse.json({ message: 'Mã OTP đã được gửi đến email của bạn' }, { status: 200 });
  } catch (error) {
    console.error('Lỗi khi gửi OTP:', error);
    return NextResponse.json({ error: 'Đã có lỗi xảy ra khi gửi OTP' }, { status: 500 });
  }
}
