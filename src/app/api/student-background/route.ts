import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as BackgroundService from '@/lib/services/student-background.service';
import { requireStudentAuth } from '@/lib/auth-utils';

type BackgroundItemType =
  | 'academic_award'
  | 'non_academic_award'
  | 'academic_extracurricular'
  | 'non_academic_extracurricular'
  | 'work_experience'
  | 'research_experience';

async function ensureBackgroundItemOwnership(
  studentId: string,
  type: BackgroundItemType,
  itemId: string
) {
  switch (type) {
    case 'academic_award':
      return prisma.academic_awards.findFirst({ where: { id: itemId, background_id: studentId } });
    case 'non_academic_award':
      return prisma.non_academic_awards.findFirst({ where: { id: itemId, background_id: studentId } });
    case 'academic_extracurricular':
      return prisma.academic_extracurriculars.findFirst({ where: { id: itemId, background_id: studentId } });
    case 'non_academic_extracurricular':
      return prisma.non_academic_extracurriculars.findFirst({ where: { id: itemId, background_id: studentId } });
    case 'work_experience':
      return prisma.work_experiences.findFirst({ where: { id: itemId, background_id: studentId } });
    case 'research_experience':
      return prisma.research_experiences.findFirst({ where: { id: itemId, background_id: studentId } });
    default:
      return null;
  }
}

export async function GET(_request: NextRequest) {
  try {
    const user = await requireStudentAuth();

    const background = await BackgroundService.getStudentBackground(user.id);

    if (!background) {
      return NextResponse.json(
        { error: 'Student background not found' },
        { status: 404 }
      );
    }

    const statistics = await BackgroundService.getBackgroundStatistics(user.id);

    return NextResponse.json({
      background,
      statistics,
    });
  } catch (error) {
    console.error('Error fetching student background:', error);
    const status = error instanceof Error && error.message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json(
      { error: status === 401 ? 'Unauthorized' : 'Internal server error' },
      { status }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireStudentAuth();
    const body = await request.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: type, data' },
        { status: 400 }
      );
    }

    let result;

    switch (type as BackgroundItemType) {
      case 'academic_award':
        result = await BackgroundService.addAcademicAward(user.id, data);
        break;
      case 'non_academic_award':
        result = await BackgroundService.addNonAcademicAward(user.id, data);
        break;
      case 'academic_extracurricular':
        result = await BackgroundService.addAcademicExtracurricular(user.id, data);
        break;
      case 'non_academic_extracurricular':
        result = await BackgroundService.addNonAcademicExtracurricular(user.id, data);
        break;
      case 'work_experience':
        result = await BackgroundService.addWorkExperience(user.id, data);
        break;
      case 'research_experience':
        result = await BackgroundService.addResearchExperience(user.id, data);
        break;
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error adding background item:', error);
    const status = error instanceof Error && error.message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json(
      { error: status === 401 ? 'Unauthorized' : 'Internal server error' },
      { status }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireStudentAuth();
    const body = await request.json();
    const { itemId, type, data } = body;

    if (!itemId || !type || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: itemId, type, data' },
        { status: 400 }
      );
    }

    const owned = await ensureBackgroundItemOwnership(user.id, type, itemId);
    if (!owned) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let result;

    switch (type as BackgroundItemType) {
      case 'academic_award':
        result = await BackgroundService.updateAcademicAward(itemId, data);
        break;
      case 'non_academic_award':
        result = await BackgroundService.updateNonAcademicAward(itemId, data);
        break;
      case 'academic_extracurricular':
        result = await BackgroundService.updateAcademicExtracurricular(itemId, data);
        break;
      case 'non_academic_extracurricular':
        result = await BackgroundService.updateNonAcademicExtracurricular(itemId, data);
        break;
      case 'work_experience':
        result = await BackgroundService.updateWorkExperience(itemId, data);
        break;
      case 'research_experience':
        result = await BackgroundService.updateResearchExperience(itemId, data);
        break;
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating background item:', error);
    const status = error instanceof Error && error.message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json(
      { error: status === 401 ? 'Unauthorized' : 'Internal server error' },
      { status }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireStudentAuth();
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    const type = searchParams.get('type') as BackgroundItemType | null;

    if (!itemId || !type) {
      return NextResponse.json(
        { error: 'Missing required parameters: itemId, type' },
        { status: 400 }
      );
    }

    const owned = await ensureBackgroundItemOwnership(user.id, type, itemId);
    if (!owned) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    switch (type) {
      case 'academic_award':
        await BackgroundService.deleteAcademicAward(itemId);
        break;
      case 'non_academic_award':
        await BackgroundService.deleteNonAcademicAward(itemId);
        break;
      case 'academic_extracurricular':
        await BackgroundService.deleteAcademicExtracurricular(itemId);
        break;
      case 'non_academic_extracurricular':
        await BackgroundService.deleteNonAcademicExtracurricular(itemId);
        break;
      case 'work_experience':
        await BackgroundService.deleteWorkExperience(itemId);
        break;
      case 'research_experience':
        await BackgroundService.deleteResearchExperience(itemId);
        break;
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting background item:', error);
    const status = error instanceof Error && error.message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json(
      { error: status === 401 ? 'Unauthorized' : 'Internal server error' },
      { status }
    );
  }
}
