import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-config'
import { TaskStatus } from '@prisma/client'
import { requirePremium } from '@/lib/api/require-premium'
import { redis } from '@/lib/redis'

const CUSTOM_TASK_LINK_MARKER = '__CUSTOM_TASK__'

function normalizeText(value: string | null | undefined) {
    return (value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim()
}

function extractStageOrder(stageText: string | null | undefined) {
    if (!stageText) return null
    const match = stageText.match(/giai\s*doan\s*(\d+)/i)
    if (!match) return null
    const order = Number(match[1])
    return Number.isFinite(order) ? order : null
}

const STAGES_CACHE_KEY = 'checklist:stages'
const STAGES_CACHE_TTL = 43200 // 12 hours

export async function GET(request: NextRequest) {
    try {
        const forbidden = await requirePremium(request)
        if (forbidden) return forbidden

        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            console.error('❌ [Tiến độ API] No session or user ID')
            return NextResponse.json({
                success: false,
                error: 'Unauthorized - No valid session'
            }, { status: 401 })
        }

        const studentId = session.user.id

        // Check if student exists
        const student = await prisma.students.findUnique({
            where: { user_id: studentId },
            select: { user_id: true }
        })

        if (!student) {
            console.error('❌ [Tiến độ API] Student not found in DB for user:', studentId)
            return NextResponse.json({
                success: false,
                error: 'Student record not found'
            }, { status: 404 })
        }

        // Student found, fetching checklist data

        // Try reading stages from cache
        let stages: any[] = []
        if (redis) {
            try {
                const cached = await redis.get(STAGES_CACHE_KEY)
                if (cached) {
                    stages = JSON.parse(cached)
                }
            } catch (err) {
                console.error('[Redis] Failed to read checklist stages:', err)
            }
        }

        if (stages.length === 0) {
            stages = await prisma.checklist_stages.findMany({
                orderBy: { order_index: 'asc' },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    order_index: true
                }
            })

            if (redis && stages.length > 0) {
                try {
                    await redis.set(STAGES_CACHE_KEY, JSON.stringify(stages), 'EX', STAGES_CACHE_TTL)
                } catch (err) {
                    console.error('[Redis] Failed to write checklist stages cache:', err)
                }
            }
        }

        // Get tasks with progress
        const tasks = await prisma.checklist_tasks.findMany({
            include: {
                checklist_stages: {
                    select: {
                        id: true,
                        name: true,
                        order_index: true
                    }
                },
                student_task_progress: {
                    where: {
                        student_id: studentId
                    }
                }
            },
            orderBy: [
                { checklist_stages: { order_index: 'asc' } },
                { order_index: 'asc' }
            ]
        })

        // CV task: complete when student has >= 1 CV on manage-upload page
        const cvTask = tasks.find(t => /CV/i.test(t.title))
        let cvCount = 0
        if (cvTask) {
            cvCount = await prisma.student_cv_documents.count({ where: { student_id: studentId } })
        }

        // Transform tasks to include status
        const transformedTasks = tasks
            .filter(task => task.link_to !== CUSTOM_TASK_LINK_MARKER)
            .map(task => {
            const progress = task.student_task_progress[0] // First match due to unique constraint
            const isCvTask = cvTask && task.id === cvTask.id
            const completedByCvUpload = isCvTask && cvCount >= 1

            return {
                id: task.id,
                stage_id: task.stage_id,
                stage: task.checklist_stages ? { id: task.checklist_stages.id, name: task.checklist_stages.name } : undefined,
                title: task.title,
                description: task.description,
                is_custom: false,
                priority: null,
                link_to: isCvTask ? '/student/manage-upload' : task.link_to,
                is_required: task.is_required,
                task_type: task.task_type,
                order_index: task.order_index,
                isCompleted: completedByCvUpload || progress?.status === TaskStatus.COMPLETED,
                status: completedByCvUpload ? TaskStatus.COMPLETED : progress?.status,
                uploadedFile: isCvTask && completedByCvUpload ? 'Đã có CV' : progress?.submission_url,
                feedback: progress?.mentor_note,
                student_note: progress?.student_note ?? null,
                progress_id: progress?.id ?? null,
                linkToManageUpload: !!isCvTask
            }
        })

        // Fetch custom tasks for student
        const customDeadlines = await prisma.mentor_custom_deadlines.findMany({
            where: { student_id: studentId }
        });

        const customTaskIds = customDeadlines.map(ct => ct.id);
        const customTaskIdSet = new Set(customTaskIds);
        const customProgressList = customTaskIds.length
            ? await prisma.student_task_progress.findMany({
                where: {
                    student_id: studentId,
                    task_id: { in: customTaskIds }
                },
                select: {
                    id: true,
                    student_id: true,
                    task_id: true,
                    status: true,
                    submission_url: true,
                    mentor_note: true,
                    student_note: true,
                    deadline: true,
                    completed_at: true,
                    created_at: true,
                    updated_at: true,
                    reviewed_by_mentor_id: true
                }
            })
            : [];
        const customProgressByTaskId = new Map(customProgressList.map(p => [p.task_id, p]));

        const baseTransformedTasks = transformedTasks.filter(task => !customTaskIdSet.has(task.id));

        const customTransformedTasks = customDeadlines.map((ct, idx) => {
            const progress = customProgressByTaskId.get(ct.id);
            const targetOrder = ct.stage_order ?? extractStageOrder(normalizeText(ct.stage));
            const normalizedCustomStage = normalizeText(ct.stage);
            const matchedStage =
                stages.find(s => targetOrder != null && s.order_index === targetOrder) ||
                stages.find(s => normalizeText(s.name) === normalizedCustomStage) ||
                stages[0];
            return {
                id: ct.id,
                stage_id: matchedStage?.id || 1,
                stage: matchedStage ? { id: matchedStage.id, name: matchedStage.name } : undefined,
                title: ct.title,
                description: ct.description,
                is_custom: true,
                priority: ct.priority,
                link_to: null,
                is_required: true,
                task_type: null,
                order_index: 9000 + idx,
                isCompleted: (progress?.status ?? ct.status) === TaskStatus.COMPLETED,
                status: progress?.status ?? ct.status,
                uploadedFile: progress?.submission_url ? 'File đã upload' : null,
                feedback: progress?.mentor_note ?? ct.mentor_note,
                student_note: progress?.student_note ?? ct.student_note ?? null,
                progress_id: progress?.id ?? ct.id,
                linkToManageUpload: false
            };
        });

        const allTransformedTasks = [...baseTransformedTasks, ...customTransformedTasks];

        // Add isUnlocked to stages (simple logic: stage 1 always unlocked, others based on previous completion)
        const stagesWithLockStatus = stages.map((stage, index) => ({
            ...stage,
            isUnlocked: index === 0 // For now, only first stage is unlocked    
        }))

        // Get progress for each task
        const mappedCustomProgress: any[] = customDeadlines.map(ct => {
            const progress = customProgressByTaskId.get(ct.id);
            if (progress) {
                return progress;
            }
            return {
                id: ct.id,
                student_id: ct.student_id,
                task_id: ct.id,
                status: ct.status,
                submission_url: null,
                mentor_note: ct.mentor_note,
                student_note: ct.student_note,
                deadline: ct.deadline,
                completed_at: ct.status === TaskStatus.COMPLETED ? ct.updated_at : null,
                created_at: ct.created_at,
                updated_at: ct.updated_at,
                reviewed_by_mentor_id: null
            };
        });

        const taskProgress = await prisma.student_task_progress.findMany({      
            where: { student_id: studentId },
            select: {
                id: true,
                student_id: true,
                task_id: true,
                status: true,
                submission_url: true,
                mentor_note: true,
                student_note: true,
                deadline: true,
                completed_at: true,
                created_at: true,
                updated_at: true,
                reviewed_by_mentor_id: true
            }
        })

        const allTaskProgress = [...taskProgress, ...mappedCustomProgress];

        return NextResponse.json({
            success: true,
            data: {
                stages: stagesWithLockStatus,
                tasks: allTransformedTasks,
                progress: allTaskProgress
            }
        })

    } catch (error) {
        console.error('?? [Tiến độ API] Error getting student tiến đọ:', {
            error: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : undefined
        })
        return NextResponse.json({
            success: false,
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : String(error) : undefined
        }, { status: 500 })
    }
}
