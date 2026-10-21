/**
 * GET /api/student/improve/cv-text
 * Lấy nội dung text từ CV đã tải (đọc file, gửi sang server-ai extract). Chỉ hỗ trợ PDF.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import path from 'path';
import { existsSync, readFileSync } from 'fs';

export async function GET() {
  const session = await getServerSession(authOptions);
  const studentId = session?.user?.id;
  if (!studentId || session?.user?.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const base = path.join(process.cwd(), 'public', 'uploads', 'cvs');
  if (!existsSync(base)) {
    return NextResponse.json({ text: '' });
  }
  const fs = await import('fs');
  const files = fs.readdirSync(base).filter((f: string) => f.startsWith(`cv_${studentId}_`));
  if (files.length === 0) {
    return NextResponse.json({ text: '' });
  }
  files.sort((a: string, b: string) => {
    const statA = fs.statSync(path.join(base, a));
    const statB = fs.statSync(path.join(base, b));
    return statB.mtime.getTime() - statA.mtime.getTime();
  });
  const firstFile = files[0];
  if (!firstFile.toLowerCase().endsWith('.pdf')) {
    return NextResponse.json({ text: '', error: 'Chỉ hỗ trợ trích xuất từ file PDF' });
  }
  const filePath = path.join(base, firstFile);
  const buffer = readFileSync(filePath);
  const AI_BASE = (process.env.AI_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');
  const formData = new FormData();
  formData.append('file', new Blob([buffer], { type: 'application/pdf' }), firstFile);
  try {
    const res = await fetch(`${AI_BASE}/hoexapp/api/cv-improver/extract/`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({ text: '', error: (err as { error?: string }).error || 'Không trích xuất được' });
    }
    const data = (await res.json()) as { text?: string };
    return NextResponse.json({ text: data.text || '' });
  } catch (e) {
    console.error('[cv-text] extract error:', e);
    return NextResponse.json({ text: '', error: e instanceof Error ? e.message : 'Lỗi trích xuất' });
  }
}
