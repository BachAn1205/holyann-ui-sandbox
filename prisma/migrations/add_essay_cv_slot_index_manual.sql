-- Add slot_index to essays (1-based per student for manage-upload slides)
ALTER TABLE essays ADD COLUMN IF NOT EXISTS slot_index INT;
UPDATE essays e
SET slot_index = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY student_id ORDER BY created_at)::INT AS rn
  FROM essays
) sub
WHERE e.id = sub.id;
UPDATE essays SET slot_index = 1 WHERE slot_index IS NULL;
ALTER TABLE essays ALTER COLUMN slot_index SET DEFAULT 1;
ALTER TABLE essays ALTER COLUMN slot_index SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS essays_student_slot_key ON essays(student_id, slot_index);

-- Add slot_index to student_cv_documents (1-based per student for manage-upload slides)
ALTER TABLE student_cv_documents ADD COLUMN IF NOT EXISTS slot_index INT;
UPDATE student_cv_documents c
SET slot_index = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY student_id ORDER BY uploaded_at)::INT AS rn
  FROM student_cv_documents
) sub
WHERE c.id = sub.id;
UPDATE student_cv_documents SET slot_index = 1 WHERE slot_index IS NULL;
ALTER TABLE student_cv_documents ALTER COLUMN slot_index SET DEFAULT 1;
ALTER TABLE student_cv_documents ALTER COLUMN slot_index SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS student_cv_documents_student_slot_key ON student_cv_documents(student_id, slot_index);
