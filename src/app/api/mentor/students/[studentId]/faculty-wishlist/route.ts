import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId } = await params;

    // Verify mentor has access to this student
    const assignment = await prisma.mentor_assignments.findFirst({
      where: { mentor_id: session.user.id, student_id: studentId },
    });
    if (!assignment) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 1. Lấy tất cả wishlist ngành của học viên
    const wishlistItems = await prisma.faculty_wishlist.findMany({
      where: { student_id: studentId },
      orderBy: { sort_order: 'asc' },
    });

    const faculties = wishlistItems.map(item => item.faculty_name);

    // Truy vấn bằng raw SQL để tương thích cả khi Prisma Client local chưa sync schema mới.
    const matchedMajors = faculties.length > 0
      ? await prisma.$queryRaw<Array<{
          id: number;
          occupation_name: string;
          industry_group: string | null;
          occupation_code: string | null;
          status: string | null;
          created_by_user_id: string | null;
        }>>(
          Prisma.sql`
            SELECT id, occupation_name, industry_group, occupation_code, status, created_by_user_id
            FROM major_faculty_catalog
            WHERE occupation_name IN (${Prisma.join(faculties)})
          `
        )
      : [];

    // 2. Lấy các ngành PENDING để bổ sung hiển thị.
    // Lưu ý: một số môi trường chưa có field created_by_user_id trong Prisma Client runtime,
    // nên không filter trực tiếp bằng field này để tránh runtime error.
    const proposedMajors = await prisma.$queryRaw<Array<{
      id: number;
      occupation_name: string;
      industry_group: string | null;
      occupation_code: string | null;
      status: string | null;
      created_by_user_id: string | null;
    }>>(
      Prisma.sql`
        SELECT id, occupation_name, industry_group, occupation_code, status, created_by_user_id
        FROM major_faculty_catalog
        WHERE status = 'PENDING'
      `
    );

    // Gom dữ liệu trả về 
    // - Item có trong wishlist (Dù là PENDING hay APPROVED) sẽ được list ở đây, có sort_order đàng hoàng
    // - Ngành PENDING do học viên tạo nhưng không có trong wishlist sẽ được thêm vào với sort_order "ảo"
    
    const responseItems: any[] = [];
    const processedIds = new Set<number>();
    const processedNames = new Set<string>();

    const pickMajorForWishlist = (facultyName: string) => {
      const sameName = matchedMajors.filter((m) => m.occupation_name === facultyName);
      if (sameName.length === 0) return null;

      // Ưu tiên bản ghi PENDING để mentor thấy đúng item đang chờ duyệt.
      const pending = sameName.find((m) => m.status === 'PENDING') ?? null;
      if (pending) return pending;

      const approved = sameName.find((m) => m.status === 'APPROVED') ?? null;
      if (approved) return approved;

      return sameName[0] ?? null;
    };

    wishlistItems.forEach((w) => {
      processedNames.add(w.faculty_name);
      
      const majorInfo = pickMajorForWishlist(w.faculty_name);

      if (majorInfo) {
        processedIds.add(majorInfo.id);
      }

      responseItems.push({
        major_id: majorInfo?.id ?? null,
        faculty_name: w.faculty_name,
        industry_group: majorInfo?.industry_group ?? null,
        occupation_code: majorInfo?.occupation_code ?? null,
        status: majorInfo?.status ?? 'APPROVED',
        sort_order: w.sort_order,
        in_wishlist: true
      });
    });

    // Thêm các ngành đã đề xuất nhưng không có mặt trong thư mục wishlist (vd do giới hạn limit vượt quá)
    proposedMajors.forEach((m) => {
      const createdBy = String(m?.created_by_user_id ?? '');
      if (createdBy && createdBy !== String(studentId)) {
        return;
      }
      if (!processedIds.has(m.id) && !processedNames.has(m.occupation_name)) {
        responseItems.push({
          major_id: m.id,
          faculty_name: m.occupation_name,
          industry_group: m.industry_group,
          occupation_code: m.occupation_code,
          status: 'PENDING',
          sort_order: 9999, // thứ tự đẩy xuống cuối
          in_wishlist: false
        });
      }
    });

    return NextResponse.json({
      items: responseItems
    });
  } catch (e) {
    console.error('[mentor faculty-wishlist] GET', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
