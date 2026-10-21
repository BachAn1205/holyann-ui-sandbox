UPDATE "checklist_tasks" ct
SET "link_to" = '__CUSTOM_TASK__'
WHERE EXISTS (
  SELECT 1
  FROM "mentor_custom_deadlines" mcd
  WHERE mcd."id" = ct."id"
)
AND (ct."link_to" IS NULL OR ct."link_to" <> '__CUSTOM_TASK__');
