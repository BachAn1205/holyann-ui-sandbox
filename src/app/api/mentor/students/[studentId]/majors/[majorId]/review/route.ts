import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ studentId: string; majorId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId, majorId } = await params;
    const body = await request.json();
    const action = body?.action; // 'APPROVE' | 'REJECT'

    if (action !== 'APPROVE' && action !== 'REJECT') {
      return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
    }

    // Verify mentor has access to this student
    const assignment = await prisma.mentor_assignments.findFirst({
      where: { mentor_id: session.user.id, student_id: studentId },
    });
    
    // NẾU ROLE lÀ ADMIN thì bypass check, nhưng logic này dành cho Mentor nên check assignment
    if (!assignment) {
      return NextResponse.json({ error: 'Bạn không có quyền quản lý học viên này' }, { status: 403 });
    }

    const majorNumId = parseInt(majorId, 10);
    if (isNaN(majorNumId)) {
        return NextResponse.json({ error: 'ID ngành không hợp lệ' }, { status: 400 });
    }

    const major = await prisma.major_faculty_catalog.findUnique({
      where: { id: majorNumId }
    });

    if (!major) {
      return NextResponse.json({ error: 'Không tìm thấy ngành' }, { status: 404 });
    }

    if (action === 'APPROVE') {
      // Approve -> Update status to APPROVED
      await prisma.major_faculty_catalog.update({
        where: { id: majorNumId },
        data: { status: 'APPROVED' },
      });
      
      // Tự động thêm vào wishlist của học viên
      const existingInWishlist = await prisma.faculty_wishlist.findFirst({
        where: { student_id: studentId, faculty_name: major.occupation_name }
      });
      
      if (!existingInWishlist) {
         const maxSortOrder = await prisma.faculty_wishlist.aggregate({
            where: { student_id: studentId },
            _max: { sort_order: true }
         });
         const nextSortOrder = (maxSortOrder._max.sort_order ?? -1) + 1;
         
         const { randomUUID } = await import('crypto');
         await prisma.faculty_wishlist.create({
            data: {
              id: randomUUID(),
              student_id: studentId,
              faculty_name: major.occupation_name,
              sort_order: nextSortOrder
            }
         });
      }

      // Invalidate Redis Cache
      if (redis) {
        try {
          await redis.del('majors:approved');
        } catch (err) {
          console.error('[Redis] Failed to delete cache in mentor review:', err);
        }
      }

      return NextResponse.json({ success: true, message: 'Đã duyệt ngành và thêm vào nguyện vọng' });
    } else {
      // Reject -> Delete it (if it was created by someone and is pending)
      // Dọn dẹp cả faculty_wishlist tham chiếu tới tên ngành này của học viên
      await prisma.$transaction([
        prisma.faculty_wishlist.deleteMany({
          where: { student_id: studentId, faculty_name: major.occupation_name }
        }),
        prisma.major_faculty_catalog.delete({
          where: { id: majorNumId }
        })
      ]);

      // Invalidate Redis Cache
      if (redis) {
        try {
          await redis.del('majors:approved');
        } catch (err) {
          console.error('[Redis] Failed to delete cache in mentor review reject:', err);
        }
      }

      return NextResponse.json({ success: true, message: 'Đã từ chối và xoá ngành' });
    }
  } catch (e) {
    console.error('[mentor majors review] PATCH error', e);
    return NextResponse.json({ error: 'Có lỗi xảy ra khi cập nhật' }, { status: 500 });
  }
}
