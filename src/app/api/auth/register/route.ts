import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { sendOTPEmail } from '@/lib/email';

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, full_name } = body;

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Vui lòng điền đầy đủ thông tin' }, { status: 400 });
    }

    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      if (existingUser.is_verified) {
        return NextResponse.json({ error: 'Email này đã được đăng ký và xác thực' }, { status: 400 });
      } else {
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.users.update({
          where: { email },
          data: {
            password_hash: hashedPassword,
            full_name,
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
          is_verified: false,
        },
      });
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

    return NextResponse.json({ message: 'Đăng ký thành công, vui lòng kiểm tra email để nhận mã OTP' }, { status: 201 });
  } catch (error) {
    console.error('Lỗi khi đăng ký:', error);
    return NextResponse.json({ error: 'Đã có lỗi xảy ra khi đăng ký' }, { status: 500 });
  }
}
