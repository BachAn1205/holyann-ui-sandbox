import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { prisma } from '@/lib/prisma';
import { TaskStatus } from '@prisma/client';
import { requirePremium } from '@/lib/api/require-premium';
import { tryDeleteStudentSubmissionFilesFromUrls } from '@/lib/s3-storage';

export async function POST(request: NextRequest) {
    try {
        const forbidden = await requirePremium(request);
        if (forbidden) return forbidden;

        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { taskId, studentId } = await request.json();

        if (!taskId || !studentId) {
            return NextResponse.json(
                { success: false, error: 'Missing taskId or studentId' },
                { status: 400 }
            );
        }

        if (studentId !== session.user.id) {
            return NextResponse.json(
                { success: false, error: 'Forbidden' },
                { status: 403 }
            );
        }

        const [linkedCustom, existingProgress] = await Promise.all([
            prisma.mentor_custom_deadlines.findFirst({
                where: {
                    id: taskId,
                    student_id: studentId,
                },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    stage_order: true,
                    created_at: true,
                    updated_at: true,
                    submission_url: true,
                },
            }),
            prisma.student_task_progress.findUnique({
                where: {
                    student_id_task_id: {
                        student_id: studentId,
                        task_id: taskId,
                    },
                },
                select: { submission_url: true },
            }),
        ]);

        await tryDeleteStudentSubmissionFilesFromUrls(studentId, [
            linkedCustom?.submission_url,
            existingProgress?.submission_url,
        ]);

        if (linkedCustom) {
            const stage = await prisma.checklist_stages.findFirst({
                where: { order_index: linkedCustom.stage_order ?? 1 },
                orderBy: { order_index: 'asc' },
                select: { id: true },
            }) ?? await prisma.checklist_stages.findFirst({
                orderBy: { order_index: 'asc' },
                select: { id: true },
            });

            if (stage) {
                await prisma.checklist_tasks.upsert({
                    where: { id: linkedCustom.id },
                    create: {
                        id: linkedCustom.id,
                        stage_id: stage.id,
                        title: linkedCustom.title,
                        description: linkedCustom.description,
                        link_to: null,
                        is_required: false,
                        order_index: 9000,
                        created_at: linkedCustom.created_at,
                        updated_at: linkedCustom.updated_at,
                    },
                    update: {
                        stage_id: stage.id,
                        title: linkedCustom.title,
                        description: linkedCustom.description,
                        updated_at: new Date(),
                    }
                })
            }
        }

        await prisma.student_task_progress.upsert({
            where: {
                student_id_task_id: {
                    student_id: studentId,
                    task_id: taskId,
                },
            },
            update: {
                submission_url: null,
                status: TaskStatus.PENDING,
                completed_at: null,
                updated_at: new Date(),
            },
            create: {
                id: randomUUID(),
                student_id: studentId,
                task_id: taskId,
                status: TaskStatus.PENDING,
                updated_at: new Date(),
            },
        });

        await prisma.mentor_custom_deadlines.updateMany({
            where: {
                id: taskId,
                student_id: studentId,
            },
            data: {
                status: TaskStatus.PENDING,
                submission_url: null,
                updated_at: new Date(),
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('❌ Error clearing submission:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
