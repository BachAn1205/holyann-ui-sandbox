"use client"
import { useState } from 'react'
import { getAvatarSizeClasses, getDefaultAvatarIcon, getInitialsAvatar, type AvatarProps } from '@/utils/avatar'
import AvatarUpload from './AvatarUpload'

interface UserAvatarProps extends AvatarProps {
  name?: string | null
  role?: string
  showInitials?: boolean
  onAvatarUpload?: (file: File) => Promise<void>
  clickable?: boolean
}

export default function UserAvatar({
  src,
  alt,
  size = 'md',
  className = '',
  name,
  role,
  showInitials = true,
  fallbackIcon,
  onAvatarUpload,
  clickable = false
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(!!src)
  const [showUploadModal, setShowUploadModal] = useState(false)

  const sizeClasses = getAvatarSizeClasses(size)
  const defaultIcon = fallbackIcon || getDefaultAvatarIcon(role)
  const initials = getInitialsAvatar(name || null)

  const handleImageError = () => {
    setImageError(true)
    setIsLoading(false)
  }

  const handleImageLoad = () => {
    setIsLoading(false)
  }

  const handleAvatarClick = () => {
    if (clickable && onAvatarUpload) {
      setShowUploadModal(true)
    }
  }

  const handleUpload = async (file: File) => {
    if (onAvatarUpload) {
      await onAvatarUpload(file)
    }
  }

  // Show initials if enabled and we have a name but no src or image error
  const shouldShowInitials = showInitials && initials && (!src || imageError)

  // Use default avatar if no src and not showing initials
  const shouldShowDefaultAvatar = !src && !shouldShowInitials

  return (
    <>
      <div
        className={`${sizeClasses.container} rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/20 relative ${className} ${clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
        onClick={handleAvatarClick}
      >
        {src && !imageError ? (
          <>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-primary/5">
                <div className="animate-pulse">
                  <i className={`fas fa-spinner animate-spin text-primary ${sizeClasses.icon}`}></i>
                </div>
              </div>
            )}
            <img
              src={src}
              alt={alt || name || 'Avatar'}
              className="w-full h-full object-cover"
              onError={handleImageError}
              onLoad={handleImageLoad}
              style={{ display: imageError ? 'none' : 'block' }}
            />
          </>
        ) : shouldShowDefaultAvatar ? (
          <img
            src="/images/avatars/avt.jpg"
            alt={alt || name || 'Default Avatar'}
            className="w-full h-full object-cover"
          />
        ) : shouldShowInitials ? (
          <div className={`text-primary font-bold ${sizeClasses.icon} flex items-center justify-center w-full h-full`}>
            {initials}
          </div>
        ) : (
          <i className={`fas ${defaultIcon} text-primary ${sizeClasses.icon}`}></i>
        )}

        {/* Upload indicator when clickable */}
        {clickable && onAvatarUpload && (
          <div className="absolute inset-0 bg-black/0 hover:bg-black/30 flex items-center justify-center transition-all duration-200 opacity-0 hover:opacity-100">
            <i className="fas fa-camera text-white text-sm"></i>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <AvatarUpload
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUpload={handleUpload}
          currentAvatar={src}
        />
      )}
    </>
  )
}
