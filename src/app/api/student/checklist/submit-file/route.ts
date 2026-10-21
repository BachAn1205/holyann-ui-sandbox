import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TaskStatus } from '@prisma/client'
import { requirePremium } from '@/lib/api/require-premium'
import { requireStudentAuth } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
    try {
        const forbidden = await requirePremium(request)
        if (forbidden) return forbidden

        const user = await requireStudentAuth()
        const { taskId, fileUrl } = await request.json()

        if (!taskId || !fileUrl) {
            return NextResponse.json({
                success: false,
                error: 'Missing required fields'
            }, { status: 400 })
        }

        const linkedCustom = await prisma.mentor_custom_deadlines.findFirst({
            where: {
                id: taskId,
                student_id: user.id,
            },
            select: {
                id: true,
                title: true,
                description: true,
                stage_order: true,
                created_at: true,
                updated_at: true,
            }
        });

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

        const taskProgress = await prisma.student_task_progress.upsert({
            where: {
                student_id_task_id: {
                    student_id: user.id,
                    task_id: taskId
                }
            },
            update: {
                status: TaskStatus.SUBMITTED,
                submission_url: fileUrl,
                completed_at: new Date(),
                updated_at: new Date()
            },
            create: {
                id: randomUUID(),
                student_id: user.id,
                task_id: taskId,
                status: TaskStatus.SUBMITTED,
                submission_url: fileUrl,
                completed_at: new Date(),
                created_at: new Date(),
                updated_at: new Date()
            }
        })

        await prisma.mentor_custom_deadlines.updateMany({
            where: {
                id: taskId,
                student_id: user.id,
            },
            data: {
                status: TaskStatus.SUBMITTED,
                submission_url: fileUrl,
                updated_at: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            data: taskProgress
        })

    } catch (error) {
        console.error('❌ Error submitting file task:', error)
        const status = error instanceof Error && error.message === 'UNAUTHORIZED' ? 401 : 500
        return NextResponse.json({
            success: false,
            error: status === 401 ? 'Unauthorized' : 'Internal server error'
        }, { status })
    }
}
