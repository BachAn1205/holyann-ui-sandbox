-- CreateTable
CREATE TABLE "essay_improve_results" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "essay_id" UUID NOT NULL,
    "analysis_result" JSONB,
    "enhance_result" JSONB,
    "analysis_rating" INTEGER,
    "enhance_rating" INTEGER,
    "analysis_at" TIMESTAMP(6),
    "enhance_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "essay_improve_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cv_improve_results" (
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

    CONSTRAINT "cv_improve_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "essay_improve_results_essay_id_key" ON "essay_improve_results"("essay_id");

-- CreateIndex
CREATE INDEX "essay_improve_results_essay_id_idx" ON "essay_improve_results"("essay_id");

-- CreateIndex
CREATE UNIQUE INDEX "cv_improve_results_student_id_key" ON "cv_improve_results"("student_id");

-- CreateIndex
CREATE INDEX "cv_improve_results_student_id_idx" ON "cv_improve_results"("student_id");

-- AddForeignKey
ALTER TABLE "essay_improve_results" ADD CONSTRAINT "essay_improve_results_essay_id_fkey" FOREIGN KEY ("essay_id") REFERENCES "essays"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_improve_results" ADD CONSTRAINT "cv_improve_results_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
