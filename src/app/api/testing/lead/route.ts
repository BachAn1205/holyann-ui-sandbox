import { NextResponse } from 'next/server';
import { submitLeadForm } from '@/actions/lead';

export async function POST(request: Request) {
  // Allow in development/test/load testing modes
  if (
    process.env.NODE_ENV !== 'test' &&
    process.env.NODE_ENV !== 'development' &&
    process.env.MOCK_EXTERNAL_APIS !== 'true'
  ) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const result = await submitLeadForm(body);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Testing API lead error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
