import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-config'
import { prisma } from '@/lib/prisma'
import { TaskStatus } from '@prisma/client'
import { requirePremium } from '@/lib/api/require-premium'

export async function POST(request: NextRequest) {
    try {
        const forbidden = await requirePremium(request)
        if (forbidden) return forbidden

        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({
                success: false,
                error: 'Unauthorized'
            }, { status: 401 })
        }

        const { taskId, isCompleted } = await request.json()

        if (!taskId) {
            return NextResponse.json({
                success: false,
                error: 'Missing taskId'
            }, { status: 400 })
        }

        const studentId = session.user.id

        const linkedCustom = await prisma.mentor_custom_deadlines.findFirst({
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

        // Upsert task progress
        const taskProgress = await prisma.student_task_progress.upsert({
            where: {
                student_id_task_id: {
                    student_id: studentId,
                    task_id: taskId
                }
            },
            update: {
                status: isCompleted ? TaskStatus.COMPLETED : TaskStatus.PENDING,
                completed_at: isCompleted ? new Date() : null,
                updated_at: new Date()
            },
            create: {
                id: randomUUID(),
                student_id: studentId,
                task_id: taskId,
                status: isCompleted ? TaskStatus.COMPLETED : TaskStatus.PENDING,
                completed_at: isCompleted ? new Date() : null,
                created_at: new Date(),
                updated_at: new Date()
            }
        })

        await prisma.mentor_custom_deadlines.updateMany({
            where: {
                id: taskId,
                student_id: studentId,
            },
            data: {
                status: isCompleted ? TaskStatus.COMPLETED : TaskStatus.PENDING,
                updated_at: new Date(),
            },
        });


        return NextResponse.json({
            success: true,
            data: taskProgress
        })

    } catch (error) {
        console.error('❌ Error toggling task:', error)
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 })
    }
}
