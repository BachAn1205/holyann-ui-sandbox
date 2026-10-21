'use server'

import { randomUUID } from 'crypto'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { MentorType } from '@prisma/client'
import { requireAdminAuth } from '@/lib/auth-utils'

const CreateMentorSchema = z.object({
  fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  specialization: z.nativeEnum(MentorType, {
    message: 'Chuyên môn không hợp lệ',
  }),
})

export type CreateMentorState = {
  success?: boolean
  message?: string
  errors?: {
    fullName?: string[]
    email?: string[]
    password?: string[]
    specialization?: string[]
  }
}

export async function createMentorAction(
  prevState: CreateMentorState,
  formData: FormData
): Promise<CreateMentorState> {
  try {
    await requireAdminAuth()
  } catch {
    return {
      success: false,
      message: 'Unauthorized: Bạn không có quyền thực hiện hành động này.',
    }
  }

  const rawData = {
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    password: formData.get('password'),
    specialization: formData.get('specialization'),
  }

  const validatedFields = CreateMentorSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const data = validatedFields.data

  try {
    const existingUser = await prisma.users.findUnique({
      where: { email: data.email },
      select: { id: true },
    })

    if (existingUser) {
      return {
        success: false,
        message: 'Email này đã được sử dụng trong hệ thống.',
      }
    }

    const hashedPassword = await bcrypt.hash(data.password, 10)

    await prisma.$transaction(async (tx) => {
      const newUser = await tx.users.create({
        data: {
          id: randomUUID(),
          full_name: data.fullName,
          email: data.email,
          password_hash: hashedPassword,
          role: 'MENTOR',
          auth_provider: 'LOCAL',
          is_active: true,
        },
      })

      await tx.mentors.create({
        data: {
          user_id: newUser.id,
          specialization: data.specialization,
        },
      })

      return newUser
    })

    revalidatePath('/admin/mentors')

    return {
      success: true,
      message: 'Tạo tài khoản Mentor thành công!',
    }
  } catch (error) {
    console.error('Create Mentor Error:', error)
    return {
      success: false,
      message: 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.',
    }
  }
}
