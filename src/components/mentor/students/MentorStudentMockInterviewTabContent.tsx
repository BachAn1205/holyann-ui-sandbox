"use client"

import { useEffect, useState } from "react"
import { CompletedMockInterviewSessionsList } from "@/components/student/mock-interview/CompletedMockInterviewSessionsList"
import type { MockInterviewCompletedSessionDto } from "@/components/student/mock-interview/CompletedMockInterviewSessionsList"

export function MentorStudentMockInterviewTabContent({
  studentId,
}: {
  studentId: string
}) {
  const [state, setState] = useState<{
    loading: boolean
    error: string | null
    sessions: MockInterviewCompletedSessionDto[]
  }>({ loading: true, error: null, sessions: [] })

  useEffect(() => {
    let cancelled = false
    setState({ loading: true, error: null, sessions: [] })
    void (async () => {
      const res = await fetch(
        `/api/mentor/students/${studentId}/mock-interview/sessions`,
        { cache: "no-store" },
      )
      if (cancelled) return
      if (!res.ok) {
        setState({
          loading: false,
          error:
            res.status === 403
              ? "Không có quyền xem dữ liệu này."
              : `Không tải được (${res.status}).`,
          sessions: [],
        })
        return
      }
      const j = (await res.json()) as {
        sessions?: MockInterviewCompletedSessionDto[]
      }
      const sessions = Array.isArray(j.sessions) ? j.sessions : []
      setState({ loading: false, error: null, sessions })
    })()
    return () => {
      cancelled = true
    }
  }, [studentId])

  if (state.loading) {
    return (
      <div className="space-y-3 py-6">
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
      </div>
    )
  }
  if (state.error) {
    return <p className="text-sm text-destructive py-4">{state.error}</p>
  }
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Kết quả phỏng vấn thử (Feature 8) do Holie Mate chấm theo rubric tiếng
        Anh.
      </p>
      <CompletedMockInterviewSessionsList
        sessions={state.sessions}
        emptyMessage="Học viên chưa hoàn thành buổi phỏng vấn thử nào."
      />
    </div>
  )
}
