import { NextRequest, NextResponse } from 'next/server'
import { uploadFileServerAction } from '@/actions/upload'
import { requireAuthenticatedUser } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  try {
    await requireAuthenticatedUser()

    const formData = await request.formData()
    const avatar = formData.get('avatar') as File

    if (!avatar) {
      return NextResponse.json(
        { success: false, error: 'No avatar file provided' },
        { status: 400 }
      )
    }

    if (!avatar.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'File phải là hình ảnh' },
        { status: 400 }
      )
    }

    if (avatar.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Kích thước file không được vượt quá 5MB' },
        { status: 400 }
      )
    }

    const uploadFormData = new FormData()
    uploadFormData.append('file', avatar)
    uploadFormData.append('folder', 'avatars')

    const result = await uploadFileServerAction(uploadFormData)

    if (result.success) {
      return NextResponse.json({
        success: true,
        url: result.url,
        message: 'Avatar uploaded successfully'
      })
    }

    console.error('❌ Avatar upload failed:', result.error)
    return NextResponse.json(
      { success: false, error: result.error || 'Upload failed' },
      { status: 500 }
    )
  } catch (error) {
    console.error('❌ Avatar upload API error:', error)
    const status = error instanceof Error && error.message === 'UNAUTHORIZED' ? 401 : 500
    return NextResponse.json(
      {
        success: false,
        error: status === 401 ? 'Unauthorized' : error instanceof Error ? error.message : 'Unknown upload error'
      },
      { status }
    )
  }
}
