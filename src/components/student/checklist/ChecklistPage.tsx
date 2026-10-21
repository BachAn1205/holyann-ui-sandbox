"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Flag,
  Rocket,
  Trophy,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Task, Stage, StudentProfile } from "@/components/types";
import ProgressBar from "./ProgressBar";
import StageNavigation from "./StageNavigation";
import { scanCVWithAI } from "@/services/ai/geminiService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChecklistHeader } from "./ChecklistHeader";
import { ChecklistFilters } from "./ChecklistFilters";
import { ChecklistSkeleton } from "./ChecklistSkeleton";
import { TaskGroupSection } from "./TaskGroupSection";
import { groupTasksByDate, sortTasks } from "./checklist-utils";
import { useSubscription } from "@/hooks/useSubscription";

const ChecklistPage: React.FC = () => {
  const normalizeChecklistBrand = (text: string) =>
    text.replace(/\bhoex\b/gi, "Holyann Explore");

  // Fixed: Removed setTaskProgress usage - v2.0
  const { data: session } = useSession();
  const { isPremium } = useSubscription();
  const [stages, setStages] = useState<Stage[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeStageId, setActiveStageId] = useState<number>(1);
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(
    new Set(),
  );
  const [uploadingCV, setUploadingCV] = useState(false);
  const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null);
  const [scanningCV, setScanningCV] = useState(false);
  const [scannedProfile, setScannedProfile] = useState<StudentProfile | null>(
    null,
  );
  const [cvScanError, setCvScanError] = useState<string>("");
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [sortBy, setSortBy] = useState<"due" | "priority" | "title">("due");

  const router = useRouter();
  const initialLoadDone = useRef(false);
  const lastFetchTime = useRef(0);
  const MIN_FETCH_INTERVAL_MS = 8000; // Tránh refetch liên tục

  // Load real checklist data from API (silent = true: không bật loading, dùng khi refresh tab/focus)
  const fetchChecklistData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoadingProgress(true);

      const response = await fetch("/api/student/checklist", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (result.success && result.data) {
        const { stages: apiStages, tasks: apiTasks, progress } = result.data;

        // Transform API stages to UI format
        const transformedStages: Stage[] = apiStages.map(
          (stage: any, index: number) => ({
            id: stage.id,
            name: stage.name,
            description: normalizeChecklistBrand(stage.description || ""),
            isUnlocked: stage.isUnlocked || index === 0, // First stage always unlocked
          }),
        );

        // Transform API tasks to UI format
        const transformedTasks: Task[] = apiTasks.map((task: any) => {
          const taskProgress = progress.find((p: any) => p.task_id === task.id);

          // Format deadline from database or show "Chưa có"
          let deadlineDisplay = "Chưa có";
          if (taskProgress?.deadline) {
            const deadlineDate = new Date(taskProgress.deadline);
            deadlineDisplay = deadlineDate.toLocaleDateString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            });
          }

          return {
            id: task.id,
            progressId: task.progress_id ?? null,
            stageId: task.stage_id,
            title: task.title,
            description: task.description || "",
            isCustomTask: Boolean(task.is_custom),
            priority:
              task.priority === "HIGH" || task.priority === "MEDIUM" || task.priority === "LOW"
                ? task.priority
                : null,
            deadline: deadlineDisplay,
            deadlineRaw: taskProgress?.deadline || null, // Raw date for calculations
            isCompleted: task.isCompleted ?? (taskProgress?.status === "COMPLETED"),
            isLocked: task.isCompleted ?? (taskProgress?.status === "COMPLETED"), // Lock completed tasks from DB
            status: task.status ?? taskProgress?.status ?? "PENDING",
            requiresFile:
              task.task_type === 'FILE_UPLOAD' ||
              task.title.toLowerCase().includes("upload") || // fallback
              task.title.toLowerCase().includes("tải lên") ||
              task.title.toLowerCase().includes("cv") ||
              task.title.toLowerCase().includes("tài liệu") ||
              (isPremium && task.stage_id === 2),
            category: task.stage?.name || "Chung",
            linkTo: task.link_to || undefined,
            linkToManageUpload: task.linkToManageUpload ?? false,
            uploadedFile: task.uploadedFile ?? (taskProgress?.submission_url
              ? "File đã upload"
              : undefined),
            feedback:
              taskProgress?.mentor_note || // Priority 1: Use mentor note from DB
              apiTasks.find((apiTask: any) => apiTask.id === task.id)
                ?.feedback || // Priority 2: Use feedback from task transformation
              (task.title.includes("MBTI")
                ? "Bài test MBTI giúp bạn hiểu rõ kiểu tính cách của mình, từ đó định hướng nghề nghiệp và môi trường học tập phù hợp."
                : task.title.includes("Grit")
                  ? "Grit Scale đo lường mức độ kiên trì và đam mê theo đuổi mục tiêu dài hạn của bạn."
                  : task.title.includes("Holland") ||
                      task.title.includes("RIASEC")
                    ? "Holland Code giúp xác định xu hướng nghề nghiệp dựa trên 6 nhóm tính cách: Realistic, Investigative, Artistic, Social, Enterprising, Conventional."
                    : undefined), // Priority 3: Default feedback for tests only
            studentNote: taskProgress?.student_note ?? task.student_note ?? null,
          };
        });

        setStages(transformedStages);
        setTasks(transformedTasks);

        // Set active stage to latest available instead of first stage
        if (transformedStages.length > 0) {
          const latestStageId = getLatestAvailableStage(
            transformedStages,
            transformedTasks,
          );
          setActiveStageId(latestStageId);
          // Save to localStorage for persistence
          localStorage.setItem("activeStageId", latestStageId.toString());
        }
        initialLoadDone.current = true;
      } else {
        console.error("❌ Failed to load tiến đọ data:", result.error);
      }
    } catch (error) {
      console.error("❌ Error loading tiến đọ data:", error);
    } finally {
      if (!silent) setLoadingProgress(false);
      lastFetchTime.current = Date.now();
    }
  }, [isPremium]);

  // Sync with test completion status
  const fetchProgress = useCallback(async () => {
    if (!session?.user?.id) {
      return;
    }

    try {
      // Check test completion status
      const testResponse = await fetch("/api/tests/status", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (testResponse.ok) {
        const testResult = await testResponse.json();
        if (testResult.success) {
          // Update task completion based on test status
          setTasks((prev) =>
            prev.map((task) => {
              let isCompleted = task.isCompleted;
              let isLocked = task.isLocked;

              // Map test completion to tasks (chấp nhận cả /dashboard/tests và /student/tests)
              const isTestTask =
                task.linkTo === "/dashboard/tests" ||
                task.linkTo?.startsWith("/student/tests");
              if (isTestTask && task.title.includes("MBTI")) {
                isCompleted = testResult.data.mbti?.status === "COMPLETED";
                isLocked = testResult.data.mbti?.status === "COMPLETED";
              } else if (isTestTask && task.title.includes("Grit")) {
                isCompleted = testResult.data.grit?.status === "COMPLETED";
                isLocked = testResult.data.grit?.status === "COMPLETED";
              } else if (
                isTestTask &&
                (task.title.includes("Holland") || task.title.includes("RIASEC"))
              ) {
                isCompleted = testResult.data.riasec?.status === "COMPLETED";
                isLocked = testResult.data.riasec?.status === "COMPLETED";
              }

              return { ...task, isCompleted, isLocked };
            }),
          );
        }
      }
    } catch (error) {
      console.error("❌ Error fetching test progress:", error);
    }
  }, []); // Empty dependency - function stable, chỉ check session bên trong

  useEffect(() => {
    fetchChecklistData();
  }, []); // Chỉ chạy 1 lần khi component mount

  useEffect(() => {
    if (tasks.length > 0 && session?.user?.id) {
      fetchProgress();
    }
  }, [session?.user?.id, tasks.length]); // Chỉ chạy khi session hoặc tasks thay đổi

  // Consolidated auto-refresh logic - chỉ 1 useEffect, throttle để tránh reload liên tục
  useEffect(() => {
    let refreshTimeout: NodeJS.Timeout;

    const maybeRefresh = () => {
      const now = Date.now();
      if (now - lastFetchTime.current < MIN_FETCH_INTERVAL_MS) return; // Throttle
      refreshTimeout = setTimeout(() => {
        fetchChecklistData(true); // silent: không bật loading
        if (tasks.length > 0 && session?.user?.id) {
          fetchProgress();
        }
      }, 600);
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        clearTimeout(refreshTimeout);
        maybeRefresh();
      }
    };

    const handleFocus = () => {
      if (document.visibilityState === "visible") {
        clearTimeout(refreshTimeout);
        maybeRefresh();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      clearTimeout(refreshTimeout);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [session?.user?.id, tasks.length]);

  const handleToggleTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.isLocked) return; // Don't toggle if task is locked (completed from database)

    // For tasks that require navigation (tests), navigate to test page
    if (task.linkTo) {
      router.push(task.linkTo);
      return;
    }

    // Block student from manually marking tasks as completed.
    // Only mentor can change status to COMPLETED via their review panel.
    // File-upload tasks go to SUBMITTED status automatically after upload.
    // Non-linkTo, non-file tasks also cannot be self-completed.
    return;
  };

  const handleToggleTaskExpansion = async (taskId: string) => {
    setExpandedTaskIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  // Handle task click - navigate to test page if task has linkTo and is not completed
  const handleTaskClick = (task: Task) => {
    // Ưu tiên expand cho task cần upload file
    if (task.requiresFile) {
      handleToggleTaskExpansion(task.id);
    } else if (task.linkTo && !task.isCompleted) {
      router.push(task.linkTo);
    } else {
      handleToggleTaskExpansion(task.id);
    }
  };

  const studentId = session?.user?.id as string | undefined;

  const handleCVUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    taskId: string,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !studentId) return;

    setUploadingCV(true);
    setUploadingTaskId(taskId);
    setScanningCV(true);
    setCvScanError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", "cv");

      const uploadResponse = await fetch(
        `/api/students/${studentId}/upload-cv`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!uploadResponse.ok) {
        const err = await uploadResponse.json();
        throw new Error(err.error || "Upload failed");
      }

      const uploadResult = await uploadResponse.json();
      const fileUrl = uploadResult.fileUrl;

      if (!fileUrl) throw new Error("Không nhận được đường dẫn file");

      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                uploadedFile: fileUrl,
                isCompleted: false,
                status: "SUBMITTED",
              }
            : t,
        ),
      );

      const submitResponse = await fetch("/api/student/checklist/submit-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, fileUrl, studentId }),
      });

      if (!submitResponse.ok) {
        setCvScanError("File đã upload nhưng không thể cập nhật tiến đọ.");
        return;
      }

      try {
        const text = await file.text();
        const profile = await scanCVWithAI(text);
        if (profile) {
          setScannedProfile(profile);
          setTasks((prev) =>
            prev.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    feedback: `✅ Đã trích xuất: ${profile.name}, GPA: ${profile.gpa}, ${profile.extracurriculars?.length || 0} hoạt động, ${profile.achievements?.length || 0} thành tích.`,
                  }
                : t,
            ),
          );
        }
      } catch (_) {}
    } catch (error) {
      console.error("Error uploading CV:", error);
      setCvScanError(
        error instanceof Error ? error.message : "Lỗi khi upload file.",
      );
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, uploadedFile: undefined, isCompleted: false }
            : t,
        ),
      );
    } finally {
      setUploadingCV(false);
      setUploadingTaskId(null);
      setScanningCV(false);
    }
    event.target.value = "";
  };

  const handleCVDelete = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task?.uploadedFile || !studentId) return;
    const submissionUrl = String(task.uploadedFile);
    const docId = submissionUrl.startsWith("/uploads/")
      ? submissionUrl.split("/").pop()
      : null;

    try {
      if (docId && (docId.startsWith("cv_") || docId.startsWith("cert_"))) {
        const delRes = await fetch(
          `/api/students/${studentId}/upload-cv?id=${encodeURIComponent(docId)}`,
          {
            method: "DELETE",
          },
        );
        if (!delRes.ok) console.warn("Could not delete file from storage");
      }
      const clearRes = await fetch("/api/student/checklist/clear-submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, studentId }),
      });
      if (clearRes.ok) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  uploadedFile: undefined,
                  isCompleted: false,
                  status: "PENDING",
                }
              : t,
          ),
        );
        if (taskId === "1-2") setScannedProfile(null);
      }
    } catch (e) {
      console.error("Error deleting CV:", e);
    }
  };

  const handleSendTaskFeedback = async (task: Task, message: string) => {
    const trimmed = message.trim();
    if (!trimmed) return;
    try {
      const url =
        task.isCustomTask
          ? `/api/students/me/deadlines/custom/${task.id}`
          : `/api/students/me/deadlines/checklist/${task.progressId ?? task.id}`;
      if (!url) return;

      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_note: trimmed }),
      });
      if (!res.ok) {
        throw new Error("Failed to send feedback");
      }
      await fetchChecklistData(true);
    } catch (error) {
      console.error("Error sending checklist feedback:", error);
    }
  };

  const handleUpdateTaskFeedback = async (task: Task, nextRaw: string | null) => {
    try {
      const url =
        task.isCustomTask
          ? `/api/students/me/deadlines/custom/${task.id}`
          : `/api/students/me/deadlines/checklist/${task.progressId ?? task.id}`;

      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_note: nextRaw,
          student_note_mode: "replace",
        }),
      });
      if (!res.ok) throw new Error("Failed to update feedback");
      await fetchChecklistData(true);
    } catch (error) {
      console.error("Error updating checklist feedback:", error);
    }
  };

  const handleUnlockNextStage = () => {
    const nextStageId = activeStageId + 1;
    if (nextStageId <= 3) {
      setStages((prev) =>
        prev.map((s) =>
          s.id === nextStageId ? { ...s, isUnlocked: true } : s,
        ),
      );
      setActiveStageId(nextStageId);
      localStorage.setItem("activeStageId", nextStageId.toString());
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Calculate the latest available stage (highest unlocked or with progress)
  const getLatestAvailableStage = useCallback(
    (stagesData: Stage[], tasksData: Task[]) => {
      // First try to get from localStorage
      const savedStageId = localStorage.getItem("activeStageId");
      if (savedStageId) {
        const savedId = parseInt(savedStageId);
        // Validate that saved stage exists and is reasonable
        if (stagesData.find((s) => s.id === savedId)) {
          return savedId;
        }
      }

      // Calculate progress for each stage
      const stageProgress = stagesData.map((stage) => {
        const stageTasks = tasksData.filter((t) => t.stageId === stage.id);
        const completedTasks = stageTasks.filter((t) => t.isCompleted).length;
        const totalTasks = stageTasks.length;
        const progress =
          totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        return {
          stageId: stage.id,
          progress,
          hasStartedTasks: stageTasks.some(
            (t) => t.status === "SUBMITTED" || t.status === "COMPLETED",
          ),
          isUnlocked: stage.isUnlocked,
        };
      });

      // Find the latest stage with progress or unlocked
      let latestStage = 1; // Default to stage 1

      // Logic: Go to highest stage that either:
      // 1. Has been completed (100% progress)
      // 2. Has started tasks (some progress > 0 or submitted tasks)
      // 3. Is explicitly unlocked
      for (const stage of stageProgress.reverse()) {
        // Start from highest stage
        if (
          stage.progress === 100 ||
          stage.hasStartedTasks ||
          stage.isUnlocked
        ) {
          latestStage = stage.stageId;
          break;
        }
      }

      return latestStage;
    },
    [],
  );
  const currentStageTasks = useMemo(
    () => tasks.filter((t) => t.stageId === activeStageId),
    [tasks, activeStageId],
  );

  const currentStageBaseTasks = useMemo(
    () => currentStageTasks.filter((t) => !t.isCustomTask),
    [currentStageTasks],
  );

  const currentStageCustomTasks = useMemo(
    () => currentStageTasks.filter((t) => t.isCustomTask),
    [currentStageTasks],
  );

  const calculateProgress = useCallback(
    (stageId: number) => {
      const stageTasks = tasks.filter((t) => t.stageId === stageId);
      if (stageTasks.length === 0) return 0;
      const completed = stageTasks.filter((t) => t.isCompleted).length;
      return (completed / stageTasks.length) * 100;
    },
    [tasks],
  );

  const currentProgress = useMemo(
    () => calculateProgress(activeStageId),
    [activeStageId, calculateProgress],
  );

  const completedStages = useMemo(() => {
    return stages
      .filter((s) => calculateProgress(s.id) === 100)
      .map((s) => s.id);
  }, [stages, calculateProgress]);

  const canAdvance =
    currentProgress >= 90 &&
    activeStageId < 3 &&
    !stages.find((s) => s.id === activeStageId + 1)?.isUnlocked;
  const isNextStageAlreadyUnlocked = stages.find(
    (s) => s.id === activeStageId + 1,
  )?.isUnlocked;

  const tasksByCategory = useMemo(() => {
    const groups: { [key: string]: Task[] } = {};
    currentStageTasks.forEach((task) => {
      const cat = task.category || "Chung";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(task);
    });
    return groups;
  }, [currentStageTasks]);

  const applyTaskFilters = useCallback(
    (input: Task[]) => {
      let list = input;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        list = list.filter((t) => t.title.toLowerCase().includes(q));
      }
      if (subjectFilter) {
        list = list.filter((t) => (t.category || "Chung") === subjectFilter);
      }
      return sortTasks(list, sortBy);
    },
    [searchQuery, sortBy, subjectFilter],
  );

  const filteredBaseTasks = useMemo(() => {
    return applyTaskFilters(currentStageBaseTasks);
  }, [applyTaskFilters, currentStageBaseTasks]);

  const groupedBaseTasks = useMemo(
    () => groupTasksByDate(filteredBaseTasks),
    [filteredBaseTasks],
  );

  const filteredCustomTasks = useMemo(() => {
    return applyTaskFilters(currentStageCustomTasks);
  }, [applyTaskFilters, currentStageCustomTasks]);

  const groupedCustomTasks = useMemo(
    () => groupTasksByDate(filteredCustomTasks),
    [filteredCustomTasks],
  );

  const hasCustomTasksInStage = currentStageCustomTasks.length > 0;

  const overallProgressPercent = useMemo(() => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter((t) => t.isCompleted).length;
    return Math.round((completed / tasks.length) * 100);
  }, [tasks]);

  const subjectOptions = useMemo(() => {
    const set = new Set<string>();
    currentStageTasks.forEach((t) => set.add(t.category || "Chung"));
    return Array.from(set).sort();
  }, [currentStageTasks]);

  // Handle stage change with localStorage persistence
  const handleStageChange = useCallback((stageId: number) => {
    setActiveStageId(stageId);
    localStorage.setItem("activeStageId", stageId.toString());
  }, []);

  return (
    <div aria-label="Tiến độ hồ sơ du học">
      <ChecklistHeader
        progressPercent={overallProgressPercent}
        subtitle="Hoàn thành các đầu việc để tiến gần hơn tới hồ sơ du học."
      />
      <div className="min-h-[60vh] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {loadingProgress ? (
          <ChecklistSkeleton />
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            <div className="lg:col-span-1">
              <StageNavigation
                stages={stages}
                currentStageId={activeStageId}
                onSelectStage={handleStageChange}
                completedStages={completedStages}
              />
            </div>

            <div className="lg:col-span-3 space-y-6">
              <Card className="rounded-2xl border border-border shadow-sm overflow-hidden">
                <CardHeader className="border-b border-border bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 dark:from-primary/20 dark:via-primary/10 dark:to-primary/20 px-6 py-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary shadow-sm">
                        {activeStageId === 1 ? (
                          <Rocket size={24} />
                        ) : activeStageId === 2 ? (
                          <AlertCircle size={24} />
                        ) : (
                          <Trophy size={24} />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-xl m-0">
                          Giai đoạn {activeStageId}:{" "}
                          {stages[activeStageId - 1]?.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground hidden md:block mt-0.5">
                          {stages[activeStageId - 1]?.description}
                        </p>
                      </div>
                    </div>
                    {canAdvance && (
                      <button
                        onClick={handleUnlockNextStage}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all font-medium shadow-sm"
                      >
                        Mở khóa Giai đoạn {activeStageId + 1}{" "}
                        <ArrowRight size={18} />
                      </button>
                    )}
                    {!canAdvance && isNextStageAlreadyUnlocked && (
                      <button
                        onClick={() => handleStageChange(activeStageId + 1)}
                        className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-xl transition-all font-medium text-sm text-foreground"
                      >
                        Đến Giai đoạn {activeStageId + 1}{" "}
                        <ArrowRight size={16} />
                      </button>
                    )}
                  </div>
                  <ProgressBar percentage={currentProgress} />
                </CardHeader>

                <CardContent className="p-6 bg-gradient-to-b from-muted/20 to-muted/5 dark:from-muted/30 dark:to-muted/10 min-h-[320px]">
                  <div className="space-y-4 mb-6">
                    <ChecklistFilters
                      searchQuery={searchQuery}
                      onSearchChange={setSearchQuery}
                      subjectFilter={subjectFilter}
                      onSubjectFilterChange={setSubjectFilter}
                      sortBy={sortBy}
                      onSortChange={setSortBy}
                      subjectOptions={subjectOptions}
                    />
                  </div>

                  {filteredBaseTasks.length === 0 ? (
                    <div className="text-center py-12 rounded-2xl border border-dashed border-border bg-muted/20 dark:bg-muted/30">
                      <p className="text-muted-foreground">
                        {currentStageBaseTasks.length === 0
                          ? "Không có công việc nào trong giai đoạn này."
                          : "Không có task nào khớp với bộ lọc."}
                      </p>
                    </div>
                  ) : (
                    <TaskGroupSection
                      groups={groupedBaseTasks}
                      expandedTaskIds={expandedTaskIds}
                      onToggle={handleToggleTask}
                      onExpand={handleToggleTaskExpansion}
                      onTaskClick={handleTaskClick}
                      onCVUpload={handleCVUpload}
                      onCVDelete={handleCVDelete}
                      scanningCV={scanningCV}
                      uploadingTaskId={uploadingTaskId}
                      cvScanError={cvScanError}
                      scannedProfile={scannedProfile}
                      onSendFeedback={handleSendTaskFeedback}
                      onUpdateStudentFeedback={handleUpdateTaskFeedback}
                    />
                  )}
                </CardContent>
              </Card>

              {hasCustomTasksInStage && (
                <Card className="rounded-2xl border border-border shadow-sm overflow-hidden border-l-4 border-l-primary/60">
                  <CardHeader className="p-5 pb-2 bg-muted/10 border-b border-border">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base font-semibold text-foreground">
                          Bạn có nhiệm vụ riêng từ Cố vấn ({currentStageCustomTasks.length})
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          Xem chi tiết và theo dõi đầy đủ tại trang Hạn chót.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => router.push("/student/deadlines")}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                      >
                        Quản lý Hạn chót
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 bg-muted/5">
                    {filteredCustomTasks.length === 0 ? (
                      <div className="text-center py-6 rounded-xl border border-dashed border-border bg-muted/10">
                        <p className="text-sm text-muted-foreground">Không có nhiệm vụ riêng nào khớp với bộ lọc.</p>
                      </div>
                    ) : (
                      <TaskGroupSection
                        groups={groupedCustomTasks}
                        expandedTaskIds={expandedTaskIds}
                        onToggle={handleToggleTask}
                        onExpand={handleToggleTaskExpansion}
                        onTaskClick={handleTaskClick}
                        onCVUpload={handleCVUpload}
                        onCVDelete={handleCVDelete}
                        scanningCV={scanningCV}
                        uploadingTaskId={uploadingTaskId}
                        cvScanError={cvScanError}
                        scannedProfile={scannedProfile}
                        onSendFeedback={handleSendTaskFeedback}
                        onUpdateStudentFeedback={handleUpdateTaskFeedback}
                      />
                    )}
                  </CardContent>
                </Card>
              )}

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-2xl border border-border shadow-sm overflow-hidden border-l-4 border-l-amber-500/60 bg-gradient-to-br from-amber-500/5 to-transparent dark:from-amber-500/10 dark:to-transparent"
              >
                <div className="flex items-start gap-3 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400">
                    <Flag size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground text-sm mb-1">
                      Lời khuyên Giai đoạn {activeStageId}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {activeStageId === 1 &&
                        "Đây là giai đoạn nền tảng. Hãy dành thời gian hiểu rõ bản thân và tìm hiểu kỹ về các trường đại học mục tiêu."}
                      {activeStageId === 2 &&
                        "Chất lượng hơn số lượng. Tập trung vào bài luận cá nhân và các hoạt động ngoại khóa có chiều sâu lãnh đạo."}
                      {activeStageId === 3 &&
                        "Kiểm tra kỹ hạn visa và yêu cầu nhập cảnh. Đừng quên mang theo bản sao các giấy tờ quan trọng."}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChecklistPage;
