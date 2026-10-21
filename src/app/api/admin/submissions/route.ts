import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {

        // Get all submitted files with student and task information
        const submissions = await prisma.student_task_progress.findMany({
            where: {
                submission_url: { not: null }, // Only records with uploaded files
                status: { in: ['SUBMITTED', 'COMPLETED', 'NEEDS_REVISION'] }
            },
            select: {
                id: true,
                student_id: true,
                submission_url: true,
                status: true,
                mentor_note: true,
                completed_at: true,
                created_at: true,
                updated_at: true,
                students: {
                    select: {
                        users: {
                            select: {
                                full_name: true,
                                email: true
                            }
                        }
                    }
                },
                checklist_tasks: {
                    select: {
                        title: true,
                        description: true
                    }
                }
            },
            orderBy: {
                created_at: 'desc' // Most recent first
            }
        });


        // Group by status for statistics
        const stats = {
            submitted: submissions.filter(s => s.status === 'SUBMITTED').length,
            completed: submissions.filter(s => s.status === 'COMPLETED').length,
            needs_revision: submissions.filter(s => s.status === 'NEEDS_REVISION').length,
            total: submissions.length
        };

        return NextResponse.json({
            success: true,
            submissions,
            stats
        });

    } catch (error) {
        console.error('❌ Error fetching submissions:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch submissions' },
            { status: 500 }
        );
    }
}
