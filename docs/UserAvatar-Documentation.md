# UserAvatar Component Documentation

## Tổng quan

Component `UserAvatar` đã được cập nhật để hỗ trợ:
- Hiển thị ảnh đại diện mặc định cho tài khoản chưa có avatar
- Upload avatar khi click vào ảnh đại diện
- Hiển thị preview và xử lý upload

## Cách sử dụng

### 1. Import component

```tsx
import UserAvatar from '@/components/ui/UserAvatar'
```

### 2. Sử dụng cơ bản (chỉ hiển thị)

```tsx
<UserAvatar
  src={user.avatar_url}
  name={user.name}
  role="STUDENT"
  size="md"
  showInitials={true}
/>
```

### 3. Sử dụng với tính năng upload

```tsx
<UserAvatar
  src={user.avatar_url}
  name={user.name}
  role="STUDENT"
  size="xl"
  showInitials={true}
  onAvatarUpload={handleAvatarUpload}
  clickable={true}
  className="border-2 border-primary/20"
/>
```

## Props

| Prop | Type | Mặc định | Mô tả |
|------|------|----------|--------|
| `src` | `string \| null` | `undefined` | URL ảnh đại diện |
| `name` | `string \| null` | `undefined` | Tên user (dùng cho alt text và initials) |
| `role` | `string` | `undefined` | Vai trò user (STUDENT, MENTOR, ADMIN) |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Kích thước avatar |
| `showInitials` | `boolean` | `true` | Hiển thị chữ cái đầu khi không có ảnh |
| `onAvatarUpload` | `(file: File) => Promise<void>` | `undefined` | Callback xử lý upload |
| `clickable` | `boolean` | `false` | Cho phép click để upload |
| `className` | `string` | `''` | CSS classes bổ sung |
| `alt` | `string` | `undefined` | Alt text cho ảnh |
| `fallbackIcon` | `string` | `undefined` | Icon fallback tùy chỉnh |

## Xử lý upload avatar

### 1. Tạo function xử lý upload

```tsx
const handleAvatarUpload = async (file: File): Promise<void> => {
  try {
    // Validate file
    const validation = validateAvatarFile(file)
    if (!validation.valid) {
      alert(validation.error)
      return
    }

    // Upload to server
    const result = await uploadAvatarToServer(file, user.id)
    
    if (result.success && result.url) {
      // Update user state
      setUser(prev => ({
        ...prev,
        avatar_url: result.url
      }))
      
      // Show success message
      toast.success('Cập nhật avatar thành công!')
    } else {
      alert(result.error || 'Upload thất bại')
    }
  } catch (error) {
    console.error('Upload error:', error)
    alert('Có lỗi xảy ra khi upload')
  }
}
```

### 2. Sử dụng với Supabase

```tsx
import { uploadAvatarToSupabase } from '@/utils/avatar-upload'

const handleAvatarUpload = async (file: File): Promise<void> => {
  const result = await uploadAvatarToSupabase(file, user.id)
  
  if (result.success && result.url) {
    setUser(prev => ({ ...prev, avatar_url: result.url }))
  } else {
    alert(result.error)
  }
}
```

## Các trường hợp hiển thị

### 1. Có avatar
- Hiển thị ảnh từ `src`
- Loading spinner khi đang tải
- Fallback nếu ảnh lỗi

### 2. Không có avatar, có tên
- Hiển thị chữ cái đầu nếu `showInitials = true`
- Hiển thị ảnh mặc định nếu `showInitials = false`

### 3. Không có avatar, không có tên  
- Hiển thị ảnh mặc định (`/images/avatars/avt.jpg`)

### 4. Clickable mode
- Hiển thị icon camera khi hover
- Mở modal upload khi click
- Hiển thị cursor pointer

## Ví dụ thực tế

### Profile component

```tsx
export default function UserProfile({ user }: { user: User }) {
  const [userData, setUserData] = useState(user)
  
  const handleAvatarUpload = async (file: File) => {
    // Implementation here
  }

  return (
    <div className="profile-card">
      <UserAvatar
        src={userData.avatar_url}
        name={userData.full_name}
        role={userData.role}
        size="xl"
        showInitials={true}
        onAvatarUpload={handleAvatarUpload}
        clickable={true}
        className="mx-auto mb-4"
      />
      <h2>{userData.full_name}</h2>
      <p>{userData.email}</p>
    </div>
  )
}
```

### List component

```tsx
{users.map(user => (
  <div key={user.id} className="user-item">
    <UserAvatar
      src={user.avatar_url}
      name={user.name}
      role={user.role}
      size="md"
      showInitials={true}
    />
    <span>{user.name}</span>
  </div>
))}
```

## Styling

Component sử dụng Tailwind CSS với các class có thể customize:
- Container: `rounded-full bg-primary/10 border border-primary/20`
- Hover effect khi clickable: `hover:opacity-80 transition-opacity`
- Upload overlay: `bg-black bg-opacity-30 hover:bg-opacity-30`

## Lưu ý

1. **File validation**: Component tự động validate file type và size
2. **Error handling**: Cần implement error handling trong `onAvatarUpload`
3. **Loading states**: Component hiển thị loading spinner khi cần
4. **Accessibility**: Component có đầy đủ alt text và ARIA attributes
5. **Performance**: Sử dụng `URL.createObjectURL()` cho preview, nhớ cleanup
