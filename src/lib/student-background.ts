import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { uuidSchema } from '@/lib/utils/validation';

export class InvalidStudentIdError extends Error {
    constructor() {
        super('Student ID must be a valid UUID format');
    }
}

export class StudentUserNotFoundError extends Error {
    constructor() {
        super('Student user does not exist in the database');
    }
}

export function validateAndParseStudentId(studentId: string): string {
    const parsed = uuidSchema.safeParse(studentId);
    if (!parsed.success) {
        throw new InvalidStudentIdError();
    }
    return parsed.data;
}

export async function ensureStudentAndBackground(studentId: string): Promise<void> {
    validateAndParseStudentId(studentId);

    const user = await prisma.users.findUnique({
        where: { id: studentId },
        select: { id: true },
    });

    if (!user) {
        throw new StudentUserNotFoundError();
    }

    await prisma.$transaction(
        async (tx) => {
            await tx.students.upsert({
                where: { user_id: studentId },
                create: { user_id: studentId },
                update: {},
            });
            await tx.student_backgrounds.upsert({
                where: { student_id: studentId },
                update: {},
                create: { student_id: studentId },
            });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
}

export function toStudentContextErrorResponse(error: unknown): NextResponse | null {
    if (error instanceof InvalidStudentIdError) {
        return NextResponse.json(
            { error: 'student_id không hợp lệ (phải là UUID)' },
            { status: 400 }
        );
    }
    if (error instanceof StudentUserNotFoundError) {
        return NextResponse.json(
            { error: 'Không tìm thấy người dùng học sinh' },
            { status: 404 }
        );
    }
    return null;
}
