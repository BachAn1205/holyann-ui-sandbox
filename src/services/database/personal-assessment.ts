import { prisma } from "@/lib/prisma";

export class PersonalAssessmentDBService {
  static async saveMBTIResult(studentId: string, result: any) {
    // Save MBTI result to DB
    // return await prisma.mbti_tests.create(...)
  }

  static async saveRIASECResult(studentId: string, result: any) {
    // Save RIASEC result to DB
    // return await prisma.riasec_tests.create(...)
  }
}
