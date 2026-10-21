import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ student_id: string }> }
) {
  const { student_id: studentId } = await context.params;
  try {
    const body = await request.json();
    const experiments = Array.isArray(body.experiments)
      ? body.experiments.filter((x: unknown) => typeof x === "string")
      : [];

    await prisma.student_backgrounds.upsert({
      where: { student_id: studentId },
      update: { experiments: experiments as unknown as object },
      create: {
        student_id: studentId,
        experiments: experiments as unknown as object,
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Lỗi cập nhật experiments";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
