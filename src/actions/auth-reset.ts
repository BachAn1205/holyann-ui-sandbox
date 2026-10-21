'use server'

import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import React from 'react'
import { sendEmail } from '@/lib/email/sendEmail'
import { ResetPasswordLinkEmail } from '@/emails/ResetPasswordLinkEmail'
import { ResetPasswordOtpEmail } from '@/emails/ResetPasswordOtpEmail'

// ==================== Helpers ====================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/

function identifierType(identifier: string): 'email' | 'phone' | null {
  const v = identifier.trim()
  if (EMAIL_REGEX.test(v)) return 'email'
  if (PHONE_REGEX.test(v)) return 'phone'
  return null
}

// NOTE: bảng password_reset_otps phải được tạo trực tiếp trên Supabase SQL Editor:
// CREATE TABLE IF NOT EXISTS password_reset_otps (
//   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   email VARCHAR(255) NOT NULL,
//   otp VARCHAR(6) NOT NULL,
//   expires_at TIMESTAMP NOT NULL,
//   created_at TIMESTAMP DEFAULT NOW(),
//   CONSTRAINT unique_email_otp UNIQUE (email, otp)
// );
// Lý do: pgbouncer transaction mode không hỗ trợ DDL (CREATE TABLE)

// ==================== Hàm 1: Gửi mã OTP ====================

export async function sendResetCode(identifier: string) {
  try {
    if (!identifier || !identifier.trim()) {
      return { success: false, message: 'Vui lòng nhập email hoặc số điện thoại' }
    }

    const normalized = identifier.trim().toLowerCase()
    const type = identifierType(normalized)

    if (!type) {
      return { success: false, message: 'Email hoặc số điện thoại không hợp lệ' }
    }

    // 1. Tìm user trong bảng users
    const user = await prisma.users.findFirst({
      where: type === 'email'
        ? { email: normalized }
        : { phone_number: normalized },
      select: { id: true, email: true, phone_number: true, full_name: true },
    })

    if (!user) {
      return { success: false, message: 'Không tìm thấy tài khoản với thông tin này' }
    }

    // 2. Tạo OTP 6 chữ số + thời gian hết hạn 10 phút
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expires = new Date(Date.now() + 10 * 60 * 1000)

    // 3. Xóa token cũ, lưu token mới vào bảng password_reset_otps
    //    (bảng phải được tạo sẵn trực tiếp trên Supabase SQL Editor)
    await prisma.$executeRawUnsafe(
      `DELETE FROM password_reset_otps WHERE email = $1`,
      normalized
    )

    await prisma.$executeRawUnsafe(
      `INSERT INTO password_reset_otps (id, email, otp, expires_at, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, NOW())`,
      normalized,
      otp,
      expires
    )

    // 4. Gửi mã theo kênh phù hợp
    if (type === 'email') {
      const res = await sendEmail({
        to: normalized,
        subject: 'Mã Xác Nhận Đặt Lại Mật Khẩu - Holyann Explore',
        react: React.createElement(ResetPasswordOtpEmail, {
          name: user.full_name,
          otp,
          expiresMinutes: 10,
        }),
      })
      if (!res.success) {
        const isNotConfigured = res.error === 'EMAIL_NOT_CONFIGURED'
        return {
          success: false,
          message: isNotConfigured
            ? 'Hệ thống email chưa được cấu hình. Vui lòng liên hệ quản trị viên.'
            : 'Không thể gửi email. Vui lòng thử lại sau hoặc liên hệ quản trị viên.',
        }
      }
    } else {
      // Phone: mock SMS (tích hợp Twilio/ESMS sau)
      console.log(`[SMS MOCK] Gửi OTP: ${otp} đến số ${normalized}`)
    }

    return {
      success: true,
      message: type === 'email'
        ? 'Mã xác nhận đã được gửi đến email của bạn'
        : 'Mã xác nhận đã được gửi đến số điện thoại của bạn',
      type,
    }
  } catch (error) {
    console.error('❌ [OTP] sendResetCode error:', error)
    return { success: false, message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.' }
  }
}

// ==================== Hàm 2: Đặt lại mật khẩu bằng OTP ====================

export async function resetPasswordWithCode(
  identifier: string,
  code: string,
  newPassword: string,
) {
  try {
    if (!identifier || !identifier.trim()) {
      return { success: false, message: 'Thông tin định danh không hợp lệ' }
    }

    if (!code || code.trim().length !== 6) {
      return { success: false, message: 'Mã xác nhận phải gồm 6 chữ số' }
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' }
    }

    const normalized = identifier.trim().toLowerCase()
    const type = identifierType(normalized)

    if (!type) {
      return { success: false, message: 'Email hoặc số điện thoại không hợp lệ' }
    }

    // 1. Tìm token trong password_reset_otps (raw SQL)
    const records = await prisma.$queryRawUnsafe<Array<{ email: string; otp: string; expires_at: Date }>>(
      `SELECT * FROM password_reset_otps WHERE email = $1 AND otp = $2 LIMIT 1`,
      normalized,
      code.trim()
    )

    const record = records && records.length > 0 ? records[0] : null

    // 2. Kiểm tra tồn tại và chưa hết hạn
    if (!record) {
      return { success: false, message: 'Mã xác nhận không hợp lệ hoặc đã hết hạn' }
    }

    if (new Date(record.expires_at) < new Date()) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM password_reset_otps WHERE email = $1`,
        normalized
      )
      return { success: false, message: 'Mã xác nhận không hợp lệ hoặc đã hết hạn' }
    }

    // 3. Tìm user tương ứng
    const user = await prisma.users.findFirst({
      where: type === 'email'
        ? { email: normalized }
        : { phone_number: normalized },
      select: { id: true },
    })

    if (!user) {
      return { success: false, message: 'Không tìm thấy tài khoản' }
    }

    // 4. Hash mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // 5. Cập nhật mật khẩu vào DB
    await prisma.users.update({
      where: { id: user.id },
      data: { password_hash: hashedPassword, auth_provider: 'LOCAL' },
    })

    // 6. Xóa token đã dùng
    await prisma.$executeRawUnsafe(
      `DELETE FROM password_reset_otps WHERE email = $1`,
      normalized
    )

    console.log(`✅ [OTP] Password reset successful for ${normalized}`)

    return { success: true, message: 'Đổi mật khẩu thành công. Bạn có thể đăng nhập với mật khẩu mới.' }
  } catch (error) {
    console.error('❌ [OTP] resetPasswordWithCode error:', error)
    return { success: false, message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.' }
  }
}

// ==================== Legacy: Đặt lại mật khẩu qua link email ====================

export async function requestPasswordReset(email: string) {
  try {
    if (!email) {
      return { success: false, message: 'Email không hợp lệ' }
    }

    const normalizedEmail = email.toLowerCase().trim()

    const user = await prisma.users.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, full_name: true },
    })

    if (!user) {
      return {
        success: true,
        message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được link đặt lại mật khẩu.',
      }
    }

    const token = crypto.randomUUID()
    const expires = new Date()
    expires.setHours(expires.getHours() + 1)

    await prisma.$executeRawUnsafe(
      `DELETE FROM password_reset_tokens WHERE email = $1`,
      normalizedEmail
    )
    await prisma.$executeRawUnsafe(
      `INSERT INTO password_reset_tokens (id, email, token, expires, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, NOW())`,
      normalizedEmail,
      token,
      expires
    )

    const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`
    const res = await sendEmail({
      to: normalizedEmail,
      subject: 'Đặt Lại Mật Khẩu - Holyann Explore',
      react: React.createElement(ResetPasswordLinkEmail, {
        name: user.full_name,
        resetLink,
        expiresHours: 1,
      }),
    })
    if (!res.success) {
      return {
        success: false,
        message:
          'Hệ thống email chưa được cấu hình. Vui lòng liên hệ quản trị viên.',
      }
    }

    return {
      success: true,
      message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được link đặt lại mật khẩu.',
    }
  } catch (error) {
    console.error('❌ [PasswordReset] requestPasswordReset error:', error)
    return { success: false, message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.' }
  }
}

export async function resetPassword(token: string, newPassword: string) {
  try {
    if (!token) return { success: false, message: 'Token không hợp lệ' }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' }
    }

    const records = await prisma.$queryRawUnsafe<Array<{ email: string; token: string; expires: Date }>>(
      `SELECT * FROM password_reset_tokens WHERE token = $1 LIMIT 1`,
      token
    )

    const resetToken = records && records.length > 0 ? records[0] : null

    if (!resetToken) {
      return { success: false, message: 'Token không hợp lệ hoặc đã hết hạn' }
    }

    if (new Date(resetToken.expires) < new Date()) {
      await prisma.$executeRawUnsafe(`DELETE FROM password_reset_tokens WHERE token = $1`, token)
      return { success: false, message: 'Token không hợp lệ hoặc đã hết hạn' }
    }

    const user = await prisma.users.findUnique({ where: { email: resetToken.email }, select: { id: true } })
    if (!user) return { success: false, message: 'Không tìm thấy tài khoản với email này' }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await prisma.users.update({ where: { id: user.id }, data: { password_hash: hashedPassword, auth_provider: 'LOCAL' } })
    await prisma.$executeRawUnsafe(`DELETE FROM password_reset_tokens WHERE email = $1`, resetToken.email)

    return { success: true, message: 'Đổi mật khẩu thành công. Bạn có thể đăng nhập với mật khẩu mới.' }
  } catch (error) {
    console.error('❌ [PasswordReset] resetPassword error:', error)
    return { success: false, message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.' }
  }
}

