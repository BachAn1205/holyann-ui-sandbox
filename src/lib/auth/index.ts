/**
 * Auth utilities
 * Re-exports verifyToken from JWTService for backward compatibility
 */

import { JWTService, JWTPayload } from '@/lib/services/jwt.service';

/**
 * Verify JWT token
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export function verifyToken(token: string): JWTPayload | null {
  return JWTService.verifyToken(token);
}

export { JWTService, type JWTPayload };
