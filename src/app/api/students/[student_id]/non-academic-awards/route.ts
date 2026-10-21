import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
    ensureStudentAndBackground,
    toStudentContextErrorResponse,
} from '@/lib/student-background';
import { v4 as uuidv4 } from 'uuid';

function optionalTrimmed(val: unknown, maxLen: number): string | null {
    if (val === undefined || val === null) return null;
    const s = String(val).trim();
    if (!s) return null;
    return s.length > maxLen ? s.slice(0, maxLen) : s;
}

function optionalInt(val: unknown): number | null {
    if (val === undefined || val === null || val === '') return null;
    if (typeof val === 'number' && Number.isFinite(val)) return Math.trunc(val);
    const n = parseInt(String(val).trim(), 10);
    return Number.isFinite(n) ? n : null;
}

// Giải thưởng phi học thuật
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ student_id: string }> }
) {
    try {
        const { student_id } = await params;

        await ensureStudentAndBackground(student_id);

        const awards = await prisma.non_academic_awards.findMany({
            where: { background_id: student_id },
            orderBy: { award_date: 'desc' }
        });

        return NextResponse.json(awards);
    } catch (error) {
        console.error('❌ Error fetching non-academic awards:', error);
        return NextResponse.json(
            { error: 'Lỗi khi lấy giải thưởng phi học thuật' },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ student_id: string }> }
) {
    try {
        const { student_id } = await params;
        const body = await request.json();

        await ensureStudentAndBackground(student_id);

        const award = await prisma.non_academic_awards.create({
            data: {
                id: uuidv4(),
                background_id: student_id,
                award_name: String(body.award_name ?? '').trim().slice(0, 255),
                category: optionalTrimmed(body.category, 100),
                issuing_organization: optionalTrimmed(
                    body.issuing_organization,
                    255
                ),
                award_level: optionalTrimmed(body.award_level, 100),
                award_date: body.award_date ? new Date(body.award_date) : undefined,
                description: optionalTrimmed(body.description, 10_000),
                certificate_url: optionalTrimmed(body.certificate_url, 2048),
                rank: optionalInt(body.rank),
                region: optionalTrimmed(body.region, 50),
                year: optionalInt(body.year),
            }
        });

        return NextResponse.json({
            success: true,
            data: award
        });
    } catch (error) {
        const contextErrorRes = toStudentContextErrorResponse(error);
        if (contextErrorRes) return contextErrorRes;
        console.error('❌ Error creating non-academic award:', error);
        return NextResponse.json(
            { error: 'Lỗi khi tạo giải thưởng phi học thuật' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ student_id: string }> }
) {
    try {
        const { student_id } = await params;
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (id) {
            await prisma.non_academic_awards.deleteMany({
                where: { id, background_id: student_id }
            });
        } else {
            await prisma.non_academic_awards.deleteMany({
                where: { background_id: student_id }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('❌ Error deleting non-academic awards:', error);
        return NextResponse.json(
            { error: 'Lỗi khi xóa giải thưởng phi học thuật' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, ...data } = body;

        const patch: Prisma.non_academic_awardsUpdateInput = {};
        if (data.award_name !== undefined) {
            patch.award_name = String(data.award_name ?? '').trim().slice(0, 255);
        }
        if ('category' in data) {
            patch.category = optionalTrimmed(data.category, 100);
        }
        if ('issuing_organization' in data) {
            patch.issuing_organization = optionalTrimmed(
                data.issuing_organization,
                255
            );
        }
        if ('award_level' in data) {
            patch.award_level = optionalTrimmed(data.award_level, 100);
        }
        if ('award_date' in data) {
            patch.award_date = data.award_date
                ? new Date(data.award_date)
                : null;
        }
        if ('description' in data) {
            patch.description = optionalTrimmed(data.description, 10_000);
        }
        if ('certificate_url' in data) {
            patch.certificate_url = optionalTrimmed(data.certificate_url, 2048);
        }
        if ('rank' in data) {
            patch.rank = optionalInt(data.rank);
        }
        if ('region' in data) {
            patch.region = optionalTrimmed(data.region, 50);
        }
        if ('year' in data) {
            patch.year = optionalInt(data.year);
        }

        const award = await prisma.non_academic_awards.update({
            where: { id },
            data: patch,
        });

        return NextResponse.json({
            success: true,
            data: award
        });
    } catch (error) {
        console.error('❌ Error updating non-academic award:', error);
        return NextResponse.json(
            { error: 'Lỗi khi cập nhật giải thưởng phi học thuật' },
            { status: 500 }
        );
    }
}
