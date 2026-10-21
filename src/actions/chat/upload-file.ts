'use server';

import { publicUrlForS3Key, s3DeleteObject, s3PutPublicObject } from '@/lib/s3-storage';
import { extractS3KeyFromPublicUrl } from '@/lib/s3-storage';

function getBucketName(): string {
  const v = process.env.AWS_S3_BUCKET_NAME;
  if (!v) throw new Error('AWS_S3_BUCKET_NAME is not set');
  return v;
}

export async function uploadChatFile(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const roomId = formData.get('roomId') as string;

    if (!file) {
      throw new Error('Không có file được tải lên');
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('Kích thước file vượt quá 10MB');
    }

    const fileExt = file.name.split('.').pop() || 'bin';
    const key = `uploads/users/${userId}/chat/${roomId}/${Date.now()}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await s3PutPublicObject(key, buffer, file.type || 'application/octet-stream');

    const publicUrl = publicUrlForS3Key(key);

    let thumbnailUrl: string | undefined;
    if (file.type.startsWith('image/')) {
      thumbnailUrl = publicUrl;
    }

    return {
      success: true,
      data: {
        fileUrl: publicUrl,
        fileName: file.name,
        fileType: file.type,
        fileSize: BigInt(file.size),
        thumbnailUrl,
      },
    };
  } catch (error: unknown) {
    console.error('Error uploading file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải file',
    };
  }
}

export async function deleteChatFile(fileUrl: string) {
  try {
    const bucket = getBucketName();
    const key = extractS3KeyFromPublicUrl(fileUrl, bucket);
    if (!key) {
      return { success: false, error: 'Không parse được key S3' };
    }
    await s3DeleteObject(key);

    return {
      success: true,
      message: 'Đã xóa file thành công',
    };
  } catch (error: unknown) {
    console.error('Error deleting file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
