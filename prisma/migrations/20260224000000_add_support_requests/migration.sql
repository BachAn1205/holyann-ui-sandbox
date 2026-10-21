-- CreateTable
CREATE TABLE IF NOT EXISTS "support_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "image_url" VARCHAR(500),
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "support_requests_student_id_idx" ON "support_requests"("student_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "support_requests_status_idx" ON "support_requests"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "support_requests_created_at_idx" ON "support_requests"("created_at");

-- AddForeignKey
ALTER TABLE "support_requests" ADD CONSTRAINT "support_requests_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
