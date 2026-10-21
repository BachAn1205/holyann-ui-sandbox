import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma"; // Force Turbopack refresh

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { full_name: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Không tìm thấy người dùng" }, { status: 404 });
    }

    return NextResponse.json({
      full_name: user.full_name,
      email: user.email,
    });
  } catch (error) {
    console.error("[Profile GET Error]", error);
    return NextResponse.json({ error: "Không thể tải hồ sơ" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { full_name } = body;

    if (!full_name || typeof full_name !== "string" || full_name.trim().length === 0) {
      return NextResponse.json(
        { error: "Tên hiển thị không được để trống" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.users.update({
      where: {
        id: session.user.id,
      },
      data: {
        full_name: full_name.trim(),
      },
    });

    return NextResponse.json(
      { message: "Cập nhật thành công", user: updatedUser },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Profile Update Error]", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi cập nhật thông tin" },
      { status: 500 }
    );
  }
}
