import { NextRequest, NextResponse } from 'next/server';
import { autoCompleteChecklistTask } from '@/lib/checklist-helper';

/**
 * API Route: Complete file upload task
 * Called when student successfully uploads a file
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { student_id, task_id, file_url } = body;

    if (!student_id || !task_id || !file_url) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: student_id, task_id, file_url' },
        { status: 400 }
      );
    }


    // For now, we'll use a generic approach to complete any file upload task
    // In the future, you might want to be more specific about which tasks can be auto-completed
    // This is a simple implementation that marks the task as completed

    // TODO: Save file URL to database (student profile or specific table for file uploads)

    // Auto-complete the task - since this is for file upload tasks, we use 'upload' as keyword
    // Make sure the task in database has 'upload' in its link_to field
    const result = await autoCompleteChecklistTask(student_id, 'upload');

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'File upload task completed successfully',
        task: result.task,
      });
    } else {
      console.warn('⚠️ [FileUpload] Could not find upload task in tiến đọ');
      return NextResponse.json({
        success: false,
        error: 'Upload task not found in tiến đọ',
      }, { status: 404 });
    }
  } catch (error) {
    console.error('❌ [FileUpload] Error completing upload task:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
