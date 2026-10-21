"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import {
  Mic,
  Square,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  PlayCircle,
  History,
} from "lucide-react"
import { StudentPageContainer } from "@/components/student"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { MockInterviewQuestionRecord } from "@/data/mock-interview-questions"
import {
  mockInterviewCategoryLabelVi,
  mockInterviewDifficultyLabelVi,
  mockInterviewDifficultyTone,
  mockInterviewTypeLabelVi,
} from "@/data/mock-interview-questions"
import {
  createMockInterviewSession,
  getMockInterviewSession,
  markMockInterviewMicOk,
  submitMockInterviewAnswer,
  type StoredInterviewAnswer,
} from "@/actions/mock-interview"
import { MOCK_INTERVIEW_QUESTION_COUNT } from "@/lib/mock-interview-config"
import type { MockInterviewQuotaSnapshot } from "@/lib/mock-interview-quota"
import {
  averageFeature8Scores,
  summarizeFeature8Evaluation,
} from "@/lib/feature8-evaluation-display"
import { MockInterviewResultsPanel } from "@/components/student/mock-interview/MockInterviewResultsPanel"
import type { MockInterviewCompletedSessionDto } from "@/components/student/mock-interview/CompletedMockInterviewSessionsList"
import { cn } from "@/lib/utils"

/** Số cột sóng — grid 1fr để thanh sát nhau, không còn khoảng trống giữa các cột. */
const SPECTRUM_BAR_COUNT = 64
const MOCK_INTERVIEW_MIC_CHECK_MAX_SEC = 20
const EASY_QUESTION_MAX_RECORDING_SEC = 60
const HARD_QUESTION_MAX_RECORDING_SEC = 90

function getQuestionMaxRecordingSec(question?: MockInterviewQuestionRecord | null) {
  const difficulty = question?.difficulty.trim().toLowerCase()
  return difficulty === "easy"
    ? EASY_QUESTION_MAX_RECORDING_SEC
    : HARD_QUESTION_MAX_RECORDING_SEC
}

/** Thanh tần số động từ micro (Web Audio Analyser). */
function RecordingSpectrum({
  stream,
  active,
  accent = "cyan",
  className,
}: {
  stream: MediaStream | null
  active: boolean
  accent?: "cyan" | "amber"
  className?: string
}) {
  const barsRef = useRef<(HTMLDivElement | null)[]>([])
  const rafRef = useRef(0)
  const ctxRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    if (!active || !stream) {
      cancelAnimationFrame(rafRef.current)
      void ctxRef.current?.close()
      ctxRef.current = null
      for (let i = 0; i < SPECTRUM_BAR_COUNT; i++) {
        const el = barsRef.current[i]
        if (el) el.style.transform = "scaleY(0.1)"
      }
      return
    }

    let audioCtx: AudioContext
    try {
      audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    } catch {
      return
    }

    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 256
    analyser.minDecibels = -82
    analyser.maxDecibels = -22
    analyser.smoothingTimeConstant = 0.5

    const source = audioCtx.createMediaStreamSource(stream)
    source.connect(analyser)
    ctxRef.current = audioCtx

    const data = new Uint8Array(analyser.frequencyBinCount)
    const tick = () => {
      analyser.getByteFrequencyData(data)
      const usable = Math.min(data.length - 1, Math.floor(data.length * 0.72))
      const step = Math.max(1, Math.floor(usable / SPECTRUM_BAR_COUNT))
      for (let i = 0; i < SPECTRUM_BAR_COUNT; i++) {
        let peak = 0
        const start = i * step
        for (let j = 0; j < step && start + j < usable; j++) {
          const v = data[start + j] ?? 0
          if (v > peak) peak = v
        }
        const norm = peak / 255
        const scale = 0.08 + Math.pow(norm, 0.85) * 0.98
        const el = barsRef.current[i]
        if (el) el.style.transform = `scaleY(${Math.min(1, scale)})`
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    if (audioCtx.state === "suspended") {
      void audioCtx.resume()
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafRef.current)
      source.disconnect()
      analyser.disconnect()
      void audioCtx.close()
      ctxRef.current = null
    }
  }, [active, stream])

  const barGradient =
    accent === "amber"
      ? "from-amber-500 via-orange-400 to-[var(--brand-cyan)]"
      : "from-primary via-[var(--brand-cyan)] to-teal-300"

  if (!active || !stream) {
    return null
  }

  return (
    <div
      className={cn(
        "grid w-full max-w-none items-end gap-x-px gap-y-0 sm:gap-x-0.5",
        "min-h-[6.5rem] sm:min-h-[7.5rem]",
        className,
      )}
      style={{
        gridTemplateColumns: `repeat(${SPECTRUM_BAR_COUNT}, minmax(0, 1fr))`,
      }}
      aria-hidden
    >
      {Array.from({ length: SPECTRUM_BAR_COUNT }).map((_, i) => (
        <div
          key={i}
          className="flex min-h-[6.5rem] items-end justify-stretch sm:min-h-[7.5rem]"
        >
          <div
            ref={(el) => {
              barsRef.current[i] = el
            }}
            className={cn(
              "h-[100px] w-full min-w-0 origin-bottom rounded-sm bg-gradient-to-t shadow-sm transition-[filter] duration-150 sm:h-[120px] sm:rounded-[3px]",
              barGradient,
            )}
            style={{ transform: "scaleY(0.1)" }}
          />
        </div>
      ))}
    </div>
  )
}

function CameraPreview({
  stream,
  active,
  accent = "cyan",
}: {
  stream: MediaStream | null
  active: boolean
  accent?: "cyan" | "amber"
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const hasLiveVideo =
    active &&
    !!stream?.getVideoTracks().some((track) => track.readyState === "live")

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (!hasLiveVideo || !stream) {
      video.srcObject = null
      return
    }

    video.srcObject = stream
    void video.play().catch(() => {
      /* Browser may delay autoplay until the element is visible. */
    })

    return () => {
      video.srcObject = null
    }
  }, [hasLiveVideo, stream])

  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-xl border bg-slate-950 shadow-inner",
        accent === "amber"
          ? "border-amber-500/40"
          : "border-cyan-500/40",
      )}
    >
      {hasLiveVideo ? (
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          muted
          playsInline
          autoPlay
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm font-medium text-white/70">
          Camera preview
        </div>
      )}
      {hasLiveVideo && (
        <div className="absolute left-3 top-3 rounded-full bg-rose-500 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow">
          REC
        </div>
      )}
    </div>
  )
}

function formatRecordingDuration(ms: number): string {
  const s = ms / 1000
  if (s < 60) return s.toFixed(1)
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, "0")}`
}

function formatHubSessionDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      dateStyle: "medium",
      timeStyle: "short",
    })
  } catch {
    return iso
  }
}

type Stage = "loading" | "error" | "mic" | "question" | "results"

function MockInterviewDifficultyBadge({ difficulty }: { difficulty: string }) {
  const tone = mockInterviewDifficultyTone(difficulty)
  const label = mockInterviewDifficultyLabelVi(difficulty)
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-tight",
        tone === "easy" &&
          "border-emerald-500/45 bg-emerald-500/12 text-emerald-900 dark:text-emerald-100",
        tone === "medium" &&
          "border-amber-500/45 bg-amber-500/12 text-amber-950 dark:text-amber-100",
        tone === "hard" &&
          "border-rose-500/45 bg-rose-500/12 text-rose-950 dark:text-rose-100",
        tone === "default" &&
          "border-border bg-muted text-muted-foreground",
      )}
    >
      Độ khó: {label}
    </span>
  )
}

/** Typing tối thiểu cho Web Speech API (Chrome / Safari). */
type SpeechRecognitionResultListLike = {
  length: number
  [index: number]: { 0: { transcript: string } }
}

type SpeechRecognitionEventLike = {
  resultIndex: number
  results: SpeechRecognitionResultListLike
}

type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null
  onerror: (() => void) | null
  start: () => void
  stop: () => void
}

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function MockInterviewFlow() {
  const { data: session } = useSession()
  const [view, setView] = useState<"hub" | "interview">("hub")
  const [hubLoading, setHubLoading] = useState(true)
  const [historySessions, setHistorySessions] = useState<
    MockInterviewCompletedSessionDto[]
  >([])
  const [quotaSnapshot, setQuotaSnapshot] =
    useState<MockInterviewQuotaSnapshot | null>(null)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  )
  const [freeQuotaModalOpen, setFreeQuotaModalOpen] = useState(false)
  const [paidQuotaHint, setPaidQuotaHint] = useState<string | null>(null)

  const [stage, setStage] = useState<Stage>("loading")
  const [stageIndex, setStageIndex] = useState(0)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<MockInterviewQuestionRecord[]>([])
  const [answers, setAnswers] = useState<StoredInterviewAnswer[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  /** Stream cho visualizer tần số (tách ref để Analyser còn bản ghi hợp lệ). */
  const [vizStream, setVizStream] = useState<MediaStream | null>(null)
  /** Đang xin quyền / khởi tạo MediaRecorder (tránh bấm tưởng không phản hồi). */
  const [isArmingMic, setIsArmingMic] = useState(false)
  /** Thời lượng đang ghi (ms), cập nhật mỗi 100ms khi isRecording. */
  const [recordingElapsedMs, setRecordingElapsedMs] = useState(0)

  const stageRef = useRef<Stage>(stage)
  stageRef.current = stage
  const maxStopFiredRef = useRef(false)
  const handleMicSubmitRef = useRef<() => Promise<void>>(async () => {})
  const handleQuestionSubmitRef = useRef<() => Promise<void>>(async () => {})

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const transcriptRef = useRef("")
  const recordStartRef = useRef<number>(0)

  const stopStreams = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const stopRecognition = useCallback(() => {
    const r = recognitionRef.current
    if (r) {
      try {
        r.stop()
      } catch {
        /* ignore */
      }
      recognitionRef.current = null
    }
  }, [])

  const requestRecordingStream = useCallback(async (videoMode: boolean) => {
    if (!videoMode) {
      return navigator.mediaDevices.getUserMedia({ audio: true })
    }

    let cameraStream: MediaStream | null = null
    let micStream: MediaStream | null = null

    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      })
    } catch (e) {
      throw new Error(
        e instanceof DOMException
          ? `Camera permission/device failed (${e.name}): ${e.message || "no browser detail"}`
          : "Camera permission/device failed.",
      )
    }

    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (e) {
      cameraStream.getTracks().forEach((track) => track.stop())
      throw new Error(
        e instanceof DOMException
          ? `Micro permission/device failed (${e.name}): ${e.message || "no browser detail"}`
          : "Micro permission/device failed.",
      )
    }

    return new MediaStream([
      ...cameraStream.getVideoTracks(),
      ...micStream.getAudioTracks(),
    ])
  }, [])

  const loadHubData = useCallback(async () => {
    const id = session?.user?.id
    if (!id) {
      setHubLoading(false)
      setHistorySessions([])
      setQuotaSnapshot(null)
      return
    }
    setHubLoading(true)
    try {
      const [sRes, lRes] = await Promise.all([
        fetch(`/api/students/${id}/mock-interview/sessions`),
        fetch(`/api/students/${id}/mock-interview/limits`),
      ])
      if (sRes.ok) {
        const j = (await sRes.json()) as {
          sessions?: MockInterviewCompletedSessionDto[]
        }
        setHistorySessions(Array.isArray(j.sessions) ? j.sessions : [])
      } else {
        setHistorySessions([])
      }
      if (lRes.ok) {
        setQuotaSnapshot((await lRes.json()) as MockInterviewQuotaSnapshot)
      } else {
        setQuotaSnapshot(null)
      }
    } catch {
      setHistorySessions([])
      setQuotaSnapshot(null)
    } finally {
      setHubLoading(false)
    }
  }, [session?.user?.id])

  useEffect(() => {
    void loadHubData()
  }, [loadHubData])

  const displaySession = useMemo(() => {
    if (historySessions.length === 0) return null
    if (selectedSessionId) {
      return (
        historySessions.find((s) => s.id === selectedSessionId) ??
        historySessions[0] ??
        null
      )
    }
    return historySessions[0] ?? null
  }, [historySessions, selectedSessionId])

  const beginInterview = useCallback(async () => {
    setPaidQuotaHint(null)
    setError(null)
    setStage("loading")
    try {
      const s = await createMockInterviewSession()
      if (!s.ok) {
        if (s.code === "QUOTA") {
          const id = session?.user?.id
          if (id) {
            const lRes = await fetch(
              `/api/students/${id}/mock-interview/limits`,
            )
            if (lRes.ok) {
              const q = (await lRes.json()) as MockInterviewQuotaSnapshot
              setQuotaSnapshot(q)
              if (q.plan === "FREE") {
                setFreeQuotaModalOpen(true)
              } else {
                setPaidQuotaHint(s.error)
              }
            } else {
              setPaidQuotaHint(s.error)
            }
          } else {
            setPaidQuotaHint(s.error)
          }
        } else {
          setError(s.error)
        }
        setStage(
          answers.length > 0
            ? "results"
            : view === "interview"
              ? "error"
              : "loading",
        )
        return
      }
      setView("interview")
      setSessionId(s.sessionId)
      setQuestions(s.questions)
      setStageIndex(0)
      setAnswers([])
      setStage("mic")
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Không tạo được phiên phỏng vấn.",
      )
      setStage(
        answers.length > 0
          ? "results"
          : view === "interview"
            ? "error"
            : "loading",
      )
    }
  }, [session?.user?.id, answers.length, view])

  const tryBeginInterview = useCallback(() => {
    if (
      quotaSnapshot?.plan === "FREE" &&
      quotaSnapshot.canStartNew === false
    ) {
      setFreeQuotaModalOpen(true)
      return
    }
    void beginInterview()
  }, [quotaSnapshot, beginInterview])

  const returnToHub = useCallback(async () => {
    await loadHubData()
    setView("hub")
    setSelectedSessionId(null)
    setSessionId(null)
    setQuestions([])
    setAnswers([])
    setStage("loading")
    setError(null)
    setPaidQuotaHint(null)
  }, [loadHubData])

  useEffect(() => {
    return () => {
      stopRecognition()
      stopStreams()
    }
  }, [stopRecognition, stopStreams])

  const currentQuestionIdx = stageIndex - 1
  const currentQuestion = questions[currentQuestionIdx]
  const activeMaxRecordingSec =
    stage === "question"
      ? getQuestionMaxRecordingSec(currentQuestion)
      : MOCK_INTERVIEW_MIC_CHECK_MAX_SEC
  const activeMaxRecordingMs = activeMaxRecordingSec * 1000

  useEffect(() => {
    if (!isRecording) {
      setRecordingElapsedMs(0)
      maxStopFiredRef.current = false
      return
    }
    maxStopFiredRef.current = false
    const t0 = recordStartRef.current
    const tick = () => {
      const elapsed = Date.now() - t0
      setRecordingElapsedMs(elapsed)
      if (elapsed >= activeMaxRecordingMs && !maxStopFiredRef.current) {
        maxStopFiredRef.current = true
        const st = stageRef.current
        if (st === "mic") void handleMicSubmitRef.current()
        else if (st === "question") void handleQuestionSubmitRef.current()
      }
    }
    tick()
    const id = window.setInterval(tick, 100)
    return () => window.clearInterval(id)
  }, [activeMaxRecordingMs, isRecording])

  const startRecording = useCallback(async () => {
    setError(null)
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        "Trình duyệt không hỗ trợ thu âm, hoặc cần mở trang qua HTTPS (localhost vẫn được).",
      )
      return
    }

    setIsArmingMic(true)
    transcriptRef.current = ""
    chunksRef.current = []
    mediaRecorderRef.current = null
    stopRecognition()
    stopStreams()

    const answerMode = stageRef.current === "question"
    const videoMode = stageRef.current === "mic" || answerMode
    try {
      const stream = await requestRecordingStream(videoMode)
      streamRef.current = stream
      setVizStream(stream)
      let mime = ""
      if (
        videoMode &&
        MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
      ) {
        mime = "video/webm;codecs=vp8,opus"
      } else if (videoMode && MediaRecorder.isTypeSupported("video/webm")) {
        mime = "video/webm"
      } else if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mime = "audio/webm;codecs=opus"
      } else if (MediaRecorder.isTypeSupported("audio/webm")) {
        mime = "audio/webm"
      }
      const rec = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream)
      rec.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data)
      }
      rec.start(250)
      mediaRecorderRef.current = rec
      recordStartRef.current = Date.now()

      const Ctor = getSpeechRecognitionCtor()
      if (Ctor) {
        const r = new Ctor()
        r.lang = "en-US"
        r.continuous = true
        r.interimResults = true
        r.onresult = (event: SpeechRecognitionEventLike) => {
          let t = ""
          for (let i = 0; i < event.results.length; i++) {
            t += event.results[i]![0]!.transcript
            if (i < event.results.length - 1) t += " "
          }
          transcriptRef.current = t
        }
        r.onerror = () => {
          /* recognition có thể báo no-speech — vẫn giữ transcript đã có */
        }
        try {
          r.start()
          recognitionRef.current = r
        } catch {
          recognitionRef.current = null
        }
      }

      setIsRecording(true)
    } catch (e) {
      const name = e instanceof DOMException ? e.name : ""
      const msg =
        e instanceof Error && e.message
          ? e.message
          : name === "NotAllowedError" || name === "PermissionDeniedError"
          ? videoMode
            ? "Camera hoac micro bi chan: nhan bieu tuong khoa / thong tin tren thanh dia chi va cho phep ca Camera lan Micro."
            : "Micro bi chan: nhan bieu tuong khoa / thong tin tren thanh dia chi va cho phep Micro."
          : name === "NotFoundError"
            ? videoMode
              ? "Khong tim thay camera hoac micro. Kiem tra webcam/micro da cam va khong bi ung dung khac chiem."
              : "Khong tim thay micro. Kiem tra thiet bi da cam hoac micro mac dinh trong Windows."
            : videoMode
                ? "Khong the bat camera hoac micro."
                : "Khong the bat micro."
      setError(msg)
      stopRecognition()
      stopStreams()
      setVizStream(null)
      mediaRecorderRef.current = null
      setIsRecording(false)
    } finally {
      setIsArmingMic(false)
    }
  }, [requestRecordingStream, stopRecognition, stopStreams])

  const stopRecording = useCallback(async () => {
    const rec = mediaRecorderRef.current
    stopRecognition()

    if (!rec || rec.state === "inactive") {
      stopStreams()
      setVizStream(null)
      mediaRecorderRef.current = null
      setIsRecording(false)
      const durationSec = Math.max(
        0,
        (Date.now() - recordStartRef.current) / 1000,
      )
      return {
        blob: new Blob([], { type: "audio/webm" }),
        transcript: transcriptRef.current.trim(),
        mime: "audio/webm",
        durationSec,
      }
    }

    return await new Promise<{
      blob: Blob
      transcript: string
      mime: string
      durationSec: number
    }>((resolve) => {
      rec.onstop = () => {
        const mime = rec.mimeType || "audio/webm"
        const blob = new Blob(chunksRef.current, { type: mime })
        const durationSec = Math.max(
          0,
          (Date.now() - recordStartRef.current) / 1000,
        )
        stopStreams()
        setVizStream(null)
        mediaRecorderRef.current = null
        setIsRecording(false)
        resolve({
          blob,
          transcript: transcriptRef.current.trim(),
          mime,
          durationSec,
        })
      }
      rec.stop()
    })
  }, [stopRecognition, stopStreams])

  const refreshSession = useCallback(async (sid: string) => {
    const row = await getMockInterviewSession(sid)
    if (row?.answers) setAnswers(row.answers)
  }, [])

  const handleMicSubmit = async () => {
    if (!sessionId || busy) return
    setBusy(true)
    setError(null)
    try {
      const { blob, mime, durationSec: rawSec } = await stopRecording()
      const durationSec = Math.min(rawSec, MOCK_INTERVIEW_MIC_CHECK_MAX_SEC)
      if (blob.size < 100) {
        setError("Âm thanh quá ngắn hoặc không thu được. Thử lại.")
        setBusy(false)
        return
      }
      const file = new File([blob], "camera-mic-test.webm", { type: mime })
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/student/interview/test-mic", {
        method: "POST",
        body: fd,
      })
      const raw = await res.text()
      let data: { ok?: boolean; error?: string; detail?: string; raw?: string }
      try {
        data = raw ? JSON.parse(raw) : {}
      } catch {
        data = { raw }
      }
      if (!res.ok) {
        throw new Error(
          data.error ||
            data.detail ||
            data.raw ||
            `Device test failed (${res.status}).`,
        )
      }
      if (durationSec < 0.5) {
        setError("Nên nói thử ít nhất vài giây.")
        setBusy(false)
        return
      }
      const micMark = await markMockInterviewMicOk(sessionId)
      if (!micMark.ok) {
        throw new Error("Không lưu được trạng thái mic.")
      }
      setStageIndex(1)
      setStage("question")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi kiểm tra mic.")
    } finally {
      setBusy(false)
    }
  }

  const handleQuestionSubmit = async () => {
    if (!sessionId || currentQuestionIdx < 0 || !currentQuestion || busy)
      return
    setBusy(true)
    setError(null)
    try {
      const { blob, transcript, mime, durationSec: rawSec } =
        await stopRecording()
      const maxSec = getQuestionMaxRecordingSec(currentQuestion)
      const durationSec = Math.min(rawSec, maxSec)
      if (blob.size < 200) {
        setError("Bản ghi quá ngắn. Hãy trả lời rõ ràng hơn rồi thử lại.")
        setBusy(false)
        return
      }
      const file = new File([blob], `answer-${currentQuestionIdx}.webm`, {
        type: mime,
      })
      const result = await submitMockInterviewAnswer({
        sessionId,
        questionIndex: currentQuestionIdx,
        audio: file,
        video: file,
        transcript,
        durationSeconds: durationSec,
      })
      if (!result.success) {
        throw new Error(result.error)
      }
      setAnswers((prev) => {
        const f = prev.filter((x) => x.questionIndex !== result.answer.questionIndex)
        return [...f, result.answer].sort(
          (a, b) => a.questionIndex - b.questionIndex,
        )
      })
      await refreshSession(sessionId)
      if (result.sessionComplete) {
        setStage("results")
        setStageIndex(1 + questions.length)
      } else {
        setStageIndex((i) => i + 1)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gửi câu trả lời thất bại.")
    } finally {
      setBusy(false)
    }
  }

  handleMicSubmitRef.current = handleMicSubmit
  handleQuestionSubmitRef.current = handleQuestionSubmit

  const qCountForUi =
    questions.length > 0 ? questions.length : MOCK_INTERVIEW_QUESTION_COUNT
  const totalStages = 1 + qCountForUi + 1
  const progressPct =
    stage === "results"
      ? 100
      : Math.min(100, ((stageIndex + 1) / totalStages) * 100)
  const progressLabel =
    stage === "loading"
      ? "Đang chuẩn bị…"
      : stage === "error"
        ? "Lỗi khởi tạo"
        : stage === "mic"
          ? `Bước 1 / ${totalStages}: Kiểm tra mic`
          : stage === "question"
            ? `Bước ${stageIndex + 1} / ${totalStages}: Câu ${currentQuestionIdx + 1} / ${questions.length}`
            : "Kết quả"

  const stepLabels = [
    "Mic",
    ...Array.from({ length: qCountForUi }, (_, i) => `Câu ${i + 1}`),
    "Kết quả",
  ]
  const activeStepIdx =
    stage === "loading" || stage === "error"
      ? -1
      : stage === "mic"
        ? 0
        : stage === "question"
          ? 1 + currentQuestionIdx
          : questions.length > 0
            ? questions.length + 1
            : -1

  return (
    <StudentPageContainer noPadding className="min-w-[320px] overflow-x-hidden pb-10">
      <section
        aria-label="Phỏng vấn thử"
        className="relative mb-6 overflow-hidden text-white sm:mb-8"
        style={{
          background:
            "linear-gradient(135deg, var(--primary) 0%, var(--brand-deep) 50%, var(--brand-cyan) 100%)",
        }}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 right-1/4 h-40 w-80 rounded-full bg-[var(--brand-cyan)]/20 blur-2xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="relative px-6 py-8 sm:px-10 sm:py-10">
          <div className="mx-auto flex w-full max-w-none flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white shadow-sm ring-1 ring-white/20">
                <MessageCircle className="size-6" aria-hidden />
              </div>
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-white/85">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_8px_rgba(245,166,35,0.9)]" />
                  Luyện phỏng vấn
                </p>
                <h1 className="mt-2 font-university-display text-2xl font-bold leading-tight text-white sm:text-3xl">
                  <span className="block">Phỏng vấn thử</span>
                  <span className="mt-1 block bg-gradient-to-r from-[#FFD56A] via-white to-[#8BE9FF] bg-clip-text text-transparent">
                    {MOCK_INTERVIEW_QUESTION_COUNT} câu · Tiếng Anh · AI chấm
                  </span>
                </h1>
                <p className="mt-3 max-w-none text-sm leading-relaxed text-white/80">
                  {view === "hub" ? (
                    <>
                      Trang này mặc định hiển thị{" "}
                      <strong className="text-white">kết quả phiên gần nhất</strong>{" "}
                      và <strong className="text-white">lịch sử</strong>. Bấm
                      &quot;Bắt đầu phiên phỏng vấn mới&quot; để luyện tiếp (mỗi
                      lần ghi tối đa {EASY_QUESTION_MAX_RECORDING_SEC}-{HARD_QUESTION_MAX_RECORDING_SEC}s theo độ khó).
                    </>
                  ) : (
                    <>
                      Thu âm trên trình duyệt; mỗi lần ghi tối đa{" "}
                      {EASY_QUESTION_MAX_RECORDING_SEC}-{HARD_QUESTION_MAX_RECORDING_SEC} giây. Transcript ước
                      lượng bằng nhận dạng giọng nói; video gửi tới máy chủ
                      AI để chấm theo rubric.
                    </>
                  )}
                </p>
              </div>
            </div>
            {view === "interview" ? (
              <div className="flex shrink-0 flex-col items-stretch gap-2 rounded-xl border border-white/35 bg-white/10 px-4 py-3 text-sm text-white/95 backdrop-blur-sm sm:items-end">
                <span className="font-medium text-white">Tiến trình phiên</span>
                <span className="text-xs text-white/75">{progressLabel}</span>
                {sessionId && (
                  <span className="font-mono text-[11px] text-white/60">
                    ID {sessionId.slice(0, 8)}…
                  </span>
                )}
              </div>
            ) : (
              <div className="flex max-w-sm shrink-0 flex-col gap-1 rounded-xl border border-white/35 bg-white/10 px-4 py-3 text-sm text-white/90 backdrop-blur-sm sm:text-right">
                <span className="font-medium text-white">Tổng quan</span>
                <span className="text-xs text-white/75">
                  {hubLoading
                    ? "Đang tải lịch sử…"
                    : historySessions.length > 0
                      ? `${historySessions.length} phiên đã hoàn thành`
                      : "Chưa có phiên hoàn thành"}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-none px-4 sm:px-6 lg:px-8">
        <div
          className="h-1 w-full rounded-full bg-gradient-to-r from-[var(--accent)]/35 via-primary/25 to-[var(--brand-cyan)]/35"
          role="separator"
          aria-hidden
        />
      </div>

      <div className="mx-auto w-full max-w-none space-y-6 px-4 pt-6 sm:px-6 lg:px-8">
        {view === "hub" ? (
          <>
            {hubLoading ? (
              <Card className="overflow-hidden rounded-2xl border-2 border-violet-400/35 bg-gradient-to-br from-violet-500/10 via-card to-fuchsia-500/5 shadow-lg">
                <CardContent className="flex items-center gap-4 px-6 py-10">
                  <Loader2
                    className="text-primary h-9 w-9 shrink-0 animate-spin"
                    aria-hidden
                  />
                  <p className="text-foreground font-medium">
                    Đang tải kết quả và lịch sử…
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                  <Button
                    type="button"
                    size="lg"
                    className="w-full gap-2 font-semibold shadow-md sm:w-auto"
                    onClick={() => void tryBeginInterview()}
                    disabled={!session?.user?.id}
                  >
                    <PlayCircle className="size-5 shrink-0" aria-hidden />
                    Bắt đầu phiên phỏng vấn mới
                  </Button>
                  {quotaSnapshot && (
                    <p className="text-muted-foreground max-w-xl text-sm">
                      {quotaSnapshot.plan === "FREE" ? (
                        quotaSnapshot.canStartNew ? (
                          <>
                            Gói miễn phí: bạn còn{" "}
                            <strong>1 lượt</strong> trải nghiệm (1 phiên hoàn
                            chỉnh).
                          </>
                        ) : (
                          <>
                            Gói miễn phí: đã dùng hết lượt trải nghiệm. Nâng cấp
                            để luyện thêm.
                          </>
                        )
                      ) : (
                        <>
                          Plus/Premium: tối đa{" "}
                          <strong>
                            {quotaSnapshot.dailyMax ?? 1} phiên / ngày
                          </strong>{" "}
                          (giờ VN), không quá{" "}
                          <strong>
                            {quotaSnapshot.rollingWindowMax ?? 60} phiên / 6
                            tháng
                          </strong>
                          . Hôm nay: {quotaSnapshot.completedTodayVn} · 6 tháng:{" "}
                          {quotaSnapshot.completedLast6Months}.
                        </>
                      )}
                    </p>
                  )}
                </div>
                {paidQuotaHint && (
                  <div
                    className="border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm"
                    role="status"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{paidQuotaHint}</span>
                  </div>
                )}
                {!session?.user?.id && (
                  <p className="text-muted-foreground text-sm">
                    Đăng nhập tài khoản học sinh để xem lịch sử và bắt đầu phiên
                    mới.
                  </p>
                )}
                <div className="grid gap-8 lg:grid-cols-3">
                  <div className="space-y-3 lg:col-span-2">
                    <h2 className="font-university-display text-lg font-bold text-foreground">
                      {displaySession
                        ? selectedSessionId
                          ? "Kết quả phiên đã chọn"
                          : "Kết quả mới nhất"
                        : "Kết quả"}
                    </h2>
                    {displaySession ? (
                      <MockInterviewResultsPanel
                        questions={displaySession.questions}
                        answers={displaySession.answers as StoredInterviewAnswer[]}
                        title={
                          selectedSessionId
                            ? `Phiên ${formatHubSessionDate(displaySession.completedAt)}`
                            : "Kết quả mới nhất"
                        }
                      />
                    ) : (
                      <Card className="rounded-2xl border-dashed">
                        <CardContent className="py-10 text-center text-sm text-muted-foreground">
                          Chưa có phiên phỏng vấn nào hoàn thành. Hãy bắt đầu
                          phiên đầu tiên.
                        </CardContent>
                      </Card>
                    )}
                  </div>
                  <div className="space-y-3">
                    <h3 className="flex items-center gap-2 font-semibold text-foreground">
                      <History className="size-5 text-primary" aria-hidden />
                      Lịch sử phiên
                    </h3>
                    {historySessions.length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        Danh sách trống.
                      </p>
                    ) : (
                      <ul className="max-h-[min(70vh,520px)] space-y-2 overflow-y-auto pr-1">
                        {historySessions.map((sess) => {
                          const summaries = sess.answers.map(
                            summarizeFeature8Evaluation,
                          )
                          const avg = averageFeature8Scores(summaries)
                          const isLatest = sess.id === historySessions[0]?.id
                          const isSelected =
                            selectedSessionId === sess.id ||
                            (selectedSessionId === null && isLatest)
                          return (
                            <li key={sess.id}>
                              <button
                                type="button"
                                onClick={() => setSelectedSessionId(sess.id)}
                                className={cn(
                                  "w-full rounded-xl border px-3 py-3 text-left text-sm transition-colors",
                                  isSelected
                                    ? "border-primary bg-primary/10 ring-2 ring-primary/25"
                                    : "border-border bg-card hover:bg-muted/50",
                                )}
                              >
                                <div className="font-medium text-foreground">
                                  {formatHubSessionDate(sess.completedAt)}
                                </div>
                                {isLatest && (
                                  <div className="text-primary mt-0.5 text-xs font-semibold">
                                    Mới nhất
                                  </div>
                                )}
                                {avg != null && (
                                  <div className="text-muted-foreground mt-1 text-xs">
                                    Điểm TB: {avg}/100
                                  </div>
                                )}
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                    {selectedSessionId && historySessions.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setSelectedSessionId(null)}
                      >
                        Xem kết quả mới nhất
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <>
        <div className="flex flex-wrap gap-2" aria-label="Các bước phỏng vấn">
          {stepLabels.map((label, i) => {
            const isDone = activeStepIdx > i
            const isCurrent = activeStepIdx === i
            return (
              <span
                key={`${label}-${i}`}
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  isCurrent
                    ? "border-primary/40 bg-primary/10 text-primary shadow-sm ring-2 ring-primary/20"
                    : isDone
                      ? "border-primary/25 bg-primary/5 text-primary"
                      : "border-border bg-muted/60 text-muted-foreground"
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="mr-1 size-3.5 opacity-90" aria-hidden />
                ) : null}
                {label}
              </span>
            )
          })}
        </div>

        <div className="space-y-2">
          <div className="bg-muted/80 h-2.5 w-full overflow-hidden rounded-full ring-1 ring-border/60">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary via-[var(--brand-deep)] to-[var(--brand-cyan)] transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
              role="progressbar"
              aria-valuenow={Math.round(progressPct)}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>

        {error && view === "interview" && (
          <div
            className="border-destructive/45 bg-destructive/10 text-destructive flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-sm"
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{error}</span>
          </div>
        )}

        {stage === "loading" && (
          <Card className="overflow-hidden rounded-2xl border-2 border-violet-400/35 bg-gradient-to-br from-violet-500/10 via-card to-fuchsia-500/5 shadow-lg">
            <CardContent className="flex items-center gap-4 bg-gradient-to-br from-violet-500/5 to-transparent px-6 py-8">
              <Loader2
                className="text-primary h-9 w-9 shrink-0 animate-spin"
                aria-hidden
              />
              <p className="text-foreground font-medium">
                Đang tạo phiên và chọn câu hỏi…
              </p>
            </CardContent>
          </Card>
        )}

        {stage === "error" && (
          <Card className="rounded-2xl border-2 border-destructive/35 bg-gradient-to-br from-destructive/5 via-card to-transparent shadow-lg">
            <CardHeader>
              <CardTitle>Không thể bắt đầu</CardTitle>
              <CardDescription>
                Kiểm tra đăng nhập học sinh và kết nối tới máy chủ.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button type="button" onClick={() => void beginInterview()}>
                Thử lại
              </Button>
            </CardContent>
          </Card>
        )}

        {stage === "mic" && sessionId && (
          <Card
            className={cn(
              "overflow-x-hidden rounded-2xl border-2 border-teal-500/35 bg-gradient-to-br from-teal-500/10 via-card to-cyan-500/5 shadow-lg transition-all duration-300",
              isRecording &&
                "border-cyan-400/55 shadow-cyan-500/20 ring-2 ring-cyan-400/25",
            )}
          >
            <CardHeader className="space-y-1 border-b border-teal-500/20 bg-gradient-to-r from-teal-500/12 via-transparent to-cyan-500/8 pb-4">
              <CardTitle className="flex items-center gap-3 text-lg">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/30 to-cyan-500/20 text-teal-800 shadow-md dark:text-teal-200">
                  <Mic className="h-5 w-5" aria-hidden />
                </span>
                Kiểm tra camera & micro
              </CardTitle>
              <CardDescription className="text-pretty">
                Nhấn &quot;Bắt đầu thu&quot;, cho phép Camera và Micro, nói vài câu tiếng Anh, rồi
                &quot;Dừng và kiểm tra&quot; (tối đa{" "}
                {activeMaxRecordingSec}s — hết thời gian sẽ tự dừng).
                Clip video ngắn gửi tới API test trước khi vào phần chính.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6 pt-6 sm:gap-7 sm:px-8 sm:pt-8">
              <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                <div className="flex flex-wrap items-center gap-3">
                  {!isRecording ? (
                    <Button
                      type="button"
                      onClick={() => void startRecording()}
                      disabled={busy || isArmingMic}
                      className={cn(
                        "relative h-auto min-h-[52px] overflow-hidden rounded-2xl border-0 px-8 py-3.5 text-base font-semibold text-white shadow-lg transition hover:brightness-110 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-55",
                        "bg-gradient-to-r from-primary via-[var(--brand-deep)] to-[var(--brand-cyan)] shadow-primary/30",
                      )}
                    >
                      <span
                        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 transition-opacity duration-500 hover:opacity-100"
                        aria-hidden
                      />
                      {isArmingMic ? (
                        <>
                          <Loader2 className="relative mr-2 h-5 w-5 animate-spin" />
                          <span className="relative">Đang bật micro…</span>
                        </>
                      ) : (
                        <>
                          <Mic className="relative mr-2 h-5 w-5" />
                          <span className="relative">Bắt đầu thu</span>
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => void handleMicSubmit()}
                      disabled={busy}
                      className={cn(
                        "h-auto min-h-[52px] rounded-2xl border-2 border-rose-300/50 px-8 py-3.5 text-base font-semibold text-white shadow-lg transition hover:brightness-105 disabled:opacity-55",
                        "bg-gradient-to-r from-rose-500 to-orange-500 shadow-rose-500/25",
                      )}
                    >
                      <Square className="mr-2 h-5 w-5 fill-current" />
                      Dừng và kiểm tra
                    </Button>
                  )}
                  {busy && !isRecording && (
                    <Loader2 className="text-primary h-7 w-7 animate-spin" />
                  )}
                </div>
                {isRecording && (
                  <div
                    className="flex w-full shrink-0 flex-col items-stretch rounded-2xl border-2 border-cyan-500/45 bg-gradient-to-br from-cyan-500/20 via-teal-500/10 to-transparent px-4 py-3 shadow-inner sm:ml-auto sm:w-auto sm:min-w-[10.5rem] sm:items-end sm:px-5 sm:py-3.5"
                    aria-live="polite"
                  >
                    <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider sm:text-xs">
                      Thời gian ghi
                    </span>
                    <span className="font-university-display text-foreground text-3xl font-bold tabular-nums leading-none tracking-tight sm:text-4xl">
                      {formatRecordingDuration(recordingElapsedMs)}
                      <span className="text-muted-foreground ml-1 text-lg font-semibold sm:text-xl">
                        {recordingElapsedMs < 60_000 ? "giây" : ""}
                      </span>
                    </span>
                  </div>
                )}
              </div>
              <div className="grid w-full gap-4 lg:grid-cols-[minmax(18rem,0.72fr)_minmax(0,1fr)] lg:items-stretch">
                <CameraPreview
                  stream={vizStream}
                  active={isRecording}
                  accent="cyan"
                />
                <div className="bg-muted/25 w-full rounded-2xl border border-teal-500/30 p-4 sm:p-5">
                  <RecordingSpectrum
                    stream={vizStream}
                    active={isRecording}
                    accent="cyan"
                  />
                </div>
              </div>
              {isRecording && (
                <p className="text-muted-foreground w-full text-sm leading-relaxed">
                  Đang nghe… thanh sóng phản hồi theo âm thanh của bạn.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {stage === "question" && currentQuestion && (
          <Card
            className={cn(
              "overflow-x-hidden rounded-2xl border-2 border-sky-500/35 bg-gradient-to-br from-sky-500/10 via-card to-indigo-500/5 shadow-lg transition-all duration-300",
              isRecording &&
                "border-[var(--accent)]/50 shadow-[var(--accent)]/15 ring-2 ring-[var(--accent)]/25",
            )}
          >
            <CardHeader className="space-y-1 border-b border-sky-500/20 bg-gradient-to-r from-sky-500/12 via-transparent to-indigo-500/8 pb-4">
              <CardTitle className="flex flex-wrap items-center gap-2 gap-y-2 text-lg">
                <span className="h-1 w-10 shrink-0 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500" />
                <span className="flex flex-wrap items-center gap-2">
                  Câu {currentQuestionIdx + 1}{" "}
                  <span className="text-muted-foreground font-normal">
                    / {questions.length}
                  </span>
                  <MockInterviewDifficultyBadge
                    difficulty={currentQuestion.difficulty}
                  />
                </span>
              </CardTitle>
              <CardDescription>
                Trả lời bằng tiếng Anh; mỗi lần ghi tối đa{" "}
                {activeMaxRecordingSec}s (hết thời gian sẽ tự gửi).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6 sm:space-y-7 sm:px-8 sm:pt-8">
              <div className="bg-surface text-foreground min-h-[4.5rem] rounded-xl border-2 border-sky-500/20 bg-gradient-to-b from-sky-500/5 to-transparent p-4 text-base leading-relaxed font-medium shadow-inner sm:min-h-[5rem] sm:p-6 sm:text-lg">
                <p className="text-muted-foreground mb-2 flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide">
                  <span>{mockInterviewTypeLabelVi(currentQuestion.type)}</span>
                  <span aria-hidden>·</span>
                  <span>
                    {mockInterviewCategoryLabelVi(currentQuestion.category)}
                  </span>
                </p>
                {currentQuestion.text}
              </div>
              <div className="flex w-full flex-col gap-6">
                <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                  <div className="flex flex-wrap items-center gap-3">
                    {!isRecording ? (
                      <Button
                        type="button"
                        onClick={() => void startRecording()}
                        disabled={busy || isArmingMic}
                        className={cn(
                          "relative h-auto min-h-[52px] overflow-hidden rounded-2xl border-0 px-8 py-3.5 text-base font-semibold text-white shadow-lg transition hover:brightness-110 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-55",
                          "bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 shadow-sky-500/30",
                        )}
                      >
                        <span
                          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 transition-opacity duration-500 hover:opacity-100"
                          aria-hidden
                        />
                        {isArmingMic ? (
                          <>
                            <Loader2 className="relative mr-2 h-5 w-5 animate-spin" />
                            <span className="relative">Đang bật micro…</span>
                          </>
                        ) : (
                          <>
                            <Mic className="relative mr-2 h-5 w-5" />
                            <span className="relative">Bắt đầu trả lời</span>
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={() => void handleQuestionSubmit()}
                        disabled={busy}
                        className={cn(
                          "h-auto min-h-[52px] rounded-2xl border-2 border-amber-400/50 px-8 py-3.5 text-base font-semibold text-white shadow-lg transition hover:brightness-105 disabled:opacity-55",
                          "bg-gradient-to-r from-amber-500 to-orange-600 shadow-amber-500/25",
                        )}
                      >
                        <Square className="mr-2 h-5 w-5 fill-current" />
                        Dừng và gửi
                      </Button>
                    )}
                    {busy && !isRecording && (
                      <Loader2 className="text-primary h-7 w-7 animate-spin" />
                    )}
                  </div>
                  {isRecording && (
                    <div
                      className="flex w-full shrink-0 flex-col items-stretch rounded-2xl border-2 border-amber-500/45 bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent px-4 py-3 shadow-inner sm:ml-auto sm:w-auto sm:min-w-[10.5rem] sm:items-end sm:px-5 sm:py-3.5"
                      aria-live="polite"
                    >
                      <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider sm:text-xs">
                        Thời gian ghi
                      </span>
                      <span className="font-university-display text-foreground text-3xl font-bold tabular-nums leading-none tracking-tight sm:text-4xl">
                        {formatRecordingDuration(
                          Math.min(recordingElapsedMs, activeMaxRecordingMs),
                        )}
                        <span className="text-muted-foreground ml-1 text-lg font-semibold sm:text-xl">
                          / {activeMaxRecordingSec}s
                        </span>
                      </span>
                      <div className="bg-muted mt-2 h-1.5 w-full overflow-hidden rounded-full">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400 transition-[width] duration-100"
                          style={{
                            width: `${Math.min(100, (recordingElapsedMs / activeMaxRecordingMs) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="grid w-full gap-4 lg:grid-cols-[minmax(18rem,0.72fr)_minmax(0,1fr)] lg:items-stretch">
                  <CameraPreview
                    stream={vizStream}
                    active={isRecording}
                    accent="amber"
                  />
                  <div
                    className={cn(
                      "bg-muted/25 rounded-2xl border border-amber-500/30 p-4 sm:p-5",
                    )}
                  >
                    <RecordingSpectrum
                      stream={vizStream}
                      active={isRecording}
                      accent="amber"
                    />
                  </div>
                </div>
                {isRecording && (
                  <p className="text-muted-foreground w-full text-sm leading-relaxed">
                    Đang ghi âm — nói rõ ràng; sóng sẽ nhấp nhô theo giọng của bạn.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {stage === "results" && (
          <div className="space-y-4">
            <MockInterviewResultsPanel
              questions={questions}
              answers={answers}
              title="Kết quả phiên vừa rồi"
            />
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => void returnToHub()}
              >
                Về tổng quan & lịch sử
              </Button>
              <Button type="button" onClick={() => void tryBeginInterview()}>
                Bắt đầu phiên mới
              </Button>
            </div>
          </div>
        )}
          </>
        )}

      </div>

      <Dialog
        open={freeQuotaModalOpen}
        onOpenChange={setFreeQuotaModalOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Đã dùng hết lượt dùng thử</DialogTitle>
            <DialogDescription>
              Gói miễn phí chỉ cho phép hoàn thành một phiên phỏng vấn thử. Nâng
              cấp gói để tiếp tục luyện với AI.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setFreeQuotaModalOpen(false)}
            >
              Đóng
            </Button>
            <Button type="button" asChild>
              <Link href="/student/pricing">Xem gói & giá</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StudentPageContainer>
  )
}
