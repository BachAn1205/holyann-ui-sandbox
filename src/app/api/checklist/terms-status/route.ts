import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudentAuth } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  try {
    const user = await requireStudentAuth();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // 1. Tìm task terms
    const task = await prisma.checklist_tasks.findFirst({
      where: {
        link_to: {
          contains: "terms",
          mode: "insensitive",
        },
      },
    });

    if (!task) {
      return NextResponse.json({ success: true, isCompleted: false });
    }

    // 2. Tìm progress của student
    const progress = await prisma.student_task_progress.findUnique({
      where: {
        student_id_task_id: {
          student_id: user.id,
          task_id: task.id,
        },
      },
    });

    const isCompleted = progress?.status === "COMPLETED";

    return NextResponse.json({ success: true, isCompleted });
  } catch (error) {
    console.error("❌ [TermsStatus] Error:", error);
    return NextResponse.json({ success: false, error: "Internal Error" }, { status: 500 });
  }
}
