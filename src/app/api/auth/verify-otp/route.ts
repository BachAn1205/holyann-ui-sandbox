import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface OtpRow {
  id: string;
  email: string;
  otp: string;
  expires_at: Date;
  created_at: Date;
}

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email và mã OTP là bắt buộc' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Tìm OTP bằng raw SQL (bypass RLS)
    const records = await prisma.$queryRawUnsafe<OtpRow[]>(
      `SELECT * FROM password_reset_otps WHERE email = $1 AND otp = $2 LIMIT 1`,
      normalizedEmail,
      otp
    );

    if (!records || records.length === 0) {
      return NextResponse.json(
        { error: 'Mã xác thực không đúng' },
        { status: 400 }
      );
    }

    const otpRecord = records[0];
    const now = new Date();
    const expiresAt = new Date(otpRecord.expires_at);

    if (now > expiresAt) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM password_reset_otps WHERE email = $1`,
        normalizedEmail
      );

      return NextResponse.json(
        { error: 'Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Mã xác thực hợp lệ',
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}
