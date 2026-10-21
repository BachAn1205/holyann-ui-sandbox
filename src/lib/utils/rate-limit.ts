/**
 * Rate limiting utilities
 * Use Redis in production for distributed rate limiting
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();

  /**
   * Check if request should be rate limited
   */
  check(
    identifier: string,
    maxRequests: number = 100,
    windowMs: number = 60000
  ): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const entry = this.store.get(identifier);

    if (!entry || now > entry.resetAt) {
      const resetAt = now + windowMs;
      this.store.set(identifier, {
        count: 1,
        resetAt,
      });
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetAt,
      };
    }

    if (entry.count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
      };
    }

    entry.count++;
    return {
      allowed: true,
      remaining: maxRequests - entry.count,
      resetAt: entry.resetAt,
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetAt) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.store.clear();
  }
}

export const rateLimiter = new RateLimiter();

// Cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    rateLimiter.cleanup();
  }, 5 * 60 * 1000);
}

/**
 * Rate limit presets
 */
export const rateLimitPresets = {
  // API routes
  api: { maxRequests: 100, windowMs: 60000 }, // 100 requests per minute
  apiStrict: { maxRequests: 20, windowMs: 60000 }, // 20 requests per minute
  
  // Auth routes
  auth: { maxRequests: 5, windowMs: 60000 }, // 5 requests per minute
  
  // File upload
  upload: { maxRequests: 10, windowMs: 60000 }, // 10 uploads per minute
  
  // Chat
  chat: { maxRequests: 200, windowMs: 60000 }, // 200 messages per minute
};
