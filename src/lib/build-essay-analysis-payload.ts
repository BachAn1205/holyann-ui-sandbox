import { prisma } from "@/lib/prisma";
import { parseStringArrayJson, resolveEssayTargetMajor, stripHtmlToText } from "@/lib/essay-feature4";

/**
 * Build FastAPI feature4 `analyze_essay` body từ cột đã lưu trên `essays`
 * (nhập tại Quản lý tài liệu). `essay_text` lấy từ `content` sau khi bỏ HTML.
 */
export async function buildEssayAnalysisPayload(
  essayId: string,
  studentUserId: string,
): Promise<Record<string, unknown> | null> {
  const essay = await prisma.essays.findFirst({
    where: { id: essayId, student_id: studentUserId },
    include: {
      target_goal: {
        select: { faculty_name: true, university_name: true },
      },
    },
  });
  if (!essay) return null;

  const strengths = parseStringArrayJson(essay.applicant_core_strengths);
  const entities = parseStringArrayJson(essay.target_program_entities);
  const targetMajor = resolveEssayTargetMajor(essay);

  return {
    essay_text: stripHtmlToText(essay.content),
    // Essay-improve feature4 analysis contract tolerates empty/missing fields;
    // we only require essay_text on the client/backend.
    essay_prompt: essay.essay_prompt?.trim() ?? "",
    target_words: essay.target_words ?? 0,
    target_culture: essay.target_culture?.trim() ?? "",
    applicant_core_strengths: strengths.slice(0, 24),
    target_program_entities: entities.slice(0, 40),
    target_major: targetMajor,
  };
}
