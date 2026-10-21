import { StudentProfileData } from "../database/profile-analyzer";

// Mock AI Service URL - In production use process.env.AI_SERVICE_URL
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

export class ProfileAnalyzerAIService {
  static async analyzeProfile(data: StudentProfileData) {
    try {
      const response = await fetch(`${AI_SERVICE_URL}/api/v1/analyze-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`AI Service Error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to call AI Service:", error);
      // For development/mocking purposes when AI is offline:
      if (process.env.NODE_ENV === "development") {
        console.warn("Using mock response for Profile Analysis");
        return this.getMockResponse();
      }
      throw error;
    }
  }

  private static getMockResponse() {
    return {
      overall_score: 85,
      academic_score: 90,
      extracurricular_score: 80,
      summary: "Hồ sơ mạnh về học thuật, cần cải thiện hoạt động ngoại khóa.",
      swot: {
        strengths: ["GPA cao", "IELTS 8.0"],
        weaknesses: ["Ít hoạt động lãnh đạo"],
        opportunities: ["Học bổng Merit-based"],
        threats: ["Cạnh tranh cao ngành CS"],
      },
      academic_analysis: { comments: "Xuất sắc" },
      extracurricular_analysis: { comments: "Khá" },
    };
  }
}
