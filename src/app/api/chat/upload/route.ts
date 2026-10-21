import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { publicUrlForS3Key, s3PutPublicObject } from '@/lib/s3-storage';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const roomId = formData.get('roomId') as string;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    if (!roomId) {
      return NextResponse.json({ success: false, error: 'Room ID is required' }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
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

    return NextResponse.json({
      success: true,
      data: {
        fileUrl: publicUrl,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        thumbnailUrl,
      },
    });
  } catch (error) {
    console.error('Chat S3 upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
