import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
    interface User {
        accessToken?: string
        role?: string
        id?: string
        email?: string
        name?: string
        full_name?: string
        image?: string
        student?: {
            user_id: string
            current_school?: string | null
            current_grade?: string | null
            target_faculty_name?: string | null
            target_university_name?: string | null
            date_of_birth?: Date | null
            current_address?: string | null
        } | null  // ✅ Allow null
    }

    interface Session {
        accessToken?: string
        user: {
            name?: string | null
            email?: string | null
            image?: string | null
            accessToken?: string
            role?: string
            id?: string
            user_id?: string  // Alias for compatibility
            full_name?: string
            subscriptionPlan?: 'FREE' | 'PLUS' | 'PREMIUM'
        }
        student?: {
            user_id: string
            current_school?: string | null
            current_grade?: string | null
            target_faculty_name?: string | null
            target_university_name?: string | null
            date_of_birth?: Date | null
            current_address?: string | null
        }
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        accessToken?: string
        role?: string
        subscriptionPlan?: 'FREE' | 'PLUS' | 'PREMIUM'
        subscriptionPlanUpdatedAt?: number
        id?: string
        email?: string
        name?: string
        full_name?: string
        picture?: string
        student?: {
            user_id: string
            current_school?: string | null
            current_grade?: string | null
            target_faculty_name?: string | null
            target_university_name?: string | null
            date_of_birth?: Date | null
            current_address?: string | null
        }
    }
}

