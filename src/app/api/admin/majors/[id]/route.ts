import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

function isAdmin(session: { user?: { role?: string } } | null) {
  const role = session?.user?.role;
  return role === 'ADMIN' || role === 'admin';
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (Number.isNaN(numId)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const body = await request.json();
    const {
      occupation_name,
      industry_group,
      occupation_code,
      data_level,
      major_group_code,
      major_score,
      job_zone,
      status
    } = body;

    const data: Parameters<typeof prisma.major_faculty_catalog.update>[0]['data'] = {};
    if (occupation_name != null) data.occupation_name = String(occupation_name);
    if (industry_group !== undefined) data.industry_group = industry_group != null && String(industry_group).trim() !== '' ? String(industry_group) : null;
    if (occupation_code !== undefined) data.occupation_code = occupation_code != null && String(occupation_code).trim() !== '' ? String(occupation_code) : null;
    if (data_level !== undefined) data.data_level = data_level != null && String(data_level).trim() !== '' ? String(data_level) : null;
    if (major_group_code !== undefined) data.major_group_code = major_group_code != null && String(major_group_code).trim() !== '' ? String(major_group_code) : null;
    if (major_score !== undefined) data.major_score = major_score != null && major_score !== '' ? Number(major_score) : null;
    if (job_zone !== undefined) data.job_zone = job_zone != null && job_zone !== '' ? Number(job_zone) : null;
    if (status !== undefined) data.status = status != null && String(status).trim() !== '' ? String(status) : 'APPROVED';

    const updated = await prisma.major_faculty_catalog.update({
      where: { id: numId },
      data,
    });

    // Invalidate Redis Cache
    if (redis) {
      try {
        await redis.del('majors:approved');
      } catch (err) {
        console.error('[Redis] Failed to delete cache in admin update:', err);
      }
    }

    return NextResponse.json({ major: updated });
  } catch (error) {
    console.error('[PATCH /api/admin/majors/:id]', error);
    return NextResponse.json(
      { error: 'Không thể cập nhật' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (Number.isNaN(numId)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }
    await prisma.major_faculty_catalog.delete({
      where: { id: numId },
    });

    // Invalidate Redis Cache
    if (redis) {
      try {
        await redis.del('majors:approved');
      } catch (err) {
        console.error('[Redis] Failed to delete cache in admin delete:', err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/admin/majors/:id]', error);
    return NextResponse.json(
      { error: 'Không thể xóa' },
      { status: 500 }
    );
  }
}
