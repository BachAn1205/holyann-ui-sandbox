'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, Loader2, FileText, X, AlertCircle, Clock, Eye } from 'lucide-react'
import { uploadFileServerAction, deleteFileServerAction } from '@/actions/upload'
import { cn } from '@/lib/utils'

interface FileUploadProps {
    userId: string
    onUploadComplete: (url: string | null) => void
    label?: string
    category?: 'profile' | 'academic' | 'applications' | 'chat'
    accept?: string
    currentFileUrl?: string
    disabled?: boolean
}

export default function FileUpload({
    userId,
    onUploadComplete,
    label = "Tải tài liệu lên",
    category = "applications",
    accept = ".pdf,.doc,.docx,.txt,.jpg,.png",
    currentFileUrl,
    disabled = false
}: FileUploadProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [fileUrl, setFileUrl] = useState<string | null>(null)
    const [fileName, setFileName] = useState<string | null>(null)
    const [filePath, setFilePath] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Sync internal state when prop changes (handles hydration and parent updates)
    useEffect(() => {
        if (currentFileUrl) {
            setFileUrl(currentFileUrl)
            try {
                const urlParts = currentFileUrl.split('/')
                const fileWithTimestamp = urlParts[urlParts.length - 1]
                const cleanFileName = fileWithTimestamp.replace(/^\d+_/, '')
                setFileName(decodeURIComponent(cleanFileName))
            } catch {
                setFileName('File đã tải lên')
            }
        } else {
            setFileUrl(null)
            setFileName(null)
            setFilePath(null)
        }
    }, [currentFileUrl])

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setError(null)
        setIsUploading(true)
        setFileName(file.name)

        try {
            if (!userId || userId.trim() === '') {
                throw new Error('User not authenticated. Please login and try again.')
            }

            const formData = new FormData()
            formData.append('file', file)
            formData.append('userId', userId.trim())
            formData.append('category', category)

            const result = await uploadFileServerAction(formData)

            if (result.success && result.url) {
                setFileUrl(result.url)
                setFilePath(result.path || null)
                onUploadComplete(result.url)
            } else {
                console.error('❌ Upload failed:', result.error)
                setError(result.error || 'Upload failed')
                setFileName(null)
            }

        } catch (error) {
            console.error('❌ Upload error:', error)
            setError(error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải file')
            setFileName(null)
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const handleRemoveFile = async () => {
        if (!fileUrl) return

        setIsDeleting(true)
        setError(null)

        try {
            if (filePath) {
                const deleteResult = await deleteFileServerAction(filePath)

                if (!deleteResult.success) {
                    console.warn('⚠️ Could not delete file from storage:', deleteResult.error)
                }
            }

            setFileUrl(null)
            setFileName(null)
            setFilePath(null)

            onUploadComplete(null)

        } catch (error) {
            console.error('❌ Delete error:', error)
            setError(error instanceof Error ? error.message : 'Có lỗi khi xóa file')
        } finally {
            setIsDeleting(false)
        }
    }

    // FILE VIEW MODE - Show uploaded file with "Chờ review" status
    if (fileUrl && !isUploading) {
        return (
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-xl p-4 transition-all duration-200">
                <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 p-2 bg-white rounded-lg shadow-sm border border-amber-100">
                        <FileText className="w-6 h-6 text-amber-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                                {fileName || 'File đã tải lên'}
                            </p>
                            <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
                                Chờ review
                            </span>
                            <span className="text-xs text-gray-500">
                                Mentor sẽ xem xét và phê duyệt
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => window.open(fileUrl, '_blank')}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-200 transition-colors"
                        >
                            <Eye size={14} />
                            Xem
                        </button>

                        <button
                            onClick={handleRemoveFile}
                            disabled={isDeleting || disabled}
                            className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                            title="Xóa file và upload lại"
                        >
                            {isDeleting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <X className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            <span className="text-xs text-red-700">{error}</span>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    // UPLOAD MODE - Show dropzone for new uploads
    return (
        <div className="space-y-3">
            <div
                className={cn(
                    "border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer",
                    disabled || isUploading
                        ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
                        : "border-gray-300 hover:border-blue-400 hover:bg-blue-50/30",
                    error && "border-red-300 bg-red-50/30"
                )}
                onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={accept}
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={disabled || isUploading}
                />

                <div className="flex flex-col items-center gap-3">
                    <div className={cn(
                        "p-3 rounded-full",
                        isUploading
                            ? "bg-blue-100"
                            : error
                            ? "bg-red-100"
                            : "bg-gray-100"
                    )}>
                        {isUploading ? (
                            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                        ) : error ? (
                            <AlertCircle className="w-6 h-6 text-red-500" />
                        ) : (
                            <Upload className="w-6 h-6 text-gray-600" />
                        )}
                    </div>

                    <div>
                        <p className={cn(
                            "text-sm font-semibold mb-1",
                            isUploading ? "text-blue-700" : error ? "text-red-700" : "text-gray-700"
                        )}>
                            {isUploading ? `Đang tải lên ${fileName}...` : label}
                        </p>

                        <p className="text-xs text-gray-500">
                            {isUploading
                                ? "Vui lòng đợi..."
                                : "Kéo thả file vào đây hoặc click để chọn file"
                            }
                        </p>

                        <p className="text-xs text-gray-400 mt-1">
                            Hỗ trợ PDF, DOC, DOCX, TXT, JPG, PNG (tối đa 10MB)
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-red-800">Lỗi tải file</p>
                            <p className="text-xs text-red-600">{error}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
