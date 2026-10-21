import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TestStatus } from '@prisma/client';

// POST: Start a new test
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { student_id, test_type } = body;

    // Validate input
    if (!student_id) {
        return NextResponse.json(
            { success: false, error: 'Missing required field: student_id' },
            { status: 400 }
        );
    }

    if (!test_type) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: test_type' },
        { status: 400 }
      );
    }

    // Validate test type
    const validTestTypes = ['mbti', 'grit', 'riasec'];
    if (!validTestTypes.includes(test_type.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: `Invalid test type. Must be one of: ${validTestTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Creating test for student

    // Check if student exists
    const student = await prisma.students.findUnique({
      where: { user_id: student_id },
    });

    if (!student) {
      // Optional: Auto-create student profile if missing?
      // For now, return 404 as per requirement validation.
      return NextResponse.json(
        { success: false, error: 'Student profile not found for this user' },
        { status: 404 }
      );
    }

    // Check if test already exists
    const testType = test_type.toLowerCase();
    let existingTest = null;

    if (testType === 'mbti') {
      existingTest = await prisma.mbti_tests.findUnique({
        where: { student_id },
      });
    } else if (testType === 'grit') {
      existingTest = await prisma.grit_tests.findUnique({
        where: { student_id },
      });
    } else if (testType === 'riasec') {
      existingTest = await prisma.riasec_tests.findUnique({
        where: { student_id },
      });
    }

    // If test exists and is completed, return error
    if (existingTest && existingTest.status === TestStatus.COMPLETED) {
      return NextResponse.json(
        { success: false, error: 'Test already completed. Cannot retake.' },
        { status: 400 }
      );
    }

    // If test exists but not completed, return existing test (kèm answers để làm tiếp)
    if (existingTest) {
      return NextResponse.json({
        success: true,
        test_id: existingTest.id,
        test_type: testType,
        status: existingTest.status,
        message: 'Continuing existing test',
        answers: existingTest.answers ?? {},
        current_step: existingTest.current_step ?? 0,
      });
    }

    // Create new test record
    let newTest = null;

    try {
      if (testType === 'mbti') {
        newTest = await prisma.mbti_tests.create({
          data: {
            id: randomUUID(),
            student_id,
            status: TestStatus.IN_PROGRESS,
          },
        });
      } else if (testType === 'grit') {
        newTest = await prisma.grit_tests.create({
          data: {
            id: randomUUID(),
            student_id,
            status: TestStatus.IN_PROGRESS,
          },
        });
      } else if (testType === 'riasec') {
        newTest = await prisma.riasec_tests.create({
          data: {
            id: randomUUID(),
            student_id,
            status: TestStatus.IN_PROGRESS,
          },
        });
      }
    } catch (createError: unknown) {
      // Handle unique constraint violation (P2002) - Test might have been created in parallel
      if (createError && typeof createError === 'object' && 'code' in createError && createError.code === 'P2002') {
        console.warn(`⚠️ Test creation race condition detected for ${testType.toUpperCase()} (student ID: ${student_id}). Fetching existing test.`);

        // Fetch the existing test again
        let existingTestRetry = null;
        if (testType === 'mbti') {
          existingTestRetry = await prisma.mbti_tests.findUnique({ where: { student_id } });
        } else if (testType === 'grit') {
          existingTestRetry = await prisma.grit_tests.findUnique({ where: { student_id } });
        } else if (testType === 'riasec') {
          existingTestRetry = await prisma.riasec_tests.findUnique({ where: { student_id } });
        }

        if (existingTestRetry) {
          return NextResponse.json({
            success: true,
            test_id: existingTestRetry.id,
            test_type: testType,
            status: existingTestRetry.status,
            message: 'Continuing existing test (conflict resolved)',
          });
        }
      }
      throw createError; // Re-throw other errors
    }


    return NextResponse.json({
      success: true,
      test_id: newTest?.id,
      test_type: testType,
      status: TestStatus.IN_PROGRESS,
      message: 'Test created successfully',
    });
  } catch (error) {
    console.error('❌ Error creating test:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT: Submit test results
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { test_id, student_id, test_type, answers, results } = body;

    // Validate input
    if (!test_id || !student_id || !test_type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: test_id, student_id, and test_type' },
        { status: 400 }
      );
    }

    // Submitting test results

    const testType = test_type.toLowerCase();
    const updateData: any = {
      status: TestStatus.COMPLETED,
      completed_at: new Date(),
      answers: answers || {},
    };

    // Update based on test type (field names must match Prisma schema)
    if (testType === 'mbti') {
      updateData.result_type = results?.type || null;
      updateData.score_e = results?.scores?.E ?? null;
      updateData.score_i = results?.scores?.I ?? null;
      updateData.score_s = results?.scores?.S ?? null;
      updateData.score_n = results?.scores?.N ?? null;
      updateData.score_t = results?.scores?.T ?? null;
      updateData.score_f = results?.scores?.F ?? null;
      updateData.score_j = results?.scores?.J ?? null;
      updateData.score_p = results?.scores?.P ?? null;

      await prisma.mbti_tests.update({
        where: { id: test_id },
        data: updateData,
      });
    } else if (testType === 'grit') {
      updateData.passion_score = results?.passion_score ?? null;
      updateData.perseverance_score = results?.perseverance_score ?? null;
      updateData.total_score = results?.total_score ?? results?.overall_grit_score ?? null;

      await prisma.grit_tests.update({
        where: { id: test_id },
        data: updateData,
      });
    } else if (testType === 'riasec') {
      updateData.score_realistic = results?.scores?.R ?? null;
      updateData.score_investigative = results?.scores?.I ?? null;
      updateData.score_artistic = results?.scores?.A ?? null;
      updateData.score_social = results?.scores?.S ?? null;
      updateData.score_enterprising = results?.scores?.E ?? null;
      updateData.score_conventional = results?.scores?.C ?? null;
      if (results?.result_code) updateData.result_code = results.result_code;

      await prisma.riasec_tests.update({
        where: { id: test_id },
        data: updateData,
      });
    }

    // Update student's assessments_completed flag
    await prisma.students.update({
      where: { user_id: student_id },
      data: { assessments_completed: true },
    });

    // Test submitted successfully

    return NextResponse.json({
      success: true,
      message: 'Test submitted successfully',
      test_id,
    });
  } catch (error) {
    console.error('❌ Error submitting test:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET: Get test status or results
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const student_id = searchParams.get('student_id');
    const test_type = searchParams.get('test_type');

    if (!student_id) {
        return NextResponse.json(
            { success: false, error: 'Missing required parameter: student_id' },
            { status: 400 }
        );
    }

    if (!test_type) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: test_type' },
        { status: 400 }
      );
    }

    const testType = test_type.toLowerCase();
    let test = null;

    if (testType === 'mbti') {
      test = await prisma.mbti_tests.findUnique({
        where: { student_id },
      });
    } else if (testType === 'grit') {
      test = await prisma.grit_tests.findUnique({
        where: { student_id },
      });
    } else if (testType === 'riasec') {
      test = await prisma.riasec_tests.findUnique({
        where: { student_id },
      });
    }

    if (!test) {
      return NextResponse.json({
        success: true,
        test_exists: false,
        status: TestStatus.NOT_STARTED,
      });
    }

    return NextResponse.json({
      success: true,
      test_exists: true,
      test_id: test.id,
      status: test.status,
      data: test,
    });
  } catch (error) {
    console.error('❌ Error getting test:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
