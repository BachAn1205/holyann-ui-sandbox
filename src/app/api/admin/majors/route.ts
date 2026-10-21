/**
 * Admin API – CRUD major_faculty_catalog
 * GET: list all. POST: create.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

function isAdmin(session: { user?: { role?: string } } | null) {
  const role = session?.user?.role;
  return role === 'ADMIN' || role === 'admin';
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const list = await prisma.major_faculty_catalog.findMany({
      orderBy: { id: 'desc' },
    });
    return NextResponse.json({ majors: list });
  } catch (error) {
    console.error('[GET /api/admin/majors]', error);
    return NextResponse.json(
      { error: 'Không thể tải danh sách' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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

    if (!occupation_name) {
      return NextResponse.json(
        { error: 'Thiếu trường bắt buộc: occupation_name' },
        { status: 400 },
      );
    }

    const created = await prisma.major_faculty_catalog.create({
      data: {
        occupation_name: String(occupation_name),
        industry_group: industry_group != null && String(industry_group).trim() !== '' ? String(industry_group) : null,
        occupation_code: occupation_code != null && String(occupation_code).trim() !== '' ? String(occupation_code) : null,
        data_level: data_level != null && String(data_level).trim() !== '' ? String(data_level) : null,
        major_group_code: major_group_code != null && String(major_group_code).trim() !== '' ? String(major_group_code) : null,
        major_score: major_score != null && major_score !== '' ? Number(major_score) : null,
        job_zone: job_zone != null && job_zone !== '' ? Number(job_zone) : null,
        status: status != null && String(status).trim() !== '' ? String(status) : 'APPROVED',
      },
    });

    // Invalidate Redis Cache
    if (redis) {
      try {
        await redis.del('majors:approved');
      } catch (err) {
        console.error('[Redis] Failed to delete cache in admin create:', err);
      }
    }

    return NextResponse.json({ major: created });
  } catch (error) {
    console.error('[POST /api/admin/majors]', error);
    return NextResponse.json(
      { error: 'Không thể tạo bản ghi' },
      { status: 500 }
    );
  }
}
