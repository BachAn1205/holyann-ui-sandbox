'use client'

import { useId, useRef, useState } from 'react'
import { UploadCloud, FileText, Loader2, CheckCircle2, AlertCircle, ImagePlus } from 'lucide-react'
import { generateS3UploadSignature } from '@/actions/s3-upload'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type UploadStatus = 'idle' | 'validating' | 'signing' | 'uploading' | 'success' | 'error'

export type ProofUploadVerifyMeta = {
  verifyValid: boolean | null
  verifyError: string | null
}

type S3UploaderProps = {
  /** Sau khi upload S3, gọi API verify (cùng nguồn với Tài liệu đính kèm). */
  studentIdForVerify?: string | null
  /**
   * Lưu vào `uploads/students/{id}/academic/{slug}/...` để hiện đúng trong Tài liệu đính kèm.
   * Xem `ACADEMIC_PROOF_SUBPATH_LABELS` trong `lib/academic-proof-labels.ts`.
   */
  academicSubpath?: string
  onUploadSuccess?: (fileUrl: string, verify?: ProofUploadVerifyMeta) => void
  className?: string
  accept?: string
  /** Custom action to generate upload signature. If not provided, it uses the default one (student upload) */
  uploadAction?: (fileName: string, fileType: string, fileSize: number) => Promise<{url: string, fields: Record<string, string>, fileUrl: string, storageKey: string}>
  /** Compact mode: renders only a small "+ Upload file minh chứng" button instead of the full upload card */
  compact?: boolean
}

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_FILE_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

export default function S3Uploader({
  onUploadSuccess,
  studentIdForVerify,
  academicSubpath,
  className,
  accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx',
  uploadAction,
  compact = false,
}: S3UploaderProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [uploadedUrl, setUploadedUrl] = useState<string>('')

  async function handleFileSelection(file: File | null) {
    if (!file) return

    setError(null)
    setUploadedUrl('')
    setFileName(file.name)
    setStatus('validating')

    if (!ALLOWED_FILE_TYPES.has(file.type)) {
      setStatus('error')
      setError('Sai định dạng file. Chỉ chấp nhận PDF, JPG, PNG, DOC, DOCX.')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setStatus('error')
      setError('File quá lớn. Vui lòng chọn file nhỏ hơn hoặc bằng 5MB.')
      return
    }

    try {
      setStatus('signing')
      
      let signatureResult;
      
      if (uploadAction) {
        signatureResult = await uploadAction(file.name, file.type, file.size)
      } else {
        signatureResult = await generateS3UploadSignature(
          file.name,
          file.type,
          file.size,
          academicSubpath ? { academicSubpath } : undefined
        )
      }
      
      const { url, fields, fileUrl, storageKey } = signatureResult

      setStatus('uploading')
      const formData = new FormData()
      for (const [key, value] of Object.entries(fields)) {
        formData.append(key, value)
      }
      formData.append('file', file)

      const response = await fetch(url, { method: 'POST', body: formData })

      if (!response.ok) throw new Error('Upload to S3 failed')

      setStatus('success')
      setUploadedUrl(fileUrl)

      let verifyMeta: ProofUploadVerifyMeta | undefined
      if (studentIdForVerify) {
        try {
          const vr = await fetch(
            `/api/students/${studentIdForVerify}/verify-uploaded-file`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                publicUrl: fileUrl,
                filename: file.name,
                storagePath: storageKey,
              }),
            },
          )
          const data = (await vr.json()) as {
            documentVerify?: { valid?: unknown }
            verifyError?: string
            error?: string
          }
          if (vr.ok) {
            const v = data.documentVerify?.valid
            verifyMeta = {
              verifyValid: typeof v === 'boolean' ? v : null,
              verifyError: data.verifyError ?? null,
            }
          } else {
            verifyMeta = {
              verifyValid: null,
              verifyError: data.error ?? data.verifyError ?? 'Verify lỗi',
            }
          }
        } catch {
          verifyMeta = {
            verifyValid: null,
            verifyError: 'Không gọi được kiểm tra AI',
          }
        }
      }
      onUploadSuccess?.(fileUrl, verifyMeta)
    } catch (uploadError) {
      console.error('[S3Uploader] Upload failed:', uploadError)
      setStatus('error')
      setError(uploadError instanceof Error ? uploadError.message : 'Upload thất bại. Vui lòng thử lại.')
    }
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    void handleFileSelection(event.target.files?.[0] ?? null)
    event.target.value = ''
  }

  function openFilePicker() {
    inputRef.current?.click()
  }

  const isLoading = status === 'uploading' || status === 'signing' || status === 'validating'

  // ─── Compact mode ────────────────────────────────────────────────────────────
  if (compact) {
    return (
      <div className={cn('inline-flex flex-col items-end gap-1', className)}>
        <input
          ref={inputRef}
          id={inputId}
          type='file'
          accept={accept}
          className='hidden'
          onChange={handleInputChange}
        />
        <Button
          type='button'
          size='sm'
          variant='outline'
          onClick={openFilePicker}
          disabled={isLoading}
          className={cn(
            'h-7 gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-all',
            'border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400',
            status === 'success' && 'border-emerald-400 text-emerald-600 hover:bg-emerald-50',
            status === 'error' && 'border-red-400 text-red-600 hover:bg-red-50',
          )}
        >
          {isLoading ? (
            <><Loader2 className='h-3 w-3 animate-spin' /> Đang tải...</>
          ) : status === 'success' ? (
            <><CheckCircle2 className='h-3 w-3' /> Đã tải lên</>
          ) : status === 'error' ? (
            <><AlertCircle className='h-3 w-3' /> Thử lại</>
          ) : (
            <><ImagePlus className='h-3 w-3' /> + Upload file minh chứng</>
          )}
        </Button>
        {error && <p className='text-[11px] text-red-500 max-w-[200px] text-right'>{error}</p>}
      </div>
    )
  }

  // ─── Full mode (default) ──────────────────────────────────────────────────────
  const statusText = {
    idle: 'Chưa chọn file',
    validating: 'Đang kiểm tra file...',
    signing: 'Đang lấy chữ ký upload...',
    uploading: 'Đang upload lên S3...',
    success: 'Upload hoàn thành',
    error: 'Upload thất bại',
  }[status]

  return (
    <div className={cn('w-full space-y-3', className)}>
      <input
        ref={inputRef}
        id={inputId}
        type='file'
        accept={accept}
        className='hidden'
        onChange={handleInputChange}
      />

      <div
        role='button'
        tabIndex={0}
        onClick={openFilePicker}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            openFilePicker()
          }
        }}
        className={cn(
          'group relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 text-left shadow-sm transition',
          'hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-300',
          status === 'error' && 'border-red-300 bg-red-50/70',
          status === 'success' && 'border-emerald-300 bg-emerald-50/70'
        )}
      >
        <div className='flex items-start gap-4'>
          <div className='flex size-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white'>
            {isLoading ? (
              <Loader2 className='size-5 animate-spin' />
            ) : status === 'success' ? (
              <CheckCircle2 className='size-5' />
            ) : status === 'error' ? (
              <AlertCircle className='size-5' />
            ) : (
              <UploadCloud className='size-5' />
            )}
          </div>

          <div className='min-w-0 flex-1'>
            <p className='mt-1 text-sm text-slate-500'>
              Chọn PDF, JPG, PNG, DOC hoặc DOCX. Giới hạn tối đa 5MB.
            </p>
            <div className='mt-4 flex flex-wrap items-center gap-3'>
              <Button
                type='button'
                size='sm'
                onClick={(event) => {
                  event.stopPropagation()
                  openFilePicker()
                }}
                disabled={isLoading}
              >
                {isLoading ? 'Đang xử lý...' : 'Chọn file'}
              </Button>
              <span className='text-xs font-medium uppercase tracking-[0.2em] text-slate-400'>
                {statusText}
              </span>
            </div>
          </div>
        </div>
      </div>

      {fileName ? (
        <div className='flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700'>
          <FileText className='size-4 text-slate-400' />
          <span className='truncate'>{fileName}</span>
        </div>
      ) : null}

      {uploadedUrl ? (
        <p className='text-sm break-all text-emerald-600'>
          Upload thành công. File URL: {uploadedUrl}
        </p>
      ) : null}

      {error ? (
        <p className='text-sm text-red-600'>{error}</p>
      ) : null}
    </div>
  )
}
