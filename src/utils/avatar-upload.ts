/**
 * Avatar upload utilities for handling profile picture uploads
 */

interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

/**
 * Upload avatar to server using the dedicated avatar upload endpoint
 */
export const uploadAvatarToServer = async (file: File, userId: string): Promise<UploadResult> => {
  try {
    // Validate file
    if (!file.type.startsWith('image/')) {
      return {
        success: false,
        error: 'File phải là hình ảnh'
      }
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      return {
        success: false,
        error: 'Kích thước file không được vượt quá 5MB'
      }
    }

    // Create FormData for upload
    const formData = new FormData()
    formData.append('avatar', file)
    formData.append('userId', userId)

    // Use the dedicated avatar upload endpoint
    const response = await fetch('/api/upload-avatar', {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Upload failed')
    }

    return {
      success: true,
      url: result.url
    }

  } catch (error) {
    console.error('Avatar upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Tải lên thất bại. Vui lòng thử lại.'
    }
  }
}

/**
 * Supabase Storage implementation example
 * Uncomment and modify this if you're using Supabase
 */
/*
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const uploadAvatarToSupabase = async (file: File, userId: string): Promise<UploadResult> => {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('user-avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      throw error
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('user-avatars')
      .getPublicUrl(filePath)

    // Update user profile in database
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: publicUrl })
      .eq('id', userId)

    if (updateError) {
      throw updateError
    }

    return {
      success: true,
      url: publicUrl
    }

  } catch (error) {
    console.error('Supabase upload error:', error)
    return {
      success: false,
      error: error.message || 'Tải lên thất bại'
    }
  }
}
*/

/**
 * Handle avatar upload with user feedback
 */
export const handleAvatarUploadWithFeedback = async (
  file: File,
  userId: string,
  onSuccess: (url: string) => void,
  onError: (error: string) => void
): Promise<void> => {
  const result = await uploadAvatarToServer(file, userId)

  if (result.success && result.url) {
    onSuccess(result.url)
  } else {
    onError(result.error || 'Tải lên thất bại')
  }
}

/**
 * Validate avatar file before upload
 */
export const validateAvatarFile = (file: File): { valid: boolean; error?: string } => {
  if (!file.type.startsWith('image/')) {
    return {
      valid: false,
      error: 'Vui lòng chọn file hình ảnh (JPG, PNG, GIF)'
    }
  }

  if (file.size > 5 * 1024 * 1024) {
    return {
      valid: false,
      error: 'Kích thước file không được vượt quá 5MB'
    }
  }

  return { valid: true }
}
