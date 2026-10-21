/**
 * Centralized logging utility
 * Only warn and error are output; info/debug are no-op.
 */

export const logger = {
  /**
   * Log info (disabled - use warn/error only)
   */
  info: () => {},

  /**
   * Log warning (always)
   */
  warn: (...args: any[]) => {
    console.warn(...args);
  },

  /**
   * Log error (always)
   */
  error: (...args: any[]) => {
    console.error(...args);
  },

  /**
   * Log debug (disabled - use warn/error only)
   */
  debug: () => {},
};
