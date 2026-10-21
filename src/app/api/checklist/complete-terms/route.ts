import { NextRequest, NextResponse } from 'next/server';
import { autoCompleteChecklistTask } from '@/lib/checklist-helper';

/**
 * API Route: Complete "Terms of Service" task
 * Called when student finishes reading and agrees to terms
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { student_id } = body;

    if (!student_id) {
      return NextResponse.json(
        { success: false, error: 'Missing student_id' },
        { status: 400 }
      );
    }


    // Auto-complete the checklist task with link containing 'terms'
    const result = await autoCompleteChecklistTask(student_id, 'terms');

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Terms of service task completed successfully',
        task: result.task,
      });
    } else {
      console.warn('⚠️ [Terms] Could not find terms task in tiến đọ');
      return NextResponse.json({
        success: false,
        error: 'Task not found in tiến đọ',
      }, { status: 404 });
    }
  } catch (error) {
    console.error('❌ [Terms] Error completing terms task:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
