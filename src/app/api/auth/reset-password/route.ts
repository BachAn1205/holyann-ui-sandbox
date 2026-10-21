import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

interface OtpRow {
  id: string;
  email: string;
  otp: string;
  expires_at: Date;
  created_at: Date;
}

export async function POST(request: NextRequest) {
  try {
    const { email, otp, newPassword } = await request.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { error: 'Email, OTP và mật khẩu mới là bắt buộc' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Mật khẩu phải có ít nhất 6 ký tự' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Tìm OTP bằng raw SQL
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
        { error: 'Mã xác thực đã hết hạn' },
        { status: 400 }
      );
    }

    // 2. Hash mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 3. Cập nhật mật khẩu bằng Prisma
    const user = await prisma.users.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Không tìm thấy tài khoản' },
        { status: 404 }
      );
    }

    await prisma.users.update({
      where: { id: user.id },
      data: {
        password_hash: hashedPassword,
        auth_provider: 'LOCAL',
      },
    });

    // 4. Xóa OTP đã dùng
    await prisma.$executeRawUnsafe(
      `DELETE FROM password_reset_otps WHERE email = $1`,
      normalizedEmail
    );

    return NextResponse.json({
      success: true,
      message: 'Mật khẩu đã được đặt lại thành công',
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra' },
      { status: 500 }
    );
  }
}
