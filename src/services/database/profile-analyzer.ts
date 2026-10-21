import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export type StudentProfileData = {
  student: {
    current_school: string | null;
    current_grade: string | null;
    target_faculty_name: string | null;
    target_university_name: string | null;
    yearly_budget: any;
    personal_desire: string | null;
  };
  academic: {
    gpa: any;
    english: any;
    standardized_tests: any;
  } | null;
  background: {
    awards: any[];
    extracurriculars: any[];
    research: any[];
    work_experience: any[];
  } | null;
};

export class ProfileAnalyzerDBService {
  /**
   * Lấy toàn bộ thông tin hồ sơ học sinh để phân tích
   */
  static async getStudentProfile(studentId: string): Promise<StudentProfileData> {
    const student = await prisma.students.findUnique({
      where: { user_id: studentId },
      include: {
        student_academic_profiles: true,
        student_backgrounds: {
          include: {
            academic_awards: true,
            academic_extracurriculars: true,
            non_academic_awards: true,
            non_academic_extracurriculars: true,
            research_experiences: true,
            work_experiences: true,
            personal_projects: true,
          },
        },
      },
    });

    if (!student) {
      throw new Error(`Student not found with ID: ${studentId}`);
    }

    // Format dữ liệu trước khi trả về
    return {
      student: {
        current_school: student.current_school,
        current_grade: student.current_grade,
        target_faculty_name: student.target_faculty_name,
        target_university_name: student.target_university_name,
        yearly_budget: student.yearly_budget,
        personal_desire: student.personal_desire,
      },
      academic: student.student_academic_profiles
        ? {
            gpa: student.student_academic_profiles.gpa_transcript_details,
            english: student.student_academic_profiles.english_certificates,
            standardized_tests: student.student_academic_profiles.standardized_tests,
          }
        : null,
      background: student.student_backgrounds
        ? {
            awards: [
              ...student.student_backgrounds.academic_awards,
              ...student.student_backgrounds.non_academic_awards,
            ],
            extracurriculars: [
              ...student.student_backgrounds.academic_extracurriculars,
              ...student.student_backgrounds.non_academic_extracurriculars,
            ],
            research: student.student_backgrounds.research_experiences,
            work_experience: student.student_backgrounds.work_experiences,
          }
        : null,
    };
  }

  /**
   * Lưu kết quả phân tích AI vào Database (chỉ các cột logic mới).
   */
  static async saveAnalysisResult(
    studentId: string,
    result: {
      full_result: object;
      swot_data?: object;
      input_data?: object;
      areas?: object;
      score_aca?: number | null;
      score_lan?: number | null;
      score_hdnk?: number | null;
      score_skill?: number | null;
    }
  ) {
    const fr = result.full_result as Record<string, unknown> | null;
    const areas =
      result.areas ??
      (fr && typeof fr.areas === "object" && fr.areas != null ? fr.areas : {});
    return await prisma.profile_analyses.create({
      data: {
        id: crypto.randomUUID(),
        student_id: studentId,
        full_result: result.full_result ?? {},
        swot_data: result.swot_data ?? {},
        input_data: result.input_data ?? {},
        areas: areas as object,
        score_aca: result.score_aca ?? null,
        score_lan: result.score_lan ?? null,
        score_hdnk: result.score_hdnk ?? null,
        score_skill: result.score_skill ?? null,
      },
    });
  }
}
