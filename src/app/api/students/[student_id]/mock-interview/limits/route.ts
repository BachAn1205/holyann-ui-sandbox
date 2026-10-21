import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getMockInterviewQuotaSnapshot } from "@/lib/mock-interview-quota"
import { requireStudentRouteAccess } from "@/lib/auth-utils"

export async function GET(
  _request: Request,
  context: { params: Promise<{ student_id: string }> },
) {
  const { student_id: studentId } = await context.params
  try {
    const currentUser = await requireStudentRouteAccess(studentId)
    const user = await prisma.users.findUnique({
      where: { id: currentUser.id },
      select: { subscription_plan: true },
    })
    if (!user) {
      return NextResponse.json(
        { error: "Không tìm thấy người dùng" },
        { status: 404 },
      )
    }
    const snap = await getMockInterviewQuotaSnapshot(
      prisma,
      currentUser.id,
      user.subscription_plan,
    )
    return NextResponse.json(snap)
  } catch (error) {
    const status =
      error instanceof Error &&
      (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")
        ? 401
        : 500
    return NextResponse.json(
      { error: status === 401 ? "Unauthorized" : "Lỗi lấy giới hạn" },
      { status },
    )
  }
}
