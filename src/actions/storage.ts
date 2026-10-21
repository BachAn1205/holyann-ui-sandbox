'use server'

import { createClient } from '@supabase/supabase-js'

// Initialize Supabase Admin Client (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration')
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const BUCKET_NAME = 'hoex-documents'

interface SignedUrlResult {
  success: boolean
  signedUrl?: string
  error?: string
}

/**
 * Server Action: Generate Signed URL for private bucket files
 * Allows temporary access to files without making bucket public
 *
 * @param filePath - File path in bucket (e.g., "user123/chat/file.pdf")
 * @returns Signed URL valid for 1 hour
 */
export async function getSignedUrl(filePath: string): Promise<SignedUrlResult> {
  try {
    // Validate input
    if (!filePath || filePath.trim() === '') {
      return {
        success: false,
        error: 'File path is required',
      }
    }

    // Clean file path (remove leading slashes if any)
    const cleanPath = filePath.replace(/^\/+/, '')

    // Create signed URL with 1 hour expiry
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .createSignedUrl(cleanPath, 3600) // 3600 seconds = 1 hour

    if (error) {
      console.error('❌ [getSignedUrl] Error:', error)
      return {
        success: false,
        error: `Failed to create signed URL: ${error.message}`,
      }
    }

    if (!data?.signedUrl) {
      console.error('❌ [getSignedUrl] No signed URL returned')
      return {
        success: false,
        error: 'No signed URL returned from storage',
      }
    }

    return {
      success: true,
      signedUrl: data.signedUrl,
    }
  } catch (error) {
    console.error('❌ [getSignedUrl] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Helper: Extract file path from full Supabase URL
 *
 * @param fullUrl - Full URL from database
 * @returns File path without bucket prefix
 *
 * @example
 * Input: "https://xxx.supabase.co/storage/v1/object/public/hoex-documents/user123/chat/file.pdf"
 * Output: "user123/chat/file.pdf"
 */
export async function extractPathFromUrl(fullUrl: string): Promise<string | null> {
  try {
    // Handle various URL formats

    // Format 1: Full public URL
    // https://xxx.supabase.co/storage/v1/object/public/hoex-documents/path/to/file
    const publicMatch = fullUrl.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/)
    if (publicMatch) {
      return publicMatch[1]
    }

    // Format 2: Full authenticated URL
    // https://xxx.supabase.co/storage/v1/object/authenticated/hoex-documents/path/to/file
    const authMatch = fullUrl.match(/\/storage\/v1\/object\/authenticated\/[^/]+\/(.+)$/)
    if (authMatch) {
      return authMatch[1]
    }

    // Format 3: Already just the path
    // user123/chat/file.pdf
    if (!fullUrl.includes('http') && !fullUrl.includes('storage')) {
      return fullUrl
    }

    // Format 4: Try to extract anything after bucket name
    const bucketMatch = fullUrl.match(/hoex-documents\/(.+)$/)
    if (bucketMatch) {
      return bucketMatch[1]
    }

    console.warn('⚠️ Could not extract path from URL:', fullUrl)
    return null
  } catch (error) {
    console.error('❌ Error extracting path:', error)
    return null
  }
}

/**
 * Server Action: Get signed URL from full database URL
 * Combines extractPathFromUrl + getSignedUrl
 *
 * @param fullUrl - Full URL stored in database
 * @returns Signed URL result
 */
export async function getSignedUrlFromFullUrl(fullUrl: string): Promise<SignedUrlResult> {
  // S3 public URLs do not need Supabase signed URLs.
  // Return directly to avoid repeated failed extraction and log spam.
  if (fullUrl.includes('amazonaws.com/')) {
    return {
      success: true,
      signedUrl: fullUrl,
    }
  }

  const filePath = await extractPathFromUrl(fullUrl)

  if (!filePath) {
    return {
      success: false,
      error: 'Could not extract file path from URL',
    }
  }

  return await getSignedUrl(filePath)
}
