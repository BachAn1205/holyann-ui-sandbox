import {supabase, supabaseAdmin} from '@/lib/supabase'
import {prisma} from '@/lib/prisma'
import {User, RegisterData, UserRole, AuthProvider} from '@/lib/types/auth.types'
import bcrypt from 'bcryptjs'
import {randomUUID} from 'crypto'

export class DatabaseService {
    /**
     * Đồng bộ dữ liệu vào Local Database với cơ chế retry
     */
    private static async syncToLocalDB(data: any, retries = 2): Promise<void> {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                await prisma.users.create({
                    data
                });
                // Successfully synced to Local DB
                return;
            } catch (error: any) {
                const errorMsg = error.message || '';
                // Nếu là circuit breaker, skip sau 1 attempt
                if (errorMsg.includes('Circuit breaker open') && attempt === 1) {
                    console.warn('⚠️ [DatabaseService] Local DB circuit breaker is open, skipping sync');
                    return;
                }
                console.error(`⚠️ [DatabaseService] Sync attempt ${attempt} failed:`, errorMsg);
                if (attempt === retries) {
                    console.error('❌ [DatabaseService] Failed to sync to Local DB after retries:', data.id);
                } else if (!errorMsg.includes('Circuit breaker open')) {
                    // Retrying sync to Local DB
                }
            }
        }
    }

    /**
     * Tạo hồ sơ student mặc định với retry mechanism
     */
    private static async createStudentProfile(userId: string, retries = 2): Promise<void> {
        const studentData = {user_id: userId};
        // Creating student profile

        // 1. Supabase
        try {
            const {data: existingStudent} = await supabaseAdmin
                .from('students')
                .select('user_id')
                .eq('user_id', userId)
                .single();

            if (!existingStudent) {
                const {error: supabaseError} = await supabaseAdmin
                    .from('students')
                    .insert(studentData);

                if (supabaseError) {
                    console.error('❌ [DatabaseService] Failed to create student profile in Supabase:', supabaseError);
                } else {
                    // Student profile created in Supabase
                }
            } else {
                // Student profile already exists in Supabase
            }
        } catch (error) {
            console.error('⚠️ [DatabaseService] Error checking/creating student in Supabase:', error);
        }

        // 2. Local DB (Prisma) với retry
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                // Check if student already exists
                const existingStudent = await prisma.students.findUnique({
                    where: {user_id: userId}
                });

                if (!existingStudent) {
                    await prisma.students.create({
                        data: studentData
                    });
                    // Student profile created in Local DB
                } else {
                    // Student profile already exists in Local DB
                }
                return; // Success, exit retry loop
            } catch (error: any) {
                const errorMsg = error.message || '';

                // Skip retry for certain errors
                if (errorMsg.includes('Circuit breaker open') && attempt === 1) {
                    console.warn('⚠️ [DatabaseService] Local DB circuit breaker is open, skipping student profile creation');
                    return;
                }

                if (errorMsg.includes('Unique constraint failed')) {
                    // Student profile already exists in Local DB
                    return;
                }

                console.error(`⚠️ [DatabaseService] Student profile creation attempt ${attempt} failed:`, errorMsg);

                if (attempt === retries) {
                    console.error('❌ [DatabaseService] Failed to create student profile in Local DB after retries');
                } else {
                    // Retrying student profile creation
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
                }
            }
        }
    }

    /**
     * Public wrapper: Tạo hồ sơ student cho user đã tồn tại nhưng chưa có student record
     */
    static async createStudentProfileForUser(userId: string): Promise<void> {
        return this.createStudentProfile(userId);
    }

    /**
     * Tạo user mới trong database (đồng bộ cả Supabase và Local DB)
     */
    static async createUser(data: RegisterData): Promise<User | null> {
        try {
            // Creating user

            // Hash password
            const hashedPassword = await bcrypt.hash(data.password, 10);
            // Password hashed successfully

            const userId = randomUUID();
            const insertData = {
                id: userId,
                full_name: data.full_name,
                email: data.email,
                password_hash: hashedPassword,
                role: data.role || 'STUDENT',
                auth_provider: 'LOCAL',
                is_active: true
            };
            // Preparing to insert user data

            let createdUser: User | null = null;

            // 1. Thử ghi vào Supabase trước
            try {
                const {data: supabaseUser, error: supabaseError} = await supabaseAdmin
                    .from('users')
                    .insert(insertData)
                    .select()
                    .single();

                if (supabaseError) {
                    // Nếu lỗi permission (code 42501), fallback sang Prisma
                    if (supabaseError.code === '42501' || supabaseError.message.includes('permission denied')) {
                        console.warn('⚠️ [DatabaseService] Supabase permission denied, falling back to Prisma...');
                        throw new Error('FALLBACK_TO_PRISMA');
                    }
                    throw new Error(`Supabase insert failed: ${supabaseError.message}${supabaseError.code ? ` (code: ${supabaseError.code})` : ''}`);
                }

                createdUser = supabaseUser as User;

                // 2. Đồng bộ vào Local Database (Prisma) với retry
                await this.syncToLocalDB(insertData);

            } catch (supabaseError: any) {
                // Fallback: Tạo user bằng Prisma nếu Supabase fail
                if (supabaseError.message === 'FALLBACK_TO_PRISMA' ||
                    supabaseError.message.includes('permission denied')) {

                    // Using Prisma as primary database

                    try {
                        const prismaUser = await prisma.users.create({
                            data: insertData
                        });

                        createdUser = prismaUser as User;

                        // Thử sync ngược lên Supabase (best effort)
                        try {
                            await supabase.from('users').insert(insertData);
                            // Synced to Supabase (best effort)
                        } catch (syncError) {
                            console.warn('⚠️ [DatabaseService] Could not sync to Supabase, continuing with Prisma only');
                        }
                    } catch (prismaError: any) {
                        console.error('❌ [DatabaseService] Prisma insert also failed:', prismaError.message);
                        throw new Error('Không thể tạo tài khoản. Vui lòng kiểm tra kết nối database.');
                    }
                } else {
                    throw supabaseError;
                }
            }

            // 3. Nếu là STUDENT, tạo hồ sơ student
            if (insertData.role === 'STUDENT' && createdUser) {
                await this.createStudentProfile(userId);
            }

            return createdUser;
        } catch (error: any) {
            console.error('❌ [DatabaseService] Exception in createUser:', {
                message: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Tạo user từ OAuth provider (Google, Facebook) - đồng bộ cả 2 DB
     */
    static async createOAuthUser(
        email: string,
        full_name: string,
        provider: AuthProvider,
        providerId: string,
        avatarUrl?: string
    ): Promise<User | null> {
        try {
            const userId = randomUUID();
            const userData = {
                id: userId,
                full_name,
                email,
                role: 'STUDENT' as UserRole,
                auth_provider: provider,
                auth_provider_id: providerId,
                avatar_url: avatarUrl,
                is_active: true
            };

            let createdUser: User | null = null;

            // 1. Thử ghi vào Supabase
            try {
                const {data: supabaseUser, error: supabaseError} = await supabaseAdmin
                    .from('users')
                    .insert(userData)
                    .select()
                    .single();

                if (supabaseError) {
                    // Duplicate key hoặc lỗi khác → fallback Prisma
                    console.warn('⚠️ [DatabaseService] Supabase OAuth insert failed:', supabaseError.message);
                    throw new Error('FALLBACK_TO_PRISMA');
                }

                createdUser = supabaseUser as User;

                // 2. Đồng bộ vào Local Database (Prisma) với retry
                await this.syncToLocalDB(userData);
            } catch (supabaseError: any) {
                // Fallback: Tạo user bằng Prisma
                console.log('ℹ️ [DatabaseService] Falling back to Prisma for OAuth user creation');
                try {
                    const prismaUser = await prisma.users.create({
                        data: userData
                    });
                    createdUser = prismaUser as User;
                } catch (prismaError: any) {
                    // Nếu Prisma cũng duplicate → user đã tồn tại, thử tìm lại
                    if (prismaError.message?.includes('Unique constraint')) {
                        console.log('ℹ️ [DatabaseService] User already exists in Prisma, finding...');
                        const existingUser = await prisma.users.findFirst({
                            where: { email, is_active: true }
                        });
                        if (existingUser) {
                            createdUser = existingUser as User;
                        }
                    } else {
                        console.error('❌ [DatabaseService] Prisma OAuth insert failed:', prismaError.message);
                    }
                }
            }

            // 3. Tạo hồ sơ student (OAuth user mặc định là STUDENT)
            if (createdUser) {
                await this.createStudentProfile(createdUser.id);
            }

            return createdUser;
        } catch (error: any) {
            console.error('❌ [DatabaseService] Exception in createOAuthUser:', {
                message: error.message,
                stack: error.stack
            });
            return null;
        }
    }

    /**
     * Tìm user theo email (ưu tiên Local DB, fallback Supabase)
     */
    static async findUserByEmail(email: string): Promise<User | null> {
        try {
            // 1. Thử tìm trong Local DB trước
            try {
                const localUser = await prisma.users.findFirst({
                    where: {
                        email: email,
                        is_active: true
                    }
                })

                if (localUser) {
                    // Found user in Local DB
                    return localUser as User
                }
            } catch (prismaError: any) {
                console.warn('⚠️ [DatabaseService] Local DB query failed, trying Supabase:', prismaError.message)
            }

            // 2. Fallback về Supabase
            const {data: user, error} = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .eq('is_active', true)
                .single()

            if (error) {
                return null
            }

            // Đồng bộ user từ Supabase vào Local DB nếu tìm thấy
            if (user) {
                try {
                    await prisma.users.upsert({
                        where: {email: user.email},
                        update: {
                            full_name: user.full_name,
                            role: user.role,
                            avatar_url: user.avatar_url,
                            auth_provider: user.auth_provider,
                            is_active: user.is_active
                        },
                        create: {
                            id: user.id,
                            full_name: user.full_name,
                            email: user.email,
                            password_hash: user.password_hash,
                            role: user.role,
                            auth_provider: user.auth_provider || 'LOCAL',
                            auth_provider_id: user.auth_provider_id,
                            avatar_url: user.avatar_url,
                            is_active: user.is_active
                        }
                    })
                } catch (syncError: any) {
                    console.warn('⚠️ [DatabaseService] Failed to sync user to Local DB:', syncError.message)
                }
            }

            return user as User
        } catch (error) {
            console.error('Error in findUserByEmail:', error)
            return null
        }
    }

    /**
     * Tìm user theo ID (ưu tiên Local DB, fallback Supabase)
     */
    static async findUserById(id: string): Promise<User | null> {
        try {
            // Finding user by ID

            // 1. Thử tìm trong Local DB trước
            try {
                const localUser = await prisma.users.findFirst({
                    where: {
                        id: id,
                        is_active: true
                    }
                })

                if (localUser) {
                    // Found user by ID in Local DB
                    return localUser as User
                }
                // User not found in Local DB by ID
            } catch (prismaError: any) {
                console.warn('⚠️ [DatabaseService] Local DB query failed, trying Supabase:', prismaError.message)
            }

            // 2. Fallback về Supabase
            // Trying Supabase for user ID
            const {data: user, error} = await supabase
                .from('users')
                .select('*')
                .eq('id', id)
                .eq('is_active', true)
                .single()

            if (error) {
                console.error('❌ [DatabaseService] Supabase error:', error.message);
                // User not found in either database
                return null
            }

            // Đồng bộ user từ Supabase vào Local DB nếu tìm thấy
            if (user) {
                // Found user in Supabase
                try {
                    await prisma.users.upsert({
                        where: {id: user.id},
                        update: {
                            full_name: user.full_name,
                            email: user.email,
                            role: user.role,
                            avatar_url: user.avatar_url,
                            auth_provider: user.auth_provider,
                            is_active: user.is_active
                        },
                        create: {
                            id: user.id,
                            full_name: user.full_name,
                            email: user.email,
                            password_hash: user.password_hash,
                            role: user.role,
                            auth_provider: user.auth_provider || 'LOCAL',
                            auth_provider_id: user.auth_provider_id,
                            avatar_url: user.avatar_url,
                            is_active: user.is_active
                        }
                    })
                } catch (syncError: any) {
                    const errorMsg = syncError.message || '';
                    if (errorMsg.includes('Circuit breaker open')) {
                        console.warn('⚠️ [DatabaseService] Local DB circuit breaker open, using Supabase only');
                    } else {
                        console.warn('⚠️ [DatabaseService] Failed to sync user to Local DB:', errorMsg)
                    }
                }
            }

            return user as User
        } catch (error) {
            console.error('❌ [DatabaseService] Exception in findUserById:', error)
            return null
        }
    }

    /**
     * Xác thực password
     */
    static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
        try {
            return await bcrypt.compare(plainPassword, hashedPassword)
        } catch (error) {
            console.error('Error verifying password:', error)
            return false
        }
    }

    /**
     * Tìm student theo user_id
     */
    static async findStudentByUserId(userId: string): Promise<any | null> {
        try {
            // Finding student for user_id

            // Try Local DB first
            try {
                const localStudent = await prisma.students.findUnique({
                    where: { user_id: userId }
                });

                if (localStudent) {
                    // Found student in Local DB
                    return localStudent;
                }
            } catch (prismaError: any) {
                console.warn('⚠️ [DatabaseService] Local DB query failed, trying Supabase:', prismaError.message);
            }

            // Fallback to Supabase
            const { data: student, error } = await supabase
                .from('students')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error) {
                // No student record found for user
                return null;
            }

            // Sync to Local DB if found
            if (student) {
                // Found student in Supabase
                try {
                    await prisma.students.upsert({
                        where: { user_id: student.user_id },
                        update: {
                            current_school: student.current_school,
                            current_grade: student.current_grade,
                            date_of_birth: student.date_of_birth,
                            current_address: student.current_address
                        },
                        create: {
                            user_id: student.user_id,
                            current_school: student.current_school,
                            current_grade: student.current_grade,
                            date_of_birth: student.date_of_birth,
                            current_address: student.current_address
                        }
                    });
                    // Synced student from Supabase to Local DB
                } catch (syncError) {
                    console.warn('⚠️ [DatabaseService] Could not sync student to Local DB');
                }
            }

            return student;
        } catch (error) {
            console.error('❌ [DatabaseService] Exception in findStudentByUserId:', error);
            return null;
        }
    }

    /**
     * Cập nhật thông tin user
     */
    static async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
        try {
            const {data: user, error} = await supabase
                .from('users')
                .update(updates)
                .eq('id', id)
                .select()
                .single()

            if (error) {
                console.error('Error updating user:', error)
                return null
            }

            return user as User
        } catch (error) {
            console.error('Error in updateUser:', error)
            return null
        }
    }
}
