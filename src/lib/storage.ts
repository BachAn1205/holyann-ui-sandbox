// src/lib/storage.ts
import { createClient } from '@supabase/supabase-js'

// 1. Khởi tạo Supabase Client
// Lưu ý: Dùng biến môi trường NEXT_PUBLIC để client-side có thể dùng được
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

const BUCKET_NAME = 'hoex-documents'

/**
 * Hàm upload file chuẩn cho dự án
 * @param file - File người dùng chọn
 * @param userId - ID người dùng (để bỏ vào đúng folder)
 * @param category - Loại file (để chia thư mục con cho gọn)
 */
export async function uploadFileToStorage(
    file: File,
    userId: string,
    category: 'profile' | 'academic' | 'applications' | 'chat' = 'applications'
) {
    try {
        // 2. Tạo tên file duy nhất (timestamp + tên gốc đã làm sạch)
        // VD: 17099999_cv_cua_toi.pdf
        const timestamp = Date.now()
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_').toLowerCase()
        const filePath = `${userId}/${category}/${timestamp}_${cleanFileName}`

        // 3. Thực hiện Upload
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, file, {
                cacheControl: '3600', // Cache trong 1 giờ
                upsert: false // Không cho ghi đè (để giữ lịch sử nếu cần)
            })

        if (error) throw error

        // 4. Lấy URL để lưu vào Database
        // Vì bucket là Private (có Policy), ta nên dùng Public URL nếu muốn đơn giản
        // Hoặc createSignedUrl nếu muốn bảo mật cực cao (URL hết hạn sau 1 khoảng thời gian)
        // Ở đây mình dùng getPublicUrl cho tiện hiển thị
        const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath)

        return {
            success: true,
            url: urlData.publicUrl,
            path: filePath, // Lưu path này để sau này xóa file nếu cần
            name: file.name
        }

    } catch (error) {
        console.error('Upload Error:', error)
        return { success: false, error: (error as Error).message }
    }
}