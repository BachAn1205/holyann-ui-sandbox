-- Khớp schema.prisma: cột có trên model nhưng chưa có trong DB ban đầu (mbti_tests tạo ở 20260106092053)
ALTER TABLE "mbti_tests" ADD COLUMN IF NOT EXISTS "result_description" TEXT;
ALTER TABLE "mbti_tests" ADD COLUMN IF NOT EXISTS "detail_test_explain" TEXT;
