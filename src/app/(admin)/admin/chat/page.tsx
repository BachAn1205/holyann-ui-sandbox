'use client';

import { ChatPage } from '@/components/chat/ChatPage';
import RoleGuard from '@/components/auth/RoleGuard';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useEffect } from 'react';

export default function ChatDashboard() {
    const { user, isLoading, isAuthenticated } = useAuthSession();
    const authReady = !isLoading;

    useEffect(() => {
        console.log('🔍 [Chat Page] Auth State:', {
            authReady,
            isAuthenticated,
            user,
            userId: user?.id,
            userRole: user?.role
        });
    }, [authReady, isAuthenticated, user]);

    if (!authReady) {
        console.log('⏳ [Chat Page] Waiting for auth...');
        return (
            <div className="h-[calc(100vh-80px)] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }


    return (
        <RoleGuard allowedRoles={['user', 'student', 'mentor', 'admin']}>
            <div className="h-[calc(100vh-140px)] flex flex-col overflow-hidden rounded-2xl bg-card/50 shadow-lg">
                <ChatPage />
            </div>
        </RoleGuard>
    );
}

