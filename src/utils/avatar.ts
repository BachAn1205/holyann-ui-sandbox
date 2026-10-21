/**
 * Avatar utility functions for handling user profile images
 */

export interface AvatarProps {
  src?: string | null
  alt?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  fallbackIcon?: string
}

export const getAvatarSizeClasses = (size: AvatarProps['size'] = 'md') => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  }

  const iconSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl'
  }

  return {
    container: sizeClasses[size],
    icon: iconSizes[size]
  }
}

export const getDefaultAvatarIcon = (role?: string) => {
  const roleIcons = {
    STUDENT: 'fa-user-graduate',
    MENTOR: 'fa-chalkboard-teacher',
    ADMIN: 'fa-user-shield',
    admin: 'fa-user-shield',
    mentor: 'fa-chalkboard-teacher',
    user: 'fa-user-graduate'
  }

  return roleIcons[role as keyof typeof roleIcons] || 'fa-user'
}

/**
 * Validates if an avatar URL is valid and accessible
 */
export const validateAvatarUrl = (url: string | null): Promise<boolean> => {
  if (!url) return Promise.resolve(false)

  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = url
  })
}

/**
 * Generates a fallback avatar based on user initials
 */
export const getInitialsAvatar = (name: string | null): string => {
  if (!name) return ''

  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2)
}
