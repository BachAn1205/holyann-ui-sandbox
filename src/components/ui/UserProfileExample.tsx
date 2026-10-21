// Example usage of UserAvatar component with upload functionality
import { useState } from 'react'
import UserAvatar from './UserAvatar'

interface User {
  id: string
  name: string
  email: string
  avatar_url?: string | null
  role?: string
}

export default function UserProfileExample() {
  const [user, setUser] = useState<User>({
    id: '1',
    name: 'Nguyen Van A',
    email: 'user@example.com',
    avatar_url: null, // No avatar initially
    role: 'STUDENT'
  })

  const [isUploading, setIsUploading] = useState(false)

  // Mock upload function - replace with your actual upload service
  const handleAvatarUpload = async (file: File): Promise<void> => {
    setIsUploading(true)

    try {
      // Mock upload process - replace with actual API call

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Create a local URL for demo (in real app, this would be the URL from your server)
      const localUrl = URL.createObjectURL(file)

      // Update user avatar
      setUser(prev => ({
        ...prev,
        avatar_url: localUrl
      }))


    } catch (error) {
      console.error('Upload failed:', error)
      throw error
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Thông tin cá nhân</h2>

      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Avatar section with upload */}
        <div className="flex flex-col items-center mb-6">
          <UserAvatar
            src={user.avatar_url}
            name={user.name}
            role={user.role}
            size="xl"
            showInitials={true}
            onAvatarUpload={handleAvatarUpload}
            clickable={true}
            className="mb-3"
          />
          <p className="text-sm text-gray-600 text-center">
            Nhấp vào ảnh để thay đổi avatar
          </p>
          {isUploading && (
            <p className="text-sm text-blue-600 mt-2">
              Đang tải lên...
            </p>
          )}
        </div>

        {/* User info */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Họ tên</label>
            <p className="mt-1 text-gray-900">{user.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="mt-1 text-gray-900">{user.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Vai trò</label>
            <p className="mt-1 text-gray-900">{user.role}</p>
          </div>
        </div>
      </div>

      {/* Usage examples with different configurations */}
      <div className="mt-8 space-y-4">
        <h3 className="text-lg font-semibold">Các cách hiển thị khác:</h3>

        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <UserAvatar
            src={null} // No avatar - will show default image
            name="User Without Avatar"
            size="md"
            showInitials={false}
          />
          <span>Không có avatar - hiển thị ảnh mặc định</span>
        </div>

        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <UserAvatar
            src={null}
            name="User With Initials"
            size="md"
            showInitials={true}
          />
          <span>Hiển thị chữ cái đầu thay vì ảnh mặc định</span>
        </div>

        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <UserAvatar
            src="/images/avatars/avt.jpg" // Using default avatar explicitly
            name="User With Default"
            size="md"
            showInitials={true}
          />
          <span>Sử dụng ảnh mặc định</span>
        </div>
      </div>
    </div>
  )
}
