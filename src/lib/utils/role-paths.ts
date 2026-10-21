/**
 * Get the base URL path for the current user role
 * @param role - User role (ADMIN, MENTOR, STUDENT, MARKETING, etc.)
 * @returns Base URL path (e.g., '/admin', '/mentor', '/student')
 */
const MENTOR_ROLE_ALIASES = new Set(['MENTOR', 'AS', 'ACS', 'ARD']);

export function isMentorRole(role?: string | null): boolean {
  if (!role) return false;
  return MENTOR_ROLE_ALIASES.has(role.toUpperCase());
}

export function getRoleBasePath(role?: string | null): string {
  if (!role) return '/student';

  const normalizedRole = role.toUpperCase();

  switch (normalizedRole) {
    case 'ADMIN':
      return '/admin';
    case 'MARKETING':
      return '/marketing';
    case 'MENTOR':
    case 'AS':
    case 'ACS':
    case 'ARD':
      return '/mentor';
    case 'STUDENT':
    case 'USER':
    default:
      return '/student';
  }
}

/**
 * Get the dashboard URL for the current user role
 * @param role - User role
 * @returns Dashboard URL (e.g., '/admin/dashboard')
 */
export function getRoleDashboardPath(role?: string | null): string {
  if (role?.toUpperCase() === 'MARKETING') {
    return '/marketing/posts';
  }

  return `${getRoleBasePath(role)}/dashboard`;
}

/**
 * Get the chat URL for the current user role
 * @param role - User role
 * @returns Chat URL (e.g., '/admin/chat')
 */
export function getRoleChatPath(role?: string | null): string {
  if (role?.toUpperCase() === 'MARKETING') {
    return '/marketing/posts';
  }

  return `${getRoleBasePath(role)}/chat`;
}

/**
 * Get a specific page URL for the current user role
 * @param page - Page path (e.g., 'profile', 'tests')
 * @param role - User role (optional)
 * @returns Full page URL
 */
export function getRolePagePath(page: string, role?: string | null): string {
  return `${getRoleBasePath(role)}/${page}`;
}

