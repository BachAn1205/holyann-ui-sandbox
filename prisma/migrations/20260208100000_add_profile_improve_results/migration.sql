-- CreateTable
CREATE TABLE "profile_improve_results" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "analysis_result" JSONB,
    "enhance_result" JSONB,
    "analysis_rating" INTEGER,
    "enhance_rating" INTEGER,
    "analysis_at" TIMESTAMP(6),
    "enhance_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_improve_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profile_improve_results_student_id_key" ON "profile_improve_results"("student_id");

-- CreateIndex
CREATE INDEX "profile_improve_results_student_id_idx" ON "profile_improve_results"("student_id");

-- AddForeignKey
ALTER TABLE "profile_improve_results" ADD CONSTRAINT "profile_improve_results_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
