import { prisma } from '@/lib/prisma'

export async function getRecentUsers() {
  try {
    // Tính ngày 5 ngày trước
    const fiveDaysAgo = new Date()
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5)

    const recentUsers = await prisma.users.findMany({
      where: {
        created_at: {
          gte: fiveDaysAgo,
          lte: new Date()
        }
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
        created_at: true,
        is_active: true,
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 10 // Giới hạn 10 users mới nhất
    })

    return {
      success: true,
      data: recentUsers
    }
  } catch (error) {
    console.error('Error fetching recent users:', error)
    return {
      success: false,
      error: 'Failed to fetch recent users'
    }
  }
}
