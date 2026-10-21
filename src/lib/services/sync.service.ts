import {supabase} from '@/lib/supabase'
import {prisma} from '@/lib/prisma'

/**
 * Service để đồng bộ dữ liệu giữa Supabase và Local Database
 */
export class SyncService {
    /**
     * Đồng bộ tất cả users từ Supabase về Local DB
     */
    static async syncAllUsersFromSupabase(): Promise<{
        success: boolean
        synced: number
        failed: number
        message: string
    }> {
        try {
            // Lấy tất cả users từ Supabase
            const {data: supabaseUsers, error} = await supabase
                .from('users')
                .select('*')

            if (error) {
                console.error('❌ [SyncService] Failed to fetch users from Supabase:', error)
                return {
                    success: false,
                    synced: 0,
                    failed: 0,
                    message: `Lỗi khi lấy dữ liệu từ Supabase: ${error.message}`
                }
            }

            if (!supabaseUsers || supabaseUsers.length === 0) {
                return {
                    success: true,
                    synced: 0,
                    failed: 0,
                    message: 'Không có user nào để đồng bộ'
                }
            }

            let synced = 0
            let failed = 0

            // Đồng bộ từng user
            for (const user of supabaseUsers) {
                try {
                    await prisma.users.upsert({
                        where: {id: user.id},
                        update: {
                            full_name: user.full_name,
                            email: user.email,
                            password_hash: user.password_hash,
                            role: user.role,
                            auth_provider: user.auth_provider || 'LOCAL',
                            auth_provider_id: user.auth_provider_id,
                            avatar_url: user.avatar_url,
                            is_active: user.is_active ?? true,
                            created_at: user.created_at ? new Date(user.created_at) : new Date()
                        },
                        create: {
                            id: user.id,
                            full_name: user.full_name,
                            email: user.email,
                            password_hash: user.password_hash,
                            role: user.role,
                            auth_provider: user.auth_provider || 'LOCAL',
                            auth_provider_id: user.auth_provider_id,
                            avatar_url: user.avatar_url,
                            is_active: user.is_active ?? true,
                            created_at: user.created_at ? new Date(user.created_at) : new Date()
                        }
                    })
                    synced++
                } catch (error: unknown) {
                    failed++
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
                    console.error(`❌ [SyncService] Failed to sync user ${user.email}:`, errorMessage)
                }
            }

            return {
                success: true,
                synced,
                failed,
                message: `Đồng bộ hoàn tất: ${synced} thành công, ${failed} thất bại`
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            console.error('❌ [SyncService] Exception in syncAllUsersFromSupabase:', error)
            return {
                success: false,
                synced: 0,
                failed: 0,
                message: `Lỗi: ${errorMessage}`
            }
        }
    }

    /**
     * Đồng bộ users từ Local DB lên Supabase
     */
    static async syncAllUsersToSupabase(): Promise<{
        success: boolean
        synced: number
        failed: number
        message: string
    }> {
        try {
            // Lấy tất cả users từ Local DB
            const localUsers = await prisma.users.findMany()

            if (!localUsers || localUsers.length === 0) {
                return {
                    success: true,
                    synced: 0,
                    failed: 0,
                    message: 'Không có user nào để đồng bộ'
                }
            }

            let synced = 0
            let failed = 0

            // Đồng bộ từng user
            for (const user of localUsers) {
                try {
                    // Kiểm tra user đã tồn tại trong Supabase chưa
                    const {data: existingUser} = await supabase
                        .from('users')
                        .select('id')
                        .eq('id', user.id)
                        .single()

                    if (existingUser) {
                        // Update
                        const {error} = await supabase
                            .from('users')
                            .update({
                                full_name: user.full_name,
                                email: user.email,
                                password_hash: user.password_hash,
                                role: user.role,
                                auth_provider: user.auth_provider,
                                auth_provider_id: user.auth_provider_id,
                                avatar_url: user.avatar_url,
                                is_active: user.is_active,
                            })
                            .eq('id', user.id)

                        if (error) {
                            throw new Error(error.message)
                        }
                    } else {
                        // Insert
                        const {error} = await supabase
                            .from('users')
                            .insert({
                                id: user.id,
                                full_name: user.full_name,
                                email: user.email,
                                password_hash: user.password_hash,
                                role: user.role,
                                auth_provider: user.auth_provider,
                                auth_provider_id: user.auth_provider_id,
                                avatar_url: user.avatar_url,
                                is_active: user.is_active,
                                created_at: user.created_at?.toISOString()
                            })

                        if (error) {
                            throw new Error(error.message)
                        }
                    }

                    synced++
                } catch (error: unknown) {
                    failed++
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
                    console.error(`❌ [SyncService] Failed to sync user ${user.email} to Supabase:`, errorMessage)
                }
            }

            return {
                success: true,
                synced,
                failed,
                message: `Đồng bộ hoàn tất: ${synced} thành công, ${failed} thất bại`
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            console.error('❌ [SyncService] Exception in syncAllUsersToSupabase:', error)
            return {
                success: false,
                synced: 0,
                failed: 0,
                message: `Lỗi: ${errorMessage}`
            }
        }
    }

    /**
     * Kiểm tra tình trạng đồng bộ giữa 2 database
     */
    static async checkSyncStatus(): Promise<{
        supabaseCount: number
        localCount: number
        inSync: boolean
        message: string
    }> {
        try {
            // Đếm users trong Supabase
            const {count: supabaseCount, error: supabaseError} = await supabase
                .from('users')
                .select('*', {count: 'exact', head: true})

            if (supabaseError) {
                throw new Error(`Supabase error: ${supabaseError.message}`)
            }

            // Đếm users trong Local DB
            const localCount = await prisma.users.count()

            const inSync = supabaseCount === localCount

            return {
                supabaseCount: supabaseCount || 0,
                localCount,
                inSync,
                message: inSync
                    ? `✅ Databases đang đồng bộ (${localCount} users)`
                    : `⚠️ Databases không đồng bộ - Supabase: ${supabaseCount}, Local: ${localCount}`
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            console.error('❌ [SyncService] Error checking sync status:', error)
            return {
                supabaseCount: 0,
                localCount: 0,
                inSync: false,
                message: `Lỗi khi kiểm tra: ${errorMessage}`
            }
        }
    }
}

