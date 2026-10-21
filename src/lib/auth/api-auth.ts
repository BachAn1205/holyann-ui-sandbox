/**
 * API Authentication utilities
 * Centralized authentication checks for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export interface AuthenticatedRequest {
  userId: string;
  userRole: string;
  user: {
    id: string;
    role: string;
  };
}

/**
 * Authenticate API request using Bearer token
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<{ success: true; data: AuthenticatedRequest } | { success: false; response: NextResponse }> {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Unauthorized - Missing token' },
        { status: 401 }
      ),
    };
  }

  const decoded = verifyToken(token);
  if (!decoded || !decoded.userId) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      ),
    };
  }

  // Get user from database to verify still exists and get role
  const user = await prisma.users.findUnique({
    where: { id: decoded.userId },
    select: { id: true, role: true, is_active: true },
  });

  if (!user || !user.is_active) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Unauthorized - User not found or inactive' },
        { status: 401 }
      ),
    };
  }

  return {
    success: true,
    data: {
      userId: user.id,
      userRole: user.role,
      user: {
        id: user.id,
        role: user.role,
      },
    },
  };
}

/**
 * Check if user has required role
 */
export function hasRole(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole);
}

/**
 * Require specific role(s) for API route
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: string[]
): Promise<{ success: true; data: AuthenticatedRequest } | { success: false; response: NextResponse }> {
  const authResult = await authenticateRequest(request);

  if (!authResult.success) {
    return authResult;
  }

  if (!hasRole(authResult.data.userRole, allowedRoles)) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      ),
    };
  }

  return authResult;
}

/**
 * Verify user owns resource or has admin role
 */
export async function verifyOwnership(
  request: NextRequest,
  resourceUserId: string
): Promise<{ success: true; data: AuthenticatedRequest } | { success: false; response: NextResponse }> {
  const authResult = await authenticateRequest(request);

  if (!authResult.success) {
    return authResult;
  }

  // Admin can access any resource
  if (authResult.data.userRole === 'ADMIN') {
    return authResult;
  }

  // User must own the resource
  if (authResult.data.userId !== resourceUserId) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Forbidden - You can only access your own resources' },
        { status: 403 }
      ),
    };
  }

  return authResult;
}
