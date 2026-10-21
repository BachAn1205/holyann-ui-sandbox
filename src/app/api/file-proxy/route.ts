import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('url');
    const download = searchParams.get('download') === 'true'; // Check if this is a download request

    if (!fileUrl) {
      return NextResponse.json({ error: 'Missing file URL' }, { status: 400 });
    }

    // Check if it's a Supabase storage URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!fileUrl.includes(supabaseUrl!)) {
      // Not a Supabase URL, redirect directly
      return NextResponse.redirect(fileUrl);
    }

    // Extract bucket and file path from Supabase URL
    // Format: https://xxx.supabase.co/storage/v1/object/public/bucket-name/file-path
    const urlParts = fileUrl.split('/');

    const storageIndex = urlParts.findIndex(part => part === 'storage');

    if (storageIndex === -1 || storageIndex + 5 >= urlParts.length) {
      console.error('❌ Invalid URL format:', { storageIndex, urlLength: urlParts.length, urlParts });
      return NextResponse.json({
        error: 'Invalid Supabase URL format',
        details: `Expected format: https://xxx.supabase.co/storage/v1/object/public/bucket/file`,
        received: fileUrl,
        parsedParts: urlParts
      }, { status: 400 });
    }

    // Skip: storage/v1/object/public -> get bucket name and file path
    const bucketName = urlParts[storageIndex + 4]; // storage/v1/object/public/[bucket-name]
    const filePath = urlParts.slice(storageIndex + 5).join('/'); // everything after bucket name

    if (!bucketName || !filePath) {
      return NextResponse.json({
        error: 'Could not extract bucket name or file path',
        bucketName,
        filePath,
        urlParts
      }, { status: 400 });
    }

    // Create Supabase client with service role to bypass RLS
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl!, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Download the file
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(filePath);

    if (error) {
      console.error('❌ Supabase download error:', error);
      return NextResponse.json({
        error: 'Failed to download file',
        details: error.message
      }, { status: 404 });
    }

    // Get the file's content type
    const contentType = data.type || 'application/octet-stream';

    // Extract filename from the file path for download
    const fileName = filePath.split('/').pop() || 'download';

    // Convert blob to ArrayBuffer
    const arrayBuffer = await data.arrayBuffer();

    // Return the file with proper headers
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': arrayBuffer.byteLength.toString(),
        'Content-Disposition': download
          ? `attachment; filename="${fileName}"` // Force download
          : `inline; filename="${fileName}"`,    // Preview in browser
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Expose-Headers': 'Content-Disposition', // Allow client to read this header
      },
    });

  } catch (error) {
    console.error('💥 Proxy error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
