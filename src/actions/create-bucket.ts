'use server';

import { createClient } from '@supabase/supabase-js';

export async function createBucketIfNotExists() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const bucketName = 'hoex-documents';

    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return { success: false, error: `Failed to list buckets: ${listError.message}` };
    }

    const bucketExists = buckets?.find(bucket => bucket.name === bucketName);

    if (bucketExists) {
      return {
        success: true,
        message: `Bucket '${bucketName}' already exists`,
        created: false,
        bucketInfo: bucketExists
      };
    }

    // Create bucket if it doesn't exist
    const { data: newBucket, error: createError } = await supabase.storage.createBucket(bucketName, {
      public: true, // Make it public so files can be accessed directly
      allowedMimeTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/jpeg',
        'image/png'
      ],
      fileSizeLimit: 10485760 // 10MB
    });

    if (createError) {
      console.error('❌ Error creating bucket:', createError);
      return { success: false, error: `Failed to create bucket: ${createError.message}` };
    }

    return {
      success: true,
      message: `Bucket '${bucketName}' created successfully`,
      created: true,
      bucketInfo: newBucket
    };

  } catch (error) {
    console.error('💥 Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
