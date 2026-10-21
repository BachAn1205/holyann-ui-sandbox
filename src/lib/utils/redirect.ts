/**
 * Get dashboard URL based on user role
 */
export const getDashboardUrl = (role?: string): string => {
    const normalizedRole = role?.toUpperCase();

    switch (normalizedRole) {
        case 'MENTOR':
            return '/dashboard/mentor';
        case 'ADMIN':
            return '/dashboard/admin';
        case 'STUDENT':
        default:
            return '/dashboard';
    }
};

/**
 * Redirect to appropriate dashboard based on user role
 */
export const redirectToDashboard = (router: any, role?: string) => {
    const url = getDashboardUrl(role);
    router.push(url);
};
