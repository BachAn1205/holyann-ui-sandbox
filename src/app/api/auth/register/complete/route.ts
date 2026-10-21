import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { email, otp, full_name, password } = await request.json();

    if (!email || !otp || !full_name || !password) {
      return NextResponse.json({ error: 'Vui lòng điền đầy đủ thông tin' }, { status: 400 });
    }

    const otpRecord = await prisma.otp_tokens.findUnique({
      where: { email },
    });

    if (!otpRecord || otpRecord.otp !== otp || otpRecord.expires_at < new Date()) {
      return NextResponse.json({ error: 'Mã xác thực không hợp lệ hoặc đã hết hạn' }, { status: 400 });
    }

    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      if (existingUser.is_verified) {
        return NextResponse.json({ error: 'Email này đã được đăng ký' }, { status: 400 });
      } else {
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.users.update({
          where: { email },
          data: {
            password_hash: hashedPassword,
            full_name,
            is_verified: true,
          }
        });
      }
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.users.create({
        data: {
          id: crypto.randomUUID(),
          email,
          password_hash: hashedPassword,
          full_name,
          is_verified: true,
        },
      });
    }

    // Xóa OTP sau khi dùng xong
    await prisma.otp_tokens.delete({
      where: { email },
    });

    return NextResponse.json({ message: 'Đăng ký thành công' }, { status: 201 });
  } catch (error) {
    console.error('Lỗi khi hoàn tất đăng ký:', error);
    return NextResponse.json({ error: 'Đã có lỗi xảy ra khi hoàn tất đăng ký' }, { status: 500 });
  }
}
