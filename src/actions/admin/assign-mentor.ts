'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

/**
 * Server Action: Admin gán Mentor cho Học viên
 *
 * Business Logic:
 * 1. Kiểm tra mentor có đúng specialization
 * 2. Tạo/Update assignment
 * 3. Tạo private chat room
 * 4. Nếu đủ 3 mentors → Tạo group chat
 *
 * @param studentId - UUID của học viên
 * @param mentorId - UUID của mentor
 * @param mentorType - Loại mentor: AS, ACS, hoặc ARD
 * @returns Promise<{success: boolean, message: string, data?: any}>
 */
export async function assignMentorToStudent(
    studentId: string,
    mentorId: string,
    mentorType: 'AS' | 'ACS' | 'ARD'
) {
    try {
        // Validate inputs
        if (!studentId || !mentorId || !mentorType) {
            return {
                success: false,
                message: 'Thiếu thông tin bắt buộc (studentId, mentorId, mentorType)'
            }
        }

        if (!['AS', 'ACS', 'ARD'].includes(mentorType)) {
            return {
                success: false,
                message: 'Loại mentor không hợp lệ. Chỉ chấp nhận: AS, ACS, ARD'
            }
        }

        // Execute trong transaction
        const result = await prisma.$transaction(async (tx) => {
            // Variables to track if we need to create welcome message
            let needsWelcomeMessage = false
            let welcomeMessageData: any = null
            // ============================================
            // BƯỚC 1: KIỂM TRA MENTOR SPECIALIZATION
            // ============================================
            const mentor = await tx.mentors.findUnique({
                where: { user_id: mentorId },
                include: {
                    users: {
                        select: {
                            id: true,
                            full_name: true,
                            email: true
                        }
                    }
                }
            })

            if (!mentor) {
                throw new Error('Mentor không tồn tại trong hệ thống')
            }

            // Kiểm tra specialization có khớp với type được gán
            if (mentor.specialization !== mentorType) {
                throw new Error(
                    `Mentor ${mentor.users.full_name} có chuyên môn ${mentor.specialization}, ` +
                    `không thể gán vào vị trí ${mentorType}`
                )
            }

            // Kiểm tra student tồn tại và phải là gói Premium
            const student = await tx.students.findUnique({
                where: { user_id: studentId },
                include: {
                    users: {
                        select: {
                            id: true,
                            full_name: true,
                            email: true,
                            subscription_plan: true
                        }
                    }
                }
            })

            if (!student) {
                throw new Error('Học viên không tồn tại trong hệ thống')
            }

            const plan = (student.users as { subscription_plan?: string | null }).subscription_plan ?? ''
            if (plan.toUpperCase() !== 'PREMIUM') {
                throw new Error('Chỉ học viên gói Premium mới được gán mentor.')
            }

            // ============================================
            // BƯỚC 2: TẠO/UPDATE ASSIGNMENT
            // ============================================

            // Kiểm tra assignment hiện tại
            const existingAssignment = await tx.mentor_assignments.findUnique({
                where: {
                    student_id_type: {
                        student_id: studentId,
                        type: mentorType
                    }
                },
                include: {
                    mentors: {
                        include: {
                            users: true
                        }
                    }
                }
            })

            let assignment
            let isUpdate = false

            if (existingAssignment) {
                // Đã gán cùng mentor và vẫn ACTIVE → báo lỗi
                if (existingAssignment.status === 'ACTIVE' && existingAssignment.mentor_id === mentorId) {
                    throw new Error(
                        `Học viên ${student.users.full_name} đã được gán ` +
                        `mentor ${mentor.users.full_name} cho vị trí ${mentorType}`
                    )
                }

                // Còn lại: đổi mentor hoặc gán lại sau khi CANCELLED → update
                assignment = await tx.mentor_assignments.update({
                    where: {
                        student_id_type: {
                            student_id: studentId,
                            type: mentorType
                        }
                    },
                    data: {
                        mentor_id: mentorId,
                        status: 'ACTIVE',
                        assigned_at: new Date()
                    }
                })
                isUpdate = true
            } else {
                // Tạo assignment mới
                assignment = await tx.mentor_assignments.create({
                    data: {
                        id: crypto.randomUUID(),
                        student_id: studentId,
                        mentor_id: mentorId,
                        type: mentorType,
                        status: 'ACTIVE'
                    }
                })
            }

            // ============================================
            // BƯỚC 3: SIDE EFFECT 1 - TẠO PRIVATE CHAT
            // ============================================

            // Kiểm tra xem đã có private chat giữa student và Cố vấn này chưa
            const existingPrivateChat = await tx.chat_rooms.findFirst({
                where: {
                    student_id: studentId,
                    type: 'PRIVATE',
                    chat_participants: {
                        some: {
                            user_id: mentorId
                        }
                    }
                }
            })

            let privateChatRoom
            if (!existingPrivateChat) {
                // Tạo private chat room mới
                const mentorTypeLabel = {
                    AS: 'Admissions Strategist',
                    ACS: 'Academic Content Specialist',
                    ARD: 'Activity & Research Development'
                }[mentorType]

                privateChatRoom = await tx.chat_rooms.create({
                    data: {
                        id: crypto.randomUUID(),
                        name: `Trao đổi riêng: ${mentor.users.full_name} - ${mentorTypeLabel}`,
                        type: 'PRIVATE',
                        status: 'ACTIVE',
                        student_id: studentId,
                        mentor_type: mentorType
                    }
                })

                // Tạo 2 participants
                await tx.chat_participants.createMany({
                    data: [
                        {
                            id: crypto.randomUUID(),
                            room_id: privateChatRoom.id,
                            user_id: studentId,
                            is_active: true
                        },
                        {
                            id: crypto.randomUUID(),
                            room_id: privateChatRoom.id,
                            user_id: mentorId,
                            is_active: true
                        }
                    ]
                })

                // Tạo tin nhắn welcome
                await tx.chat_messages.create({
                    data: {
                        id: crypto.randomUUID(),
                        room_id: privateChatRoom.id,
                        sender_id: mentorId,
                        content: `Chào ${student.users.full_name}! Tôi là ${mentor.users.full_name}, ` +
                                `mentor ${mentorTypeLabel} của bạn. Rất vui được hỗ trợ bạn trong hành trình du học!`,
                        type: 'TEXT'
                    }
                })
            }

            // ============================================
            // BƯỚC 4: SIDE EFFECT 2 - TẠO GROUP CHAT (NẾU ĐỦ 3 MENTORS)
            // ============================================

            // Lấy tất cả assignments hiện tại của student
            const allAssignments = await tx.mentor_assignments.findMany({
                where: {
                    student_id: studentId,
                    status: 'ACTIVE'
                },
                include: {
                    mentors: {
                        include: {
                            users: true
                        }
                    }
                }
            })

            // Kiểm tra có đủ 3 mentors với 3 types khác nhau
            const assignedTypes = new Set(allAssignments.map(a => a.type))
            const hasFullTeam = assignedTypes.has('AS') &&
                               assignedTypes.has('ACS') &&
                               assignedTypes.has('ARD')

            let groupChatRoom = null
            if (hasFullTeam) {
                // Kiểm tra xem đã có group chat chưa
                const existingGroupChat = await tx.chat_rooms.findFirst({
                    where: {
                        student_id: studentId,
                        type: 'GROUP',
                        name: {
                            contains: 'Nhóm hỗ trợ học tập'
                        }
                    }
                })

                if (!existingGroupChat) {
                    // Tạo group chat room
                    groupChatRoom = await tx.chat_rooms.create({
                        data: {
                            id: crypto.randomUUID(),
                            name: `Nhóm mentor - ${student.users.full_name}`,
                            type: 'GROUP',
                            status: 'ACTIVE',
                            student_id: studentId
                        }
                    })

                    // Lấy mentor IDs
                    const asMentor = allAssignments.find(a => a.type === 'AS')
                    const acsMentor = allAssignments.find(a => a.type === 'ACS')
                    const ardMentor = allAssignments.find(a => a.type === 'ARD')

                    // Tạo 4 participants (student + 3 mentors)
                    await tx.chat_participants.createMany({
                        data: [
                            {
                                id: crypto.randomUUID(),
                                room_id: groupChatRoom.id,
                                user_id: studentId,
                                is_active: true
                            },
                            {
                                id: crypto.randomUUID(),
                                room_id: groupChatRoom.id,
                                user_id: asMentor!.mentor_id,
                                is_active: true
                            },
                            {
                                id: crypto.randomUUID(),
                                room_id: groupChatRoom.id,
                                user_id: acsMentor!.mentor_id,
                                is_active: true
                            },
                            {
                                id: crypto.randomUUID(),
                                room_id: groupChatRoom.id,
                                user_id: ardMentor!.mentor_id,
                                is_active: true
                            }
                        ]
                    })

                    // Mark that we need to create welcome message after transaction
                    needsWelcomeMessage = true
                    welcomeMessageData = {
                        roomId: groupChatRoom.id,
                        studentName: student.users.full_name,
                        senderId: asMentor!.mentor_id,
                        asName: asMentor!.mentors.users.full_name,
                        acsName: acsMentor!.mentors.users.full_name,
                        ardName: ardMentor!.mentors.users.full_name
                    }
                }
            }

            return {
                assignment,
                privateChatRoom,
                groupChatRoom,
                hasFullTeam,
                isUpdate,
                mentor,
                student,
                needsWelcomeMessage,
                welcomeMessageData
            }
        }, {
            maxWait: 10000, // 10 seconds
            timeout: 20000, // 20 seconds
        })

        // Tạo welcome message NGOÀI transaction (không cần atomic)
        if (result.needsWelcomeMessage && result.welcomeMessageData) {
            try {
                const data = result.welcomeMessageData
                await prisma.chat_messages.create({
                    data: {
                        id: crypto.randomUUID(),
                        room_id: data.roomId,
                        sender_id: data.senderId,
                        content: `🎉 Chào mừng ${data.studentName} đến với nhóm hỗ trợ đầy đủ!\n\n` +
                                `Đội ngũ mentors của bạn:\n` +
                                `🔵 AS: ${data.asName}\n` +
                                `🟢 ACS: ${data.acsName}\n` +
                                `🟣 ARD: ${data.ardName}\n\n` +
                                `Chúng tôi sẽ đồng hành cùng bạn trong suốt hành trình du học!`,
                        type: 'TEXT'
                    }
                })
            } catch (error) {
                console.error('Error creating welcome message:', error)
                // Don't fail the whole operation if welcome message fails
            }
        }

        // Revalidate các paths liên quan (safe for non-Next.js context)
        try {
            revalidatePath('/dashboard/admin')
            revalidatePath('/dashboard/student')
            revalidatePath(`/dashboard/student/${studentId}`)
            revalidatePath('/dashboard/chat')
        } catch (error) {
            // Ignore revalidation errors in non-Next.js context (e.g., tests)
        }

        // Return success response
        return {
            success: true,
            message: result.isUpdate
                ? `Đã cập nhật mentor ${result.mentor.users.full_name} (${mentorType}) cho học viên ${result.student.users.full_name}`
                : `Đã gán mentor ${result.mentor.users.full_name} (${mentorType}) cho học viên ${result.student.users.full_name}`,
            data: {
                assignmentId: result.assignment.id,
                privateChatCreated: !!result.privateChatRoom,
                groupChatCreated: !!result.groupChatRoom,
                hasFullTeam: result.hasFullTeam,
                mentorType: mentorType,
                mentorName: result.mentor.users.full_name,
                studentName: result.student.users.full_name
            }
        }

    } catch (error: unknown) {
        console.error('Error in assignMentorToStudent:', error)

        return {
            success: false,
            message: error instanceof Error ? error.message : 'Có lỗi xảy ra khi gán mentor',
            error: error instanceof Error && process.env.NODE_ENV === 'development' ? error.stack : undefined
        }
    }
}

/**
 * Server Action: Lấy danh sách assignments của student
 */
export async function getStudentAssignments(studentId: string) {
    try {
        const assignments = await prisma.mentor_assignments.findMany({
            where: {
                student_id: studentId,
                status: 'ACTIVE'
            },
            include: {
                mentors: {
                    include: {
                        users: {
                            select: {
                                id: true,
                                full_name: true,
                                email: true,
                                avatar_url: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                assigned_at: 'desc'
            }
        })

        return {
            success: true,
            data: assignments
        }
    } catch (error: unknown) {
        return {
            success: false,
            message: 'Có lỗi khi lấy danh sách assignments',
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

/**
 * Server Action: Hủy assignment
 */
export async function unassignMentor(
    studentId: string,
    mentorType: 'AS' | 'ACS' | 'ARD'
) {
    try {
        const user = await prisma.users.findUnique({
            where: { id: studentId },
            select: { subscription_plan: true, full_name: true }
        })
        if (!user) {
            return { success: false, message: 'Học viên không tồn tại.' }
        }
        const plan = (user.subscription_plan ?? '').toUpperCase()
        if (plan !== 'PREMIUM') {
            return {
                success: false,
                message: 'Chỉ được hủy gán mentor cho học viên gói Premium.'
            }
        }

        await prisma.$transaction(async (tx) => {
            // Update status thành CANCELLED
            await tx.mentor_assignments.updateMany({
                where: {
                    student_id: studentId,
                    type: mentorType,
                    status: 'ACTIVE'
                },
                data: {
                    status: 'CANCELLED'
                }
            })

            // Đóng private chat room nếu có
            const assignment = await tx.mentor_assignments.findFirst({
                where: {
                    student_id: studentId,
                    type: mentorType
                }
            })

            if (assignment) {
                await tx.chat_rooms.updateMany({
                    where: {
                        student_id: studentId,
                        type: 'PRIVATE',
                        chat_participants: {
                            some: {
                                user_id: assignment.mentor_id
                            }
                        }
                    },
                    data: {
                        status: 'CLOSED'
                    }
                })
            }
        })

        try {
            revalidatePath('/dashboard/admin')
            revalidatePath('/dashboard/student')
        } catch (error) {
            // Ignore revalidation errors
        }

        return {
            success: true,
            message: 'Đã hủy gán mentor thành công'
        }
    } catch (error: unknown) {
        return {
            success: false,
            message: 'Có lỗi khi hủy gán mentor',
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}
