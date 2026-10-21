/**
 * AI API Client Utility
 *
 * Centralized client for calling FastAPI AI server endpoints
 * Uses AI_SERVER_URL from environment variables
 */

const AI_API_BASE = process.env.AI_SERVER_URL || "http://127.0.0.1:8000";

// Ensure base URL doesn't have trailing slash
const getBaseUrl = () => {
  const base = AI_API_BASE.replace(/\/+$/, "");
  // If AI_SERVER_URL is just IP:port, add http://
  if (!base.startsWith("http://") && !base.startsWith("https://")) {
    return `http://${base}`;
  }
  return base;
};

const BASE_URL = getBaseUrl();

/** Base URL đã resolve (AI_SERVER_URL hoặc mặc định) — log / metadata response. */
export function getResolvedAIServerBaseUrl(): string {
  return BASE_URL;
}

export const FEATURE7_VERIFY_DOCUMENT_PATH = "/api/v1/feature7/verify-document";

const DEFAULT_TIMEOUT_MS = 30_000;
/** Feature 1 profile-analysis: NLP + xử lý có thể 2–5 phút */
const PROFILE_ANALYSIS_TIMEOUT_MS = 300_000; // 5 phút

/**
 * Call AI API endpoint
 * @param options.timeoutMs - Timeout (ms). Dùng PROFILE_ANALYSIS_TIMEOUT_MS cho profile-analysis.
 */
export async function callAIAPI<T = any>(
  endpoint: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: any;
    headers?: Record<string, string>;
    timeoutMs?: number;
  } = {},
): Promise<T> {
  const {
    method = "POST",
    body,
    headers = {},
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = options;

  // Ensure endpoint starts with /
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${BASE_URL}${path}`;

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  const fetchOptions: RequestInit = {
    method,
    headers: requestHeaders,
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  };

  if (body && method !== "GET") {
    fetchOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      const errorText = await response.text();
      let errorData: any;
      try {
        errorData = errorText
          ? JSON.parse(errorText)
          : { error: "Unknown error" };
      } catch {
        errorData = { error: errorText || "Unknown error" };
      }

      console.error(`❌ [AI API] Error ${response.status}:`, errorData);

      // Extract detailed error message from API
      let errorMessage: any = errorData.error || errorData.message || errorData.detail;

      // If Django returned a traceback or detailed error, try to extract it
      if (typeof errorData === "object") {
        // Check for nested error structures
        if (errorData.details) {
          errorMessage = errorData.details;
        } else if (errorData.traceback) {
          errorMessage = errorData.traceback;
        }
      }

      // If API returned an object (e.g., FastAPI detail dict), stringify safely.
      if (errorMessage && typeof errorMessage === "object") {
        if ("error" in errorMessage && typeof errorMessage.error === "string") {
          errorMessage = errorMessage.error;
        } else if ("message" in errorMessage && typeof errorMessage.message === "string") {
          errorMessage = errorMessage.message;
        } else {
          try {
            errorMessage = JSON.stringify(errorMessage);
          } catch {
            errorMessage = String(errorMessage);
          }
        }
      }

      // If still no clear message, use the raw error text
      if (!errorMessage || errorMessage === "Unknown error") {
        errorMessage =
          errorText.substring(0, 500) || `AI API returned ${response.status}`;
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`❌ [AI API] Request failed:`, error);

    // Check for specific error types
    if (error instanceof Error) {
      if (
        error.name === "AbortError" ||
        (error as any).name === "TimeoutError"
      ) {
        const sec = Math.round(timeoutMs / 1000);
        throw new Error(
          `AI server không phản hồi sau ${sec} giây. Kiểm tra server tại ${BASE_URL} hoặc thử lại.`,
        );
      }
      if (
        error.message.includes("fetch failed") ||
        error.message.includes("ECONNREFUSED")
      ) {
        throw new Error(
          `Cannot connect to AI server at ${BASE_URL}. Please ensure Django server is running.`,
        );
      }
      throw error;
    }
    throw new Error("Failed to call AI API");
  }
}

/**
 * Feature 1: Profile Analysis (input theo input-analysis.json → output pillar_scores, spikes, areas, swot)
 * FastAPI endpoint: POST /api/v1/feature1/analysis-profile
 */
export async function callProfileAnalysis(payload: any) {
  return callAIAPI("/api/v1/feature1/analysis-profile", {
    method: "POST",
    body: payload,
    timeoutMs: PROFILE_ANALYSIS_TIMEOUT_MS,
  });
}

/**
 * Feature 1: Enhance Profile (analysis_information + willing_area → list_suggestion, roadmap, pillar_score_after_enhance)
 * FastAPI endpoint: POST /api/v1/feature1/enhence-profile
 */
export async function callEnhanceProfile(payload: {
  analysis_information: Record<string, unknown>;
  willing_area: "A" | "B" | "C";
}) {
  return callAIAPI("/api/v1/feature1/enhence-profile", {
    method: "POST",
    body: payload,
    timeoutMs: PROFILE_ANALYSIS_TIMEOUT_MS,
  });
}

import type {
  MBTIInput,
  MBTIOutput,
  GritInput,
  GritOutput,
  RIASECInput,
  RIASECOutput,
} from "./schemas/career-assessment.schema";

/**
 * Feature 2: MBTI Assessment Only
 * FastAPI endpoint: POST /api/v1/feature2/mbti
 */
export async function callMBTIAssessment(
  answers: number[],
): Promise<MBTIOutput> {
  const payload: MBTIInput = { answers };
  return callAIAPI<MBTIOutput>("/api/v1/feature2/mbti", {
    method: "POST",
    body: payload,
  });
}

/**
 * Feature 2: GRIT Scale Assessment Only
 * FastAPI endpoint: POST /api/v1/feature2/grit-scale
 */
export async function callGritAssessment(
  answers: Record<string, number>,
): Promise<GritOutput> {
  const payload: GritInput = { answers };
  return callAIAPI<GritOutput>("/api/v1/feature2/grit-scale", {
    method: "POST",
    body: payload,
  });
}

/**
 * Feature 2: RIASEC Assessment Only
 * FastAPI endpoint: POST /api/v1/feature2/riasec
 */
export async function callRIASECAssessment(
  answers: Record<string, number>,
): Promise<RIASECOutput> {
  const payload: RIASECInput = { answers };
  return callAIAPI<RIASECOutput>("/api/v1/feature2/riasec", {
    method: "POST",
    body: payload,
  });
}

/** Kết quả FastAPI feature3 — `app/docs/api-logic/feature3/output.json` */
export type AdmissionChanceApiResult = {
  reach: unknown[];
  match: unknown[];
  safety: unknown[];
  faculties_detail?: unknown;
};

/**
 * Feature 3: Admission chance (Reach / Match / Safety)
 * Payload theo `app/docs/api-logic/feature3/input.json` (fast-api-server-ai).
 */
export async function callAdmissionChance(
  payload: Record<string, unknown>,
): Promise<AdmissionChanceApiResult> {
  return callAIAPI<AdmissionChanceApiResult>("/api/v1/feature3/admission-chance", {
    method: "POST",
    body: payload,
    timeoutMs: 120_000,
  });
}

/**
 * Feature 4: Phân tích bài luận — POST /api/v1/feature4/analysis-essay
 */
export async function callEssayAnalysis(payload: Record<string, unknown>) {
  return callAIAPI("/api/v1/feature4/analysis-essay", {
    method: "POST",
    body: payload,
    timeoutMs: PROFILE_ANALYSIS_TIMEOUT_MS,
  });
}

/**
 * Feature 4: Gợi ý cải thiện bài luận — POST /api/v1/feature4/enhance-essay
 */
export async function callEssayEnhance(payload: Record<string, unknown>) {
  return callAIAPI("/api/v1/feature4/enhance-essay", {
    method: "POST",
    body: payload,
    timeoutMs: PROFILE_ANALYSIS_TIMEOUT_MS,
  });
}

/** Feature 7: verify tài liệu chung — POST /api/v1/feature7/verify-document */
export async function callVerifyDocument(payload: Record<string, unknown>) {
  return callAIAPI(FEATURE7_VERIFY_DOCUMENT_PATH, {
    method: "POST",
    body: payload,
    timeoutMs: 120_000,
  });
}

/** Feature 7: verify CV (heuristic) — POST /api/v1/feature7/verify-cv */
export async function callCvVerify(payload: Record<string, unknown>) {
  return callAIAPI("/api/v1/feature7/verify-cv", {
    method: "POST",
    body: payload,
    timeoutMs: 120_000,
  });
}

/** Feature 7: phân tích CV — POST /api/v1/feature7/analysis-cv */
export async function callCvAnalysis(payload: Record<string, unknown>) {
  return callAIAPI("/api/v1/feature7/analysis-cv", {
    method: "POST",
    body: payload,
    timeoutMs: PROFILE_ANALYSIS_TIMEOUT_MS,
  });
}

/** Feature 7: enhance CV — POST /api/v1/feature7/enhance-cv */
export async function callCvEnhance(payload: Record<string, unknown>) {
  return callAIAPI("/api/v1/feature7/enhance-cv", {
    method: "POST",
    body: payload,
    timeoutMs: PROFILE_ANALYSIS_TIMEOUT_MS,
  });
}

const FEATURE8_EVALUATE_TIMEOUT_MS = 420_000;

/**
 * Feature 8: đánh giá một câu trả lời phỏng vấn — POST /api/v1/feature8/evaluate
 */
export async function callFeature8Evaluate(payload: Record<string, unknown>) {
  return callAIAPI("/api/v1/feature8/evaluate", {
    method: "POST",
    body: payload,
    timeoutMs: FEATURE8_EVALUATE_TIMEOUT_MS,
  });
}

export async function callFeature8EvaluateWithVideo(
  payload: Record<string, unknown>,
  video: File | Blob,
  filename = "answer.webm",
) {
  const url = `${BASE_URL}/api/v1/feature8/evaluate-with-video`;
  const form = new FormData();
  form.append("payload", JSON.stringify(payload));
  form.append("video", video, filename);

  const response = await fetch(url, {
    method: "POST",
    body: form,
    cache: "no-store",
    signal: AbortSignal.timeout(FEATURE8_EVALUATE_TIMEOUT_MS),
  });

  const text = await response.text();
  let data: any;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    const msg =
      typeof data.detail === "string"
        ? data.detail
        : typeof data.error === "string"
          ? data.error
          : text || `AI API ${response.status}`;
    throw new Error(msg);
  }

  return data;
}

/**
 * Feature 8: kiểm tra mic — POST multipart tới /api/v1/feature8/test-mic (gọi từ server).
 */
export async function postFeature8TestMic(file: File | Blob, filename = "mic-test.webm") {
  const path = "/api/v1/feature8/test-mic";
  const url = `${BASE_URL}${path}`;
  const form = new FormData();
  form.append("file", file, filename);

  const response = await fetch(url, {
    method: "POST",
    body: form,
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  });

  const text = await response.text();
  let data: Record<string, unknown>;
  try {
    data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    const msg =
      typeof data.detail === "string"
        ? data.detail
        : typeof data.error === "string"
          ? data.error
          : text || `AI API ${response.status}`;
    throw new Error(msg);
  }

  return data;
}
