import { NextResponse } from 'next/server'
import { getRecentUsers } from '@/actions/admin/get-recent-users'

export async function GET() {
  try {
    // TODO: Add authentication and authorization checks
    // For now, allowing access to test functionality

    const result = await getRecentUsers()
    return NextResponse.json(result)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}




