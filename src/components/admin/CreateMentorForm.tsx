'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTransition } from 'react'
import { toast } from 'sonner' // Sử dụng sonner như đã thấy trong project
import { createMentorAction } from '@/actions/admin/create-mentor'
import { Loader2 } from 'lucide-react' // Icon loading (giả định có lucide-react, nếu không có thể thay thế)

// Schema validation cho Client (giống Server)
const CreateMentorSchema = z.object({
  fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  specialization: z.enum(['AS', 'ACS', 'ARD'], {
    message: 'Vui lòng chọn chuyên môn',
  }),
})

type FormData = z.infer<typeof CreateMentorSchema>

export default function CreateMentorForm() {
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(CreateMentorSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      specialization: undefined,
    },
  })

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      // Chuyển đổi data object thành FormData để gửi lên Server Action
      const formData = new FormData()
      formData.append('fullName', data.fullName)
      formData.append('email', data.email)
      formData.append('password', data.password)
      formData.append('specialization', data.specialization)

      const result = await createMentorAction({}, formData)

      if (result.success) {
        toast.success(result.message)
        reset() // Reset form sau khi thành công
      } else {
        toast.error(result.message)
        // Nếu có lỗi chi tiết từ server trả về (ngoài validation client)
        if (result.errors) {
            // Có thể hiển thị lỗi cụ thể từng field nếu muốn, ở đây toast error chung
        }
      }
    })
  }

  return (
    <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Thêm mới Mentor</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Họ và tên
          </label>
          <input
            {...register('fullName')}
            type="text"
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nguyen Van A"
            disabled={isPending}
          />
          {errors.fullName && (
            <p className="mt-1 text-sm text-red-500">{errors.fullName.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <input
            {...register('email')}
            type="email"
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="email@example.com"
            disabled={isPending}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Mật khẩu
          </label>
          <input
            {...register('password')}
            type="password"
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="••••••"
            disabled={isPending}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>

        {/* Specialization */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Chuyên môn (Mentor Type)
          </label>
          <select
            {...register('specialization')}
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isPending}
          >
            <option value="">Chọn chuyên môn...</option>
            <option value="AS">AS - Academic Support</option>
            <option value="ACS">ACS - Academic & Career Support</option>
            <option value="ARD">ARD - Academic Research & Development</option>
          </select>
          {errors.specialization && (
            <p className="mt-1 text-sm text-red-500">{errors.specialization.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang xử lý...
            </>
          ) : (
            'Tạo tài khoản Mentor'
          )}
        </button>
      </form>
    </div>
  )
}
