"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import UserAvatar from '@/components/ui/UserAvatar'
import { PageLoading } from '@/components/ui/PageLoading'
import { uploadAvatarToServer } from '@/utils/avatar-upload'

interface StudentDetail {
  id: string
  full_name: string | null
  email: string | null
  phone_number: string | null
  avatar_url: string | null
  is_active: boolean | null
  created_at: string | Date | null
  students: {
    current_school: string | null
    current_grade: string | null
    current_address: string | null
    date_of_birth: string | Date | null
    talents: string | null
    hobbies: string | null
    target_faculty_name: string | null
    target_university_name: string | null
    yearly_budget: number | null
    yearly_budget_currency: string | null
    personal_desire: string | null
    assessments_completed: boolean | null
    created_at: string | Date | null
    updated_at: string | Date | null
  } | null
  student_applications: Array<{
    id: string
    category: string
    status: string
    personal_notes: string | null
    created_at: string | Date | null
    universities: {
      id: number
      name: string
      country: string | null
      current_ranking: number | null
    } | null
  }>
}

interface StudentDetailProps {
  studentId: string
}

export default function StudentDetail({ studentId }: StudentDetailProps) {
  const [student, setStudent] = useState<StudentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchStudentDetail()
  }, [studentId])

  const handleAvatarUpload = async (file: File): Promise<void> => {
    try {
      const result = await uploadAvatarToServer(file, studentId)

      if (result.success && result.url && student) {
        // Update the student state with new avatar URL
        setStudent(prev => {
          if (!prev) return prev
          return {
            ...prev,
            avatar_url: result.url ?? null
          }
        })

        // Optionally show success message
      } else {
        throw new Error(result.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Avatar upload error:', error)
      throw error // Re-throw to let AvatarUpload component handle the error display
    }
  }

  const fetchStudentDetail = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/students/${studentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })

      if (!response.ok) {
        if (response.status === 404) {
          setError('Không tìm thấy học viên')
        } else {
          setError(`Lỗi server: ${response.status}`)
        }
        return
      }

      const result = await response.json()
      if (result.success) {
        setStudent(result.data)
      } else {
        setError(result.error || 'Lỗi không xác định')
      }
    } catch (err) {
      setError('Không thể tải thông tin học viên')
      console.error('Error fetching student detail:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string | Date | null) => {
    if (!date) return 'N/A'
    try {
      const d = new Date(date)
      if (isNaN(d.getTime())) return 'Invalid Date'
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch (error) {
      return 'Invalid Date'
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; className: string } } = {
      'RESEARCHING': {
        label: 'Đang nghiên cứu',
        className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      },
      'ESSAY_WRITING': {
        label: 'Viết bài luận',
        className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      },
      'SUBMITTED': {
        label: 'Đã nộp',
        className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
      },
      'ACCEPTED': {
        label: 'Được chấp nhận',
        className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      },
      'REJECTED': {
        label: 'Bị từ chối',
        className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      },
      'WAITLISTED': {
        label: 'Danh sách chờ',
        className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
      }
    }
    return statusMap[status] || { label: status, className: 'bg-muted text-muted-foreground' }
  }

  const getCategoryBadge = (category: string) => {
    const categoryMap: { [key: string]: { label: string; className: string } } = {
      'REACH': {
        label: 'Reach',
        className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      },
      'MATCH': {
        label: 'Match',
        className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      },
      'SAFETY': {
        label: 'Safety',
        className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      }
    }
    return categoryMap[category] || { label: category, className: 'bg-muted text-muted-foreground' }
  }

  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <i className="fas fa-arrow-left"></i>
            Quay lại
          </button>
        </div>
        <PageLoading inline size="md" message="Đang tải thông tin học viên..." />
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <i className="fas fa-arrow-left"></i>
            Quay lại
          </button>
        </div>
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">
            <i className="fas fa-exclamation-triangle text-3xl"></i>
          </div>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchStudentDetail}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <i className="fas fa-refresh mr-2"></i>
            Thử lại
          </button>
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div>
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <i className="fas fa-arrow-left"></i>
            Quay lại
          </button>
        </div>
        <div className="text-center py-8">
          <div className="text-muted-foreground mb-4">
            <i className="fas fa-user-slash text-3xl"></i>
          </div>
          <p className="text-muted-foreground">Không tìm thấy thông tin học viên</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <i className="fas fa-arrow-left"></i>
            Quay lại
          </button>
          <h1 className="section-title text-2xl !mb-0 !text-left after:!mx-0 after:!w-16">
            CHI TIẾT HỌC VIÊN
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            student.is_active
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {student.is_active ? 'Hoạt động' : 'Không hoạt động'}
          </span>
        </div>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1">
          <div className="card-holyann">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4">
                <UserAvatar
                  src={student.avatar_url}
                  name={student.full_name}
                  role="STUDENT"
                  size="xl"
                  showInitials={true}
                  onAvatarUpload={handleAvatarUpload}
                  clickable={true}
                  className="border-2 border-primary/20 shadow-lg"
                />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                {student.full_name || 'N/A'}
              </h2>
              <p className="text-muted-foreground mb-4">{student.email || 'N/A'}</p>

              <div className="space-y-3 text-left">
                <div className="flex items-center gap-3">
                  <i className="fas fa-phone text-muted-foreground w-4"></i>
                  <span className="text-sm">{student.phone_number || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <i className="fas fa-calendar-plus text-muted-foreground w-4"></i>
                  <span className="text-sm">Tham gia: {formatDate(student.created_at)}</span>
                </div>
                {student.students?.date_of_birth && (
                  <div className="flex items-center gap-3">
                    <i className="fas fa-birthday-cake text-muted-foreground w-4"></i>
                    <span className="text-sm">Sinh nhật: {formatDate(student.students.date_of_birth)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card-holyann">
              <h3 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
                <i className="fas fa-graduation-cap text-primary"></i>
                Thông tin học vấn
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">Trường hiện tại:</span>
                  <p className="text-foreground">{student.students?.current_school || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Lớp hiện tại:</span>
                  <p className="text-foreground">{student.students?.current_grade || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Địa chỉ:</span>
                  <p className="text-foreground">{student.students?.current_address || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="card-holyann">
              <h3 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
                <i className="fas fa-target text-primary"></i>
                Mục tiêu
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">Ngành học dự định:</span>
                  <p className="text-foreground">{student.students?.target_faculty_name && student.students?.target_university_name ? `${student.students.target_faculty_name} @ ${student.students.target_university_name}` : 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Trường mục tiêu:</span>
                  <p className="text-foreground">{student.students?.target_university_name || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Ngân sách hàng năm:</span>
                  <p className="text-foreground">
                    {student.students?.yearly_budget
                      ? `${Number(student.students.yearly_budget).toLocaleString('vi-VN')} ${student.students.yearly_budget_currency || 'USD'}`
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Information Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Talents */}
        {student.students?.talents && (
          <div className="card-holyann">
            <h3 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
              <i className="fas fa-star text-primary"></i>
              Tài năng
            </h3>
            <p className="text-foreground text-sm leading-relaxed">
              {student.students.talents}
            </p>
          </div>
        )}

        {/* Hobbies */}
        {student.students?.hobbies && (
          <div className="card-holyann">
            <h3 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
              <i className="fas fa-heart text-primary"></i>
              Sở thích
            </h3>
            <p className="text-foreground text-sm leading-relaxed">
              {student.students.hobbies}
            </p>
          </div>
        )}

        {/* Personal Desire */}
        {student.students?.personal_desire && (
          <div className="card-holyann lg:col-span-2">
            <h3 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
              <i className="fas fa-user-edit text-primary"></i>
              Mong muốn cá nhân
            </h3>
            <p className="text-foreground text-sm leading-relaxed">
              {student.students.personal_desire}
            </p>
          </div>
        )}

        {/* Assessment Status */}
        <div className="card-holyann lg:col-span-2">
          <h3 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
            <i className="fas fa-clipboard-check text-primary"></i>
            Trạng thái đánh giá
          </h3>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              student.students?.assessments_completed
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
            }`}>
              {student.students?.assessments_completed ? 'Đã hoàn thành' : 'Chưa hoàn thành'}
            </span>
          </div>
        </div>
      </div>

      {/* Applications */}
      {student.student_applications && student.student_applications.length > 0 && (
        <div className="card-holyann">
          <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
            <i className="fas fa-university text-primary"></i>
            Đơn đăng ký ({student.student_applications.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Trường</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Quốc gia</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Xếp hạng</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Phân loại</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Trạng thái</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {student.student_applications.map((application) => {
                  const statusInfo = getStatusBadge(application.status)
                  const categoryInfo = getCategoryBadge(application.category)
                  return (
                    <tr key={application.id} className="border-b border-border">
                      <td className="py-3 px-4 text-sm font-medium text-foreground">
                        {application.universities?.name || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {application.universities?.country || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {application.universities?.current_ranking ? `#${application.universities.current_ranking}` : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${categoryInfo.className}`}>
                          {categoryInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground max-w-xs truncate">
                        {application.personal_notes || 'N/A'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
