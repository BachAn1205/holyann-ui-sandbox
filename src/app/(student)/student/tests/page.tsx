"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { StudentPageContainer } from "@/components/student";
import {
  TestSelection,
  TestView,
  ResultView,
  RecommendFacultySection,
  RecommendFacultyHistorySection,
} from "@/components/student/assessments";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { TestType, Question, TestResult } from "@/components/types";
import { MBTI_QUESTIONS, GRIT_QUESTIONS, RIASEC_QUESTIONS } from "@/constants";
import {
  calculateMBTIResult as calculateMBTIScores,
  MBTI_TYPE_DESCRIPTIONS,
} from "@/data/mbti-questions";
import {
  calculateRIASECResult as calculateRIASECScores,
  getHollandCodeDescription,
  RIASEC_CATEGORIES,
} from "@/data/riasec-questions";
import {
  calculateGritResult as calculateGritScores,
  GRIT_COMPONENTS,
} from "@/data/grit-questions";
import { useTestProgress } from "@/hooks/useTestProgress";
import { useSession } from "next-auth/react";

type ViewState = "selection" | "test" | "result";

const URL_TYPE_TO_TEST: Record<string, TestType> = {
  mbti: "MBTI",
  grit: "GRIT",
  riasec: "RIASEC",
};

/** Ẩn mặc định. Bật làm lại bài: NEXT_PUBLIC_SHOW_TEST_RETRY=true */
const SHOW_TEST_RETRY =
  process.env.NEXT_PUBLIC_SHOW_TEST_RETRY === "true";

function TestsPageContent() {
  const searchParams = useSearchParams();
  const [viewState, setViewState] = useState<ViewState>("selection");
  const [currentTestType, setCurrentTestType] = useState<TestType | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const { data: session } = useSession();
  const hasAutoStartedFromUrl = useRef(false);

  const [currentTestId, setCurrentTestId] = useState<string | null>(null);
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [initialAnswersForTest, setInitialAnswersForTest] = useState<
    Record<number, string | number | boolean>
  >({});
  const [resetConfirmType, setResetConfirmType] = useState<TestType | null>(
    null,
  );
  const [resetLoading, setResetLoading] = useState(false);
  /** Full-screen loading trong TestView khi nộp bài / lưu tiến độ (gọi API) */
  const [isSubmittingTest, setIsSubmittingTest] = useState(false);

  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any>(null);

  // State để lưu remainingTests tại thời điểm hoàn thành test (để tránh async state issue)
  const [currentRemainingTests, setCurrentRemainingTests] = useState<
    TestType[]
  >([]);
  const [currentAllCompleted, setCurrentAllCompleted] = useState(false);

  // Memoize studentId để tránh re-render không cần thiết
  const studentId = useMemo(() => {
    // 1. Thử lấy từ NextAuth session trước
    const sessionUserId =
      (session?.user as any)?.id || (session?.user as any)?.user_id;
    if (sessionUserId) {
      return sessionUserId as string;
    }

    return null;
  }, [session?.user]);

  // Student profile should be created automatically during registration
  // No need to create it here - if missing, it's a data sync issue that should be fixed at the source

  // Hook để quản lý tiến độ test - giờ lấy từ database
  const { progress, isLoaded, saveTestResult, refreshProgress } =
    useTestProgress(studentId);

  const getStudentId = () => studentId;

  // Đồng bộ remainingTests và allCompleted từ progress hook
  useEffect(() => {
    setCurrentAllCompleted(progress.allCompleted);
    const allTests: TestType[] = ["MBTI", "GRIT", "RIASEC"];
    setCurrentRemainingTests(
      allTests.filter((t) => !progress.completedTests.includes(t)),
    );
  }, [progress]);

  // Mở đúng bài test khi vào từ URL ?type=mbti|grit|riasec (vd. redirect từ /dashboard/tests?type=mbti)
  useEffect(() => {
    if (hasAutoStartedFromUrl.current || !isLoaded || !studentId) return;
    const typeParam = searchParams.get("type");
    const testType = typeParam
      ? URL_TYPE_TO_TEST[typeParam.toLowerCase()]
      : null;
    if (!testType) return;
    hasAutoStartedFromUrl.current = true;
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "/student/tests");
    }
    handleStartTest(testType);
  }, [isLoaded, studentId, searchParams]);

  const handleStartTest = async (type: TestType) => {
    const studentId = getStudentId();
    if (!studentId) {
      toast.error("Không tìm thấy thông tin người dùng", {
        description: "Vui lòng đăng nhập lại để tiếp tục",
      });
      return;
    }

    // Check if test is already completed - prevent retaking
    if (progress.completedTests.includes(type)) {
      toast.info("Bài test đã hoàn thành", {
        description:
          "Bạn chỉ có thể xem kết quả, không thể làm lại bài test này.",
      });
      handleViewResult(type);
      return;
    }

    try {
      const res = await fetch("/api/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          test_type: type.toLowerCase(),
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("API Error:", res.status, errorText);
        toast.error("Không thể bắt đầu bài test", {
          description: `Lỗi server (${res.status}). Vui lòng thử lại sau.`,
        });
        return;
      }

      const data = await res.json();

      if (!data.success) {
        console.error("Test creation failed:", data.error);
        toast.error("Không thể bắt đầu bài test", {
          description: data.error || "Đã xảy ra lỗi không xác định",
        });
        return;
      }

      setCurrentTestId(data.test_id);
      setCurrentQuestions(data.questions || getQuestionsForTest(type));
      setCurrentTestType(type);
      setInitialAnswersForTest(
        data.answers
          ? normalizeAnswers(data.answers as Record<string, unknown>)
          : {},
      );
      setViewState("test");

      toast.success(
        data.message === "Continuing existing test"
          ? "Tiếp tục làm bài test"
          : "Bắt đầu bài test thành công",
        {
          description:
            data.message === "Continuing existing test"
              ? "Đáp án đã lưu trước đó đã được khôi phục."
              : `Bạn đã bắt đầu làm bài test ${type}. Chúc bạn làm bài tốt!`,
        },
      );
    } catch (e) {
      console.error("Start test failed", e);
      toast.error("Không thể bắt đầu bài test", {
        description: "Vui lòng kiểm tra kết nối mạng và thử lại",
      });
    }
  };

  const getQuestionsForTest = (type: TestType): Question[] => {
    if (currentTestType === type && currentQuestions.length)
      return currentQuestions;
    switch (type) {
      case "MBTI":
        return MBTI_QUESTIONS;
      case "GRIT":
        return GRIT_QUESTIONS;
      case "RIASEC":
        return RIASEC_QUESTIONS;
      default:
        return [];
    }
  };

  /** Chuẩn hóa answers từ API (key có thể là string) sang Record<number, ...> */
  const normalizeAnswers = (
    raw:
      | Record<string, unknown>
      | unknown[]
      | Record<number, string | number | boolean>,
  ): Record<number, string | number | boolean> => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    const out: Record<number, string | number | boolean> = {};
    Object.entries(raw).forEach(([k, v]) => {
      const num = Number(k);
      if (
        !Number.isNaN(num) &&
        (typeof v === "string" ||
          typeof v === "number" ||
          typeof v === "boolean")
      ) {
        out[num] = v;
      }
    });
    return out;
  };

  const submitAnswersToApi = async (
    answers: Record<number, string | number | boolean>,
    testType: TestType,
  ) => {
    if (!currentTestId) return;
    const studentId = getStudentId();
    if (!studentId) {
      console.error("No student ID found");
      return;
    }

    const response = await fetch("/api/tests/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        test_id: currentTestId,
        student_id: studentId,
        test_type: testType.toLowerCase(),
        answers,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error("❌ [Submit] Failed:", data.error);
      toast.error("Nộp bài test thất bại", {
        description:
          data.error || "Đã xảy ra lỗi khi nộp bài. Vui lòng thử lại.",
      });
      throw new Error(data.error || "Failed to submit test");
    }

    toast.success("Nộp bài test thành công", {
      description: "Đáp án của bạn đã được lưu. Đang xử lý kết quả...",
    });
    return data.result;
  };

  /** Chỉ lưu tiến độ (không gọi server AI). Dùng khi nộp khi còn thiếu câu. */
  const saveProgressToApi = async (
    answers: Record<number, string | number | boolean>,
    testType: TestType,
    currentStep: number,
  ) => {
    if (!currentTestId) return;
    const studentId = getStudentId();
    if (!studentId) return;

    const response = await fetch("/api/tests/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        test_id: currentTestId,
        student_id: studentId,
        test_type: testType.toLowerCase(),
        answers,
        save_progress_only: true,
        current_step: currentStep,
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      toast.error("Lưu tiến độ thất bại", {
        description: data.error || "Vui lòng thử lại.",
      });
      throw new Error(data.error || "Failed to save progress");
    }
  };

  const calculateMBTIResult = (
    answers: Record<number, string | number | boolean>,
  ): TestResult => {
    // Chuyển đổi answers sang Record<number, number> cho hàm tính điểm
    const numericAnswers: Record<number, number> = {};
    Object.entries(answers).forEach(([key, value]) => {
      numericAnswers[Number(key)] = Number(value);
    });

    // Sử dụng hàm tính điểm từ file mbti-questions.ts
    const result = calculateMBTIScores(numericAnswers);
    const typeInfo = MBTI_TYPE_DESCRIPTIONS[result.type];

    return {
      type: "MBTI",
      scores: result.percentages,
      rawLabel: result.type,
      description: typeInfo
        ? `${typeInfo.title} (${typeInfo.nickname}) - ${typeInfo.description}`
        : `Kết quả MBTI của bạn: ${result.type}`,
    };
  };

  const calculateGritResult = (
    answers: Record<number, string | number | boolean>,
  ): TestResult => {
    // Chuyển đổi answers sang Record<number, number> cho hàm tính điểm
    const numericAnswers: Record<number, number> = {};
    Object.entries(answers).forEach(([key, value]) => {
      numericAnswers[Number(key)] = Number(value);
    });

    // Sử dụng hàm tính điểm từ file grit-questions.ts
    const result = calculateGritScores(numericAnswers);

    // Tạo description chi tiết
    const passionInfo = GRIT_COMPONENTS.passion;
    const perseveranceInfo = GRIT_COMPONENTS.perseverance;

    const description = `${result.level.level} (${result.level.level_en}): ${result.level.description}

📊 Chi tiết điểm số:
• ${passionInfo.name_vi} (${passionInfo.name}): ${result.passionScore}/5.0 - ${result.passionLevel.level}
• ${perseveranceInfo.name_vi} (${perseveranceInfo.name}): ${result.perseveranceScore}/5.0 - ${result.perseveranceLevel.level}`;

    return {
      type: "GRIT",
      scores: {
        Grit: result.gritScore,
        [passionInfo.name_vi]: result.passionScore,
        [perseveranceInfo.name_vi]: result.perseveranceScore,
      },
      rawLabel: result.level.level,
      description: description,
    };
  };

  const calculateRIASECResult = (
    answers: Record<number, string | number | boolean>,
  ): TestResult => {
    // Chuyển đổi answers sang Record<number, boolean> cho hàm tính điểm
    const booleanAnswers: Record<number, boolean> = {};
    Object.entries(answers).forEach(([key, value]) => {
      // Xử lý cả boolean trực tiếp và các giá trị khác
      booleanAnswers[Number(key)] =
        value === true || value === "true" || value === 1;
    });

    // Sử dụng hàm tính điểm từ file riasec-questions.ts
    const result = calculateRIASECScores(booleanAnswers);
    const codeInfo = getHollandCodeDescription(result.hollandCode);

    // Tạo description từ top 3 categories
    const topCategoriesDesc = result.topThree
      .map((t) => `${RIASEC_CATEGORIES[t.category].name_vi} (${t.category})`)
      .join(" - ");

    return {
      type: "RIASEC",
      scores: result.percentages,
      rawLabel: result.hollandCode,
      description: `${codeInfo.title}: ${codeInfo.description}\n\nXu hướng chính: ${topCategoriesDesc}`,
    };
  };

  const handleTestComplete = async (
    answers: Record<number, string | number | boolean>,
    currentStep?: number,
  ) => {
    if (!currentTestType) return;
    const studentId = getStudentId();
    if (!studentId || !currentTestId) {
      toast.error("Không tìm thấy student_id hoặc test_id", {
        description: "Vui lòng thử lại.",
      });
      return;
    }

    const totalQuestions = currentQuestions.length;
    const answeredCount = Object.keys(answers).length;
    const unansweredCount = totalQuestions - answeredCount;

    // Nộp khi còn thiếu câu: chỉ lưu tiến độ, không gọi server AI. User làm tiếp sau.
    if (unansweredCount > 0) {
      setIsSubmittingTest(true);
      try {
        await saveProgressToApi(answers, currentTestType, currentStep ?? 0);
        toast.success("Đã lưu tiến độ", {
          description:
            "Bạn còn " +
            unansweredCount +
            " câu chưa trả lời. Có thể vào làm tiếp sau.",
        });
        setViewState("selection");
        setCurrentTestType(null);
        setCurrentTestId(null);
        setCurrentQuestions([]);
        setInitialAnswersForTest({});
        refreshProgress();
      } catch {
        // toast đã trong saveProgressToApi
      } finally {
        setIsSubmittingTest(false);
      }
      return;
    }

    setIsSubmittingTest(true);
    try {
      const apiResult = await submitAnswersToApi(answers, currentTestType);

      // For MBTI, API submit đã gọi MBTI API và lưu scores vào DB
      if (currentTestType === "MBTI") {
        if (apiResult && apiResult.result_type && apiResult.scores) {
          const typeInfo = MBTI_TYPE_DESCRIPTIONS[apiResult.result_type] || {
            title: apiResult.result_type,
            description: "Đang cập nhật mô tả...",
          };
          const desc =
            typeof apiResult.result_description === "string" &&
            apiResult.result_description.trim()
              ? apiResult.result_description
              : typeInfo.description;

          setTestResult({
            type: "MBTI",
            scores: apiResult.scores,
            rawLabel: apiResult.result_type,
            description: desc,
            detailTestExplain:
              typeof apiResult.detail_test_explain === "string"
                ? apiResult.detail_test_explain
                : undefined,
          });
          saveTestResult("MBTI", {
            type: "MBTI",
            scores: apiResult.scores,
            rawLabel: apiResult.result_type,
            description: desc,
            detailTestExplain:
              typeof apiResult.detail_test_explain === "string"
                ? apiResult.detail_test_explain
                : undefined,
          });

          toast.success("Phân tích MBTI hoàn tất", {
            description: `Loại tính cách của bạn: ${apiResult.result_type}`,
          });
        } else {
          // API submit failed - don't use fallback, show error
          throw new Error(
            apiResult?.error ||
              "Không thể phân tích MBTI. Vui lòng thử lại sau.",
          );
        }
      }
      // For other tests, use API result or local calculation
      else {
        let computedResult: TestResult | null = null;

        if (apiResult) {
          if (currentTestType === "RIASEC" && apiResult.result_code) {
            const top3Desc = Array.isArray(apiResult.top3)
              ? apiResult.top3
                  .map((t: string[] | unknown) => (Array.isArray(t) ? t[0] : t))
                  .join(", ")
              : "";
            const desc =
              typeof apiResult.result_description === "string" &&
              apiResult.result_description.trim()
                ? apiResult.result_description
                : top3Desc
                  ? `Xu hướng chính: ${top3Desc}`
                  : "";
            computedResult = {
              type: "RIASEC",
              scores: apiResult.scores || {},
              rawLabel: apiResult.result_code,
              description: desc,
              detailTestExplain:
                typeof apiResult.detail_test_explain === "string"
                  ? apiResult.detail_test_explain
                  : undefined,
            };
          } else if (
            currentTestType === "GRIT" &&
            apiResult.total_score !== undefined
          ) {
            // API không trả Đam mê/Kiên trì → tính từ đáp án để hiển thị breakdown
            const numericAnswers = Object.fromEntries(
              Object.entries(answers).map(([k, v]) => [Number(k), Number(v)]),
            ) as Record<number, number>;
            const localGrit = calculateGritScores(numericAnswers);
            computedResult = {
              type: "GRIT",
              scores: {
                Grit: apiResult.total_score,
                "Đam mê": apiResult.passion_score ?? localGrit.passionScore,
                "Kiên trì":
                  apiResult.perseverance_score ?? localGrit.perseveranceScore,
              },
              rawLabel: apiResult.level,
              description: apiResult.description || "",
              detailTestExplain:
                typeof apiResult.detail_test_explain === "string"
                  ? apiResult.detail_test_explain
                  : undefined,
            };
          }
        }

        // Fall back local calc nếu API không trả về kết quả
        if (!computedResult) {
          console.warn("⚠️ API did not return result, calculating locally");
          switch (currentTestType) {
            case "RIASEC":
              computedResult = calculateRIASECResult(answers);
              break;
            case "GRIT":
              computedResult = calculateGritResult(answers);
              break;
          }
        }

        if (computedResult) {
          setTestResult(computedResult);
          saveTestResult(currentTestType, computedResult);
        }
      }

      // Cập nhật remainingTests & allCompleted tạm thời
      const allTests: TestType[] = ["MBTI", "GRIT", "RIASEC"];
      const newCompleted = progress.completedTests.includes(currentTestType)
        ? progress.completedTests
        : [...progress.completedTests, currentTestType];
      const remaining = allTests.filter(
        (t) => !newCompleted.includes(t),
      ) as TestType[];
      setCurrentRemainingTests(remaining);
      const newAllCompleted = newCompleted.length >= 3;
      setCurrentAllCompleted(newAllCompleted);

      setViewState("result");

      if (newAllCompleted) {
        try {
          await fetch("/api/tests/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ student_id: studentId }),
          });

          toast.success("Hoàn thành tất cả bài test!", {
            description: "Bạn đã hoàn thành tất cả 3 bài test.",
          });
        } catch (e) {
          console.error("Complete all tests error", e);
          toast.error("Lỗi khi cập nhật trạng thái", {
            description: "Vui lòng thử lại sau hoặc liên hệ hỗ trợ",
          });
        }
      }
    } catch (error: any) {
      console.error("❌ Test submission error:", error);

      // Show specific error message for MBTI API failures
      if (currentTestType === "MBTI") {
        toast.error("Không thể phân tích MBTI", {
          description:
            error.message ||
            "Không thể kết nối đến server AI. Vui lòng kiểm tra kết nối và thử lại.",
        });
      } else {
        toast.error("Có lỗi xảy ra khi nộp bài test", {
          description:
            error.message ||
            "Vui lòng thử lại sau. Nếu vấn đề vẫn tiếp tục, hãy liên hệ hỗ trợ.",
        });
      }
    } finally {
      setIsSubmittingTest(false);
    }
  };

  const handleBackToSelection = () => {
    setViewState("selection");
    setCurrentTestType(null);
    setCurrentTestId(null);
    setCurrentQuestions([]);
    setInitialAnswersForTest({});
    setTestResult(null);
  };

  const handleStartNextTest = (type: TestType) => {
    setCurrentTestType(null);
    setTestResult(null);
    handleStartTest(type);
  };

  const handleViewResult = (type: TestType) => {
    const result = progress.results[type];
    if (result) {
      setTestResult(result);
      setCurrentTestType(type);
      setViewState("result");
      toast.success("Đã tải kết quả", {
        description: `Đang hiển thị kết quả bài test ${type}`,
      });
    } else {
      console.warn("No saved result found for", type);
      toast.error("Không tìm thấy kết quả", {
        description: `Chưa có kết quả cho bài test ${type}. Vui lòng làm bài test trước.`,
      });
    }
  };

  const handleOpenResetConfirm = (type: TestType) => {
    setResetConfirmType(type);
  };

  const handleConfirmResetTest = async () => {
    const type = resetConfirmType;
    if (!type) return;
    const sid = getStudentId();
    if (!sid) {
      toast.error("Không tìm thấy thông tin người dùng", {
        description: "Vui lòng đăng nhập lại để tiếp tục",
      });
      setResetConfirmType(null);
      return;
    }
    setResetLoading(true);
    try {
      toast.info("Đang xóa kết quả test cũ...", {
        description: `Đang reset bài test ${type}...`,
      });
      const response = await fetch(`/api/tests/${type.toLowerCase()}/${sid}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Không thể reset test");
      }
      await refreshProgress();
      setResetConfirmType(null);
      setViewState("selection");
      setTestResult(null);
      setCurrentTestType(null);
      toast.success("Đã reset test thành công", {
        description: `Bạn có thể làm lại bài test ${type} ngay bây giờ`,
      });
    } catch (error: unknown) {
      console.error("Reset test error:", error);
      toast.error("Không thể reset test", {
        description:
          error instanceof Error
            ? error.message
            : "Đã xảy ra lỗi. Vui lòng thử lại sau.",
      });
    } finally {
      setResetLoading(false);
    }
  };

  // Loading state khi chưa load xong từ localStorage
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StudentPageContainer>
      <div className="max-w-7xl mx-auto pb-8">
        {viewState === "selection" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mt-6">
            <div className="flex flex-col gap-8">
              <TestSelection
                onStartTest={handleStartTest}
                onViewResult={handleViewResult}
                onResetTest={
                  SHOW_TEST_RETRY ? handleOpenResetConfirm : undefined
                }
                completedTests={progress.completedTests}
                testResults={progress.results}
              />
              
              <RecommendFacultyHistorySection 
                key={historyRefresh}
                studentId={studentId} 
                onSelectItem={setSelectedHistoryItem} 
              />
            </div>

            <div className="flex flex-col gap-8">
              <RecommendFacultySection
                id="recommend-faculty-section"
                studentId={studentId}
                allCompleted={currentAllCompleted}
                selectedHistoryItem={selectedHistoryItem}
                onRunSuccess={() => setHistoryRefresh(r => r + 1)}
              />
            </div>
          </div>
        )}

        {viewState === "test" && currentTestType && (
          <TestView
            testType={currentTestType}
            questions={getQuestionsForTest(currentTestType)}
            initialAnswers={initialAnswersForTest}
            onBack={handleBackToSelection}
            onComplete={handleTestComplete}
            isSubmitting={isSubmittingTest}
            onSaveProgress={async (answers, currentStep) => {
              if (!currentTestType) return;
              await saveProgressToApi(answers, currentTestType, currentStep);
              toast.success("Đã lưu tiến độ", {
                description: "Bạn có thể đóng và làm tiếp sau.",
              });
            }}
          />
        )}

        {viewState === "result" && (
          <ResultView
            result={testResult}
            onBackToDashboard={handleBackToSelection}
            remainingTests={currentRemainingTests}
            onStartNextTest={handleStartNextTest}
            allTestsCompleted={currentAllCompleted}
            showRetryTest={SHOW_TEST_RETRY}
            onRetryTest={
              SHOW_TEST_RETRY && testResult
                ? () => handleOpenResetConfirm(testResult.type)
                : undefined
            }
          />
        )}

        <Dialog
          open={resetConfirmType !== null}
          onOpenChange={(open) => !open && setResetConfirmType(null)}
        >
          <DialogContent className="p-6 sm:p-6 gap-4">
            <DialogHeader>
              <DialogTitle>Làm lại bài test</DialogTitle>
              <DialogDescription>
                Bạn có chắc chắn muốn làm lại bài test {resetConfirmType ?? ""}?
                Kết quả cũ sẽ bị xóa và bạn sẽ làm lại từ đầu.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setResetConfirmType(null)}
                disabled={resetLoading}
              >
                Hủy
              </Button>
              <Button onClick={handleConfirmResetTest} disabled={resetLoading}>
                {resetLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Đã chắc chắn, làm lại"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      </StudentPageContainer>
    </div>
  );
}

export default function TestsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <TestsPageContent />
    </Suspense>
  );
}
