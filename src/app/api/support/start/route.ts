import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth/get-user'

async function sendEmailToAdmin(payload: {
    roomId: string
    studentId: string
    studentName: string | null
    studentEmail: string | null
}) {
    // TODO: Wire this to the production email provider.
    console.info('[support/start] mock admin email notification', payload)
}

function canStartSupportChat(role: string | null | undefined) {
    const r = role?.toUpperCase();
    return r === 'STUDENT' || r === 'MENTOR' || r === 'MARKETING';
}

export async function POST(request: NextRequest) {
    try {
        const authUser = await getAuthenticatedUser(request)

        if (!authUser?.id) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const student = await prisma.users.findUnique({
            where: { id: authUser.id },
            select: {
                id: true,
                full_name: true,
                email: true,
                role: true,
                is_active: true
            }
        })

        if (!student || !student.is_active || !canStartSupportChat(student.role)) {
            return NextResponse.json(
                { success: false, error: 'Tài khoản của bạn không được phép mở chat hỗ trợ' },
                { status: 403 }
            )
        }

        let room = await prisma.chat_rooms.findFirst({
            where: {
                student_id: student.id,
                type: 'SUPPORT',
                deleted_at: null,
                status: 'ACTIVE'
            },
            select: {
                id: true,
                name: true,
                type: true,
                status: true,
                support_email_sent: true,
                created_at: true,
                updated_at: true
            }
        })

        if (!room) {
            room = await prisma.$transaction(async (tx) => {
                const createdRoom = await tx.chat_rooms.create({
                    data: {
                        id: crypto.randomUUID(),
                        name: `Support - ${student.full_name || student.email || student.id}`,
                        type: 'SUPPORT',
                        student_id: student.id,
                        status: 'ACTIVE'
                    },
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        status: true,
                        support_email_sent: true,
                        created_at: true,
                        updated_at: true
                    }
                })

                await tx.chat_participants.create({
                    data: {
                        id: crypto.randomUUID(),
                        room_id: createdRoom.id,
                        user_id: student.id,
                        is_active: true
                    }
                })

                return createdRoom
            })
        }

        let emailNotificationSent = false
        if (!room.support_email_sent) {
            await sendEmailToAdmin({
                roomId: room.id,
                studentId: student.id,
                studentName: student.full_name,
                studentEmail: student.email
            })

            room = await prisma.chat_rooms.update({
                where: { id: room.id },
                data: { support_email_sent: true },
                select: {
                    id: true,
                    name: true,
                    type: true,
                    status: true,
                    support_email_sent: true,
                    created_at: true,
                    updated_at: true
                }
            })
            emailNotificationSent = true
        }

        return NextResponse.json({
            success: true,
            roomId: room.id,
            room,
            emailNotificationSent
        })
    } catch (error) {
        console.error('Error starting support chat:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to start support chat',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
