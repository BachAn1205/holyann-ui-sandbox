// tests/performance/db-analyze.ts
import 'dotenv/config';
import { prisma } from '../../src/lib/prisma';

async function analyzeQuery() {
    console.log('--- PT-007: Database Query Time Analysis ---');

    // Một ví dụ về câu truy vấn phức tạp (ví dụ: lấy student kèm theo nhiều quan hệ)
    const complexQuery = 'SELECT * FROM "users" u JOIN "students" s ON u.id = s."user_id" LIMIT 10';

    console.log('Đang chạy EXPLAIN ANALYZE cho câu truy vấn mẫu...');

    try {
        // @ts-ignore
        const result = await prisma.$queryRawUnsafe(`EXPLAIN ANALYZE ${complexQuery}`);
        
        console.log('Kết quả phân tích:');
        console.table(result);

        // Đo thời gian thực tế từ phía ứng dụng
        const start = Date.now();
        await prisma.users.findMany({
            take: 10,
            include: {
                students: true
            }
        });
        const duration = Date.now() - start;
        console.log(`Thời gian phản hồi từ Prisma: ${duration}ms`);

        if (duration > 100) {
            console.warn('⚠️ Cảnh báo: Truy vấn tốn hơn 100ms. Cần xem xét thêm Index.');
        } else {
            console.log('✅ Hiệu năng truy vấn tốt.');
        }

    } catch (error) {
        console.error('Lỗi khi phân tích truy vấn:', error);
    } finally {
        await prisma.$disconnect();
    }
}

analyzeQuery();
