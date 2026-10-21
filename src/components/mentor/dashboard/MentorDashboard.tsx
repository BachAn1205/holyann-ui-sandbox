"use client"
import {useAuthSession} from '@/hooks/useAuthSession'
import { useEffect, useState } from 'react'
import type { AssignedStudent, MentorDashboardStats } from '@/types/mentor'
import CreateMeetingModal from '@/components/meetings/CreateMeetingModal'

export default function MentorDashboard() {
    const {user} = useAuthSession()
    const [students, setStudents] = useState<AssignedStudent[]>([])
    const [stats, setStats] = useState<MentorDashboardStats>({
        totalActiveStudents: 0,
        weeklyDeadlines: 0,
        averageRating: 5.0
    })
    const [isLoading, setIsLoading] = useState(true)
    const [meetingModalOpen, setMeetingModalOpen] = useState(false)

    // Fetch real student data and stats from API
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [studentsResponse, statsResponse] = await Promise.all([
                    fetch('/api/mentor/students'),
                    fetch('/api/mentor/dashboard/stats')
                ])

                if (!studentsResponse.ok || !statsResponse.ok) {
                    throw new Error('Failed to fetch data')
                }

                const studentsData = await studentsResponse.json()
                const statsData = await statsResponse.json()

                setStudents(studentsData)
                setStats(statsData)
            } catch (error) {
                console.error('Error fetching data:', error)
                // Fallback to empty data
                setStudents([])
                setStats({
                    totalActiveStudents: 0,
                    weeklyDeadlines: 0,
                    averageRating: 5.0
                })
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [])

    const upcomingSessions = [
        {id: 1, student: 'Nguyễn Văn A', time: '14:00 - Hôm nay', topic: 'Tư vấn hồ sơ du học'},
        {id: 2, student: 'Trần Thị B', time: '10:00 - Ngày mai', topic: 'Phỏng vấn Visa mock'},
        {id: 3, student: 'Lê Văn C', time: '15:00 - 10/12', topic: 'Review Statement of Purpose'},
    ]

    return (
        <div
            className="w-full max-w-7xl mx-auto bg-muted/50 dark:bg-card/20 shadow-2xl rounded-3xl overflow-hidden min-h-[800px] flex flex-col font-sans transition-colors duration-300 backdrop-blur-sm border border-border">

            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-heading font-bold mb-2">
                            Dashboard Mentor
                        </h1>
                        <p className="text-purple-100">
                            Chào {user?.name}! Bạn có {stats.totalActiveStudents} học viên đang theo dõi
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-2xl font-bold">
                                {isLoading ? "..." : stats.weeklyDeadlines}
                            </div>
                            <div className="text-sm text-purple-200">Deadline tuần này</div>
                        </div>
                        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                            <i className="fas fa-chalkboard-teacher text-3xl"></i>
                        </div>
                    </div>
                </div>
            </div>

            <main className="flex-1 p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Statistics Cards */}
                    <div className="card-holyann">
                        <div className="flex items-center gap-4">
                            <div
                                className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <i className="fas fa-users text-2xl text-blue-600 dark:text-blue-400"></i>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-primary">
                                    {isLoading ? "..." : stats.totalActiveStudents}
                                </div>
                                <div className="text-sm text-muted-foreground">Tổng học viên</div>
                            </div>
                        </div>
                    </div>

                    <div className="card-holyann">
                        <div className="flex items-center gap-4">
                            <div
                                className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <i className="fas fa-star text-2xl text-green-600 dark:text-green-400"></i>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                                    {isLoading ? "..." : stats.averageRating.toFixed(1)}
                                </div>
                                <div className="text-sm text-muted-foreground">Đánh giá TB</div>
                            </div>
                        </div>
                    </div>

                    <div className="card-holyann">
                        <div className="flex items-center gap-4">
                            <div
                                className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                                <i className="fas fa-clock text-2xl text-yellow-600 dark:text-yellow-400"></i>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                                    {isLoading ? "..." : stats.weeklyDeadlines}
                                </div>
                                <div className="text-sm text-muted-foreground">Deadline tuần</div>
                            </div>
                        </div>
                    </div>

                    {/* Students List */}
                    <div className="lg:col-span-2 card-holyann">
                        <h2 className="section-title text-lg !mb-6 !text-left after:!mx-0 after:!w-10">
                            HỌC VIÊN CỦA BẠN
                        </h2>

                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                            </div>
                        ) : students.length === 0 ? (
                            <div className="text-center py-8">
                                <i className="fas fa-users text-4xl text-muted-foreground mb-4"></i>
                                <p className="text-muted-foreground">Chưa có học viên nào được gán</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {students.map((student) => (
                                    <div key={student.student_id}
                                         className="flex items-center justify-between p-4 bg-muted/30 dark:bg-card/10 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div
                                                className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                                <i className="fas fa-user text-primary text-xl"></i>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                                    {student.student.full_name}
                                                </h3>
                                                <p className="text-sm text-muted-foreground">{student.student.email}</p>
                                            </div>
                                            <div className="text-right hidden md:block">
                                                <div className="text-sm font-semibold text-foreground mb-1">
                                                    Tiến độ: {student.progress}%
                                                </div>
                                                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary transition-all"
                                                        style={{width: `${student.progress}%`}}
                                                    ></div>
                                                </div>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                student.status === 'ACTIVE'
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                            }`}>
                                                {student.status === 'ACTIVE' ? 'Hoạt động' : 'Chờ xử lý'}
                                            </span>
                                        </div>
                                        <i className="fas fa-chevron-right text-muted-foreground ml-4 group-hover:text-primary transition-colors"></i>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            className="w-full mt-4 py-3 bg-primary/10 hover:bg-primary/20 text-primary font-semibold rounded-xl transition-colors">
                            Xem tất cả học viên
                        </button>
                    </div>

                    {/* Upcoming Sessions */}
                    <div className="card-holyann">
                        <h2 className="section-title text-lg !mb-6 !text-left after:!mx-0 after:!w-10">
                            LỊCH SẮP TỚI
                        </h2>

                        <div className="space-y-4">
                            {upcomingSessions.map((session) => (
                                <div key={session.id}
                                     className="p-4 bg-muted/30 dark:bg-card/10 rounded-xl border-l-4 border-purple-500">
                                    <div className="flex items-start gap-3">
                                        <i className="fas fa-calendar-alt text-purple-500 mt-1"></i>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-foreground text-sm">
                                                {session.topic}
                                            </h3>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {session.student}
                                            </p>
                                            <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold mt-2">
                                                {session.time}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => setMeetingModalOpen(true)}
                            className="w-full mt-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors shadow-md">
                            <i className="fas fa-plus mr-2"></i>
                            Thêm buổi tư vấn
                        </button>
                    </div>

                    {/* Quick Actions */}
                    <div className="lg:col-span-3 card-holyann">
                        <h2 className="section-title text-lg !mb-6 !text-left after:!mx-0 after:!w-10">
                            THAO TÁC NHANH
                        </h2>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <button
                                className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:shadow-md transition-all group">
                                <i className="fas fa-file-alt text-3xl text-blue-600 dark:text-blue-400 mb-2 group-hover:scale-110 transition-transform"></i>
                                <p className="text-sm font-semibold text-foreground">Tạo báo cáo</p>
                            </button>

                            <button
                                className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl hover:shadow-md transition-all group">
                                <i className="fas fa-comments text-3xl text-green-600 dark:text-green-400 mb-2 group-hover:scale-110 transition-transform"></i>
                                <p className="text-sm font-semibold text-foreground">Tin nhắn</p>
                            </button>

                            <button
                                className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl hover:shadow-md transition-all group">
                                <i className="fas fa-book text-3xl text-purple-600 dark:text-purple-400 mb-2 group-hover:scale-110 transition-transform"></i>
                                <p className="text-sm font-semibold text-foreground">Tài liệu</p>
                            </button>

                            <button
                                className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl hover:shadow-md transition-all group">
                                <i className="fas fa-chart-line text-3xl text-orange-600 dark:text-orange-400 mb-2 group-hover:scale-110 transition-transform"></i>
                                <p className="text-sm font-semibold text-foreground">Thống kê</p>
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            <footer
                className="py-6 text-center text-xs text-muted-foreground border-t border-border bg-background font-sans transition-colors duration-300">
                Dashboard Cố vấn © 2025 <span className="text-primary dark:text-sky-400 font-heading font-bold">HOLYANN EXPLORE</span>
            </footer>

            {/* Create Meeting Modal */}
            <CreateMeetingModal
                open={meetingModalOpen}
                onOpenChange={setMeetingModalOpen}
                mentorEmail={user?.email ?? ''}
                onMeetingCreated={() => setMeetingModalOpen(false)}
            />
        </div>
    )
}

