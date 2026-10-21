import {NextRequest, NextResponse} from 'next/server'
import {SyncService} from '@/lib/services/sync.service'

/**
 * API endpoint để đồng bộ dữ liệu giữa Supabase và Local DB
 *
 * Các actions:
 * - from-supabase: Đồng bộ từ Supabase về Local DB
 * - to-supabase: Đồng bộ từ Local DB lên Supabase
 * - status: Kiểm tra tình trạng đồng bộ
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {action} = body

        if (!action) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Missing action parameter. Use: from-supabase, to-supabase, or status'
                },
                {status: 400}
            )
        }

        switch (action) {
            case 'from-supabase': {
                const result = await SyncService.syncAllUsersFromSupabase()
                return NextResponse.json(result, {status: result.success ? 200 : 500})
            }

            case 'to-supabase': {
                const result = await SyncService.syncAllUsersToSupabase()
                return NextResponse.json(result, {status: result.success ? 200 : 500})
            }

            case 'status': {
                const result = await SyncService.checkSyncStatus()
                return NextResponse.json(result, {status: 200})
            }

            default:
                return NextResponse.json(
                    {
                        success: false,
                        message: 'Invalid action. Use: from-supabase, to-supabase, or status'
                    },
                    {status: 400}
                )
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error('Error in sync API:', error)
        return NextResponse.json(
            {
                success: false,
                message: `Server error: ${errorMessage}`
            },
            {status: 500}
        )
    }
}

export async function GET() {
    try {
        const result = await SyncService.checkSyncStatus()
        return NextResponse.json(result, {status: 200})
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error('Error checking sync status:', error)
        return NextResponse.json(
            {
                success: false,
                message: `Server error: ${errorMessage}`
            },
            {status: 500}
        )
    }
}

