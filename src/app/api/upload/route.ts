import { NextRequest, NextResponse } from 'next/server';
import { uploadFileServerAction } from '@/actions/upload';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        // Call the server action
        const result = await uploadFileServerAction(formData);

        if (result.success) {
            return NextResponse.json(result);
        } else {
            return NextResponse.json(result, { status: 400 });
        }

    } catch (error) {
        console.error('❌ Upload API Route error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown upload error'
            },
            { status: 500 }
        );
    }
}
