import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStudentRouteAccess } from '@/lib/auth-utils';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ student_id: string }> }
) {
    try {
        const { student_id } = await params;
        const currentUser = await requireStudentRouteAccess(student_id);
        const body = await request.json();

        await prisma.students.upsert({
            where: { user_id: currentUser.id },
            create: { user_id: currentUser.id },
            update: {},
        });

        const skill = await prisma.student_skills.create({
            data: {
                id: uuidv4(),
                student_id: currentUser.id,
                skill_name: String(body.skill_name ?? '').trim(),
                proficiency: body.proficiency != null ? String(body.proficiency) : null,
                category: body.category != null ? String(body.category) : null,
                created_at: new Date(),
                updated_at: new Date()
            }
        });

        return NextResponse.json(skill);
    } catch (error) {
        if (error instanceof Error && (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.error('Error creating skill:', error);
        return NextResponse.json(
            { error: 'Failed to create skill' },
            { status: 500 }
        );
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ student_id: string }> }
) {
    try {
        const { student_id } = await params;
        const currentUser = await requireStudentRouteAccess(student_id);

        const skills = await prisma.student_skills.findMany({
            where: { student_id: currentUser.id },
            orderBy: { created_at: 'desc' }
        });

        return NextResponse.json(skills);
    } catch (error) {
        if (error instanceof Error && (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.error('Error fetching skills:', error);
        return NextResponse.json(
            { error: 'Failed to fetch skills' },
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
        const currentUser = await requireStudentRouteAccess(student_id);

        await prisma.student_skills.deleteMany({
            where: { student_id: currentUser.id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof Error && (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.error('Error deleting skills:', error);
        return NextResponse.json(
            { error: 'Failed to delete skills' },
            { status: 500 }
        );
    }
}
