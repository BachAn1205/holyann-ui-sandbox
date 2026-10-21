import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Test 1: List all buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
      return NextResponse.json({
        success: false,
        error: bucketsError.message,
        step: 'list_buckets'
      }, { status: 500 });
    }

    // Test 2: Check if hoex-documents bucket exists
    const targetBucket = 'hoex-documents';
    const bucketExists = buckets?.find(b => b.name === targetBucket);

    // Test 3: If bucket doesn't exist, create it
    if (!bucketExists) {
      const { data: newBucket, error: createError } = await supabase.storage.createBucket(targetBucket, {
        public: true,
        allowedMimeTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'image/jpeg',
          'image/png'
        ],
        fileSizeLimit: 25 * 1024 * 1024 // 25MB
      });

      if (createError) {
        console.error('❌ Error creating bucket:', createError);
        return NextResponse.json({
          success: false,
          error: createError.message,
          step: 'create_bucket'
        }, { status: 500 });
      }
    }

    // Test 4: Try to list files in the bucket
    const { data: bucketFiles, error: filesError } = await supabase.storage
      .from(targetBucket)
      .list('', { limit: 10 });

    if (filesError) {
      console.warn('⚠️ Could not list files:', filesError.message);
    }

    return NextResponse.json({
      success: true,
      buckets: buckets?.map(b => ({
        name: b.name,
        id: b.id,
        public: b.public,
        created_at: b.created_at
      })),
      targetBucket: {
        name: targetBucket,
        exists: !!bucketExists,
        files: bucketFiles?.length || 0
      },
      message: bucketExists
        ? `Bucket '${targetBucket}' exists and accessible`
        : `Bucket '${targetBucket}' created successfully`
    });

  } catch (error) {
    console.error('💥 Storage setup error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to setup Supabase Storage'
    }, { status: 500 });
  }
}

