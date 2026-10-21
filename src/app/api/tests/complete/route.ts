import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { student_id } = body;

    // Marking all tests as completed for user

    if (!student_id) {
        return NextResponse.json(
            { success: false, error: 'Missing required field: student_id' },
            { status: 400 }
        );
    }

    // Update student's assessments_completed flag
    await prisma.students.update({
      where: { user_id: student_id },
      data: {
        assessments_completed: true,
        updated_at: new Date(),
      },
    });

    // All tests marked as completed

    return NextResponse.json({
      success: true,
      message: 'All tests completed successfully',
    });
  } catch (error) {
    console.error('❌ Error marking tests complete:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
