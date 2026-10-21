import {DatabaseService} from './database.service'
import {JWTService} from './jwt.service'
import {RegisterData, LoginData, AuthResponse, AuthProvider} from '@/lib/types/auth.types'
import { sendEmail } from '@/lib/email/sendEmail'
import { WelcomeEmail } from '@/emails/WelcomeEmail'
import React from 'react'

export class AuthService {
    /**
     * Đăng ký user mới
     */
    static async register(data: RegisterData): Promise<AuthResponse> {
        try {
            // Kiểm tra email đã tồn tại
            const existingUser = await DatabaseService.findUserByEmail(data.email)
            if (existingUser) {
                return {
                    success: false,
                    message: 'Email đã được sử dụng'
                }
            }

            // Tạo user mới (sẽ tự động tạo student record nếu role = STUDENT)
            const user = await DatabaseService.createUser(data)
            if (!user) {
                return {
                    success: false,
                    message: 'Không thể tạo tài khoản'
                }
            }

            // Gửi email chào mừng
            try {
                await sendEmail({
                    to: user.email,
                    subject: 'Chào mừng bạn đến với Holyann Explore',
                    react: React.createElement(WelcomeEmail, {
                        studentName: user.full_name || undefined,
                        loginEmail: user.email || undefined
                    })
                })
                console.log(`[Welcome Email] Sent to ${user.email}`)
            } catch (emailError) {
                console.error('❌ Failed to send welcome email:', emailError)
            }

            // Fetch student data nếu user là STUDENT
            let studentData = null;
            if (user.role === 'STUDENT') {
                // Wait a bit for student creation to complete
                await new Promise(resolve => setTimeout(resolve, 500));
                studentData = await DatabaseService.findStudentByUserId(user.id);
            }

            // Tạo JWT token
            const token = JWTService.generateToken({
                userId: user.id,
                email: user.email,
                role: user.role
            })

            return {
                success: true,
                message: 'Đăng ký thành công',
                user: {
                    id: user.id,
                    email: user.email,
                    full_name: user.full_name,
                    role: user.role,
                    avatar_url: user.avatar_url
                },
                student: studentData ? {
                    user_id: studentData.user_id,
                    current_school: studentData.current_school,
                    current_grade: studentData.current_grade,
                    date_of_birth: studentData.date_of_birth,
                    current_address: studentData.current_address
                } : undefined,
                token
            }
        } catch (error: any) {
            console.error('Error in register:', error)
            return {
                success: false,
                message: error?.message || 'Đã xảy ra lỗi khi đăng ký'
            }
        }
    }

    /**
     * Đăng nhập
     */
    static async login(data: LoginData): Promise<AuthResponse> {
        try {
            // Tìm user
            const user = await DatabaseService.findUserByEmail(data.email)
            if (!user) {
                return {
                    success: false,
                    message: 'Email hoặc mật khẩu không đúng'
                }
            }

            // Kiểm tra auth provider
            if (user.auth_provider !== 'LOCAL') {
                return {
                    success: false,
                    message: `Tài khoản này đã đăng ký bằng ${user.auth_provider}. Vui lòng sử dụng phương thức đó để đăng nhập.`
                }
            }

            // Xác thực password
            if (!user.password_hash) {
                return {
                    success: false,
                    message: 'Tài khoản không hợp lệ'
                }
            }

            const isValidPassword = await DatabaseService.verifyPassword(
                data.password,
                user.password_hash
            )

            if (!isValidPassword) {
                return {
                    success: false,
                    message: 'Email hoặc mật khẩu không đúng'
                }
            }

            // Fetch student data nếu user là STUDENT
            let studentData = null;
            if (user.role === 'STUDENT') {
                studentData = await DatabaseService.findStudentByUserId(user.id);
            }

            // Tạo JWT token
            const token = JWTService.generateToken({
                userId: user.id,
                email: user.email,
                role: user.role
            })

            return {
                success: true,
                message: 'Đăng nhập thành công',
                user: {
                    id: user.id,
                    email: user.email,
                    full_name: user.full_name,
                    role: user.role,
                    avatar_url: user.avatar_url
                },
                student: studentData ? {
                    user_id: studentData.user_id,
                    current_school: studentData.current_school,
                    current_grade: studentData.current_grade,
                    date_of_birth: studentData.date_of_birth,
                    current_address: studentData.current_address
                } : undefined,
                token
            }
        } catch (error) {
            console.error('Error in login:', error)
            return {
                success: false,
                message: 'Đã xảy ra lỗi khi đăng nhập'
            }
        }
    }

    /**
     * Đăng nhập/Đăng ký bằng OAuth
     */
    static async oauthLogin(
        email: string,
        full_name: string,
        provider: AuthProvider,
        providerId: string,
        avatarUrl?: string
    ): Promise<AuthResponse> {
        try {
            // Kiểm tra user đã tồn tại
            let user = await DatabaseService.findUserByEmail(email)

            // Nếu chưa tồn tại, tạo mới
            if (!user) {
                user = await DatabaseService.createOAuthUser(
                    email,
                    full_name,
                    provider,
                    providerId,
                    avatarUrl
                )

                if (!user) {
                    console.error('❌ [AuthService] Failed to create OAuth user');
                    return {
                        success: false,
                        message: 'Không thể tạo tài khoản'
                    }
                }

                // Gửi email chào mừng cho user mới
                try {
                    await sendEmail({
                        to: user.email,
                        subject: 'Chào mừng bạn đến với Holyann Explore',
                        react: React.createElement(WelcomeEmail, {
                            studentName: user.full_name || undefined,
                            loginEmail: user.email || undefined
                        })
                    })
                    console.log(`[Welcome Email] Sent to ${user.email}`)
                } catch (emailError) {
                    console.error('❌ Failed to send welcome email:', emailError)
                }
            } else {
                // User đã tồn tại: cho phép đăng nhập bất kể provider
                // (hỗ trợ link account: user đã đăng ký LOCAL vẫn login được bằng Google)
                console.log(`ℹ️ [AuthService] Existing user login via ${provider}, auth_provider in DB: ${user.auth_provider}`);
            }

            // Tạo JWT token
            const token = JWTService.generateToken({
                userId: user.id,
                email: user.email,
                role: user.role
            })

            // Fetch student data nếu user là STUDENT
            let studentData = null;
            if (user.role === 'STUDENT') {
                // Đợi student profile tạo xong (trường hợp user mới)
                await new Promise(resolve => setTimeout(resolve, 500));
                studentData = await DatabaseService.findStudentByUserId(user.id);

                // Nếu user đã tồn tại nhưng chưa có student record → tạo mới
                if (!studentData) {
                    console.log('⚠️ [AuthService] Student profile missing for existing user, creating...');
                    await DatabaseService.createStudentProfileForUser(user.id);
                    await new Promise(resolve => setTimeout(resolve, 500));
                    studentData = await DatabaseService.findStudentByUserId(user.id);
                }
            }

            return {
                success: true,
                message: 'Đăng nhập thành công',
                user: {
                    id: user.id,
                    email: user.email,
                    full_name: user.full_name,
                    role: user.role,
                    avatar_url: user.avatar_url
                },
                student: studentData ? {
                    user_id: studentData.user_id,
                    current_school: studentData.current_school,
                    current_grade: studentData.current_grade,
                    date_of_birth: studentData.date_of_birth,
                    current_address: studentData.current_address
                } : undefined,
                token
            }
        } catch (error) {
            console.error('❌ [AuthService] Exception in oauthLogin:', error)
            return {
                success: false,
                message: 'Đã xảy ra lỗi khi đăng nhập'
            }
        }
    }

    /**
     * Xác thực token và lấy thông tin user
     */
    static async verifyToken(token: string): Promise<AuthResponse> {
        try {
            const payload = JWTService.verifyToken(token)
            if (!payload) {
                return {
                    success: false,
                    message: 'Token không hợp lệ'
                }
            }

            const user = await DatabaseService.findUserById(payload.userId)
            if (!user) {
                return {
                    success: false,
                    message: 'Người dùng không tồn tại'
                }
            }

            return {
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    full_name: user.full_name,
                    role: user.role,
                    avatar_url: user.avatar_url
                },
                token
            }
        } catch (error) {
            console.error('Error in verifyToken:', error)
            return {
                success: false,
                message: 'Đã xảy ra lỗi khi xác thực'
            }
        }
    }
}
