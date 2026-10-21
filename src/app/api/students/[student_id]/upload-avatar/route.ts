import { NextRequest, NextResponse } from 'next/server';
import { uploadFileServerAction } from '@/actions/upload';
import { prisma } from '@/lib/prisma';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ student_id: string }> }
) {
  try {
    const { student_id } = await params;
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Không có file ảnh được tải lên' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Chỉ chấp nhận ảnh JPG, PNG, WebP hoặc GIF' },
        { status: 400 }
      );
    }

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('userId', student_id);
    uploadFormData.append('folder', 'avatars');

    const result = await uploadFileServerAction(uploadFormData);

    if (!result.success || !result.url) {
      return NextResponse.json(
        { error: result.error || 'Lỗi khi tải ảnh lên' },
        { status: 500 }
      );
    }

    const avatarUrl = result.url;

    await prisma.users.update({
      where: { id: student_id },
      data: { avatar_url: avatarUrl },
    });

    return NextResponse.json({
      success: true,
      avatarUrl,
      message: 'Cập nhật ảnh đại diện thành công',
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return NextResponse.json(
      { error: 'Lỗi khi tải ảnh lên' },
      { status: 500 }
    );
  }
}
