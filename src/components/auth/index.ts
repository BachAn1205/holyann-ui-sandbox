/**
 * Auth Components - Authentication & Authorization
 * 
 * All authentication-related components:
 * - Login: Login form and authentication
 * - Register: User registration form
 * - AuthHeader: Navigation header with auth state
 * - AuthProvider: NextAuth session provider
 * - RoleGuard: Role-based access control
 * - NextAuthErrorBoundary: Error handling for auth
 */

export { default as Login } from './Login';
export { default as Register } from './Register';
export { default as AuthHeader } from './AuthHeader';
export { default as AuthProvider } from './AuthProvider';
export { default as RoleGuard } from './RoleGuard';
export { default as NextAuthErrorBoundary } from './NextAuthErrorBoundary';
