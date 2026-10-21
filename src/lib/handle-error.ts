import { Prisma } from '@prisma/client';

// ============================================================
// MAINTENANCE MESSAGE
// ============================================================

export const MAINTENANCE_MESSAGE =
  'Server đang bảo trì, vui lòng chờ khoảng 1 tiếng rồi quay lại.';

// ============================================================
// PRISMA CONNECTION ERROR CODES
// P1xxx = Connection / DB reachability errors
// ============================================================

const PRISMA_CONNECTION_CODES = new Set([
  'P1000', // Authentication failed
  'P1001', // Can't reach DB server
  'P1002', // DB server timed out
  'P1003', // DB does not exist
  'P1008', // Operations timed out
  'P1009', // DB already exists (mis-config)
  'P1010', // Access denied
  'P1011', // TLS connection error
  'P1017', // Server closed connection
]);

// ============================================================
// TYPE GUARD HELPERS
// ============================================================

function isPrismaConnectionError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) return true;
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return PRISMA_CONNECTION_CODES.has(error.code);
  }
  return false;
}

function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes('fetch failed') ||
    msg.includes('econnrefused') ||
    msg.includes('enotfound') ||
    msg.includes('network') ||
    msg.includes('timeout') ||
    msg.includes('socket') ||
    msg.includes('connection') ||
    msg.includes('supabase') // Supabase REST errors often include this
  );
}

// ============================================================
// MAIN HELPER: Use in every Server Action catch block
// ============================================================

/**
 * Normalizes any server/DB error into a user-friendly message.
 *
 * Usage in Server Actions:
 * ```ts
 * } catch (error) {
 *   return { success: false, error: handleServerError(error) };
 * }
 * ```
 */
export function handleServerError(error: unknown): string {
  // Always log the raw error server-side
  console.error('[Server Error]', error);

  const isDev = process.env.NODE_ENV === 'development';

  // 1. Prisma connection / initialization errors
  if (isPrismaConnectionError(error)) {
    if (isDev && error instanceof Error) {
      return `Không kết nối được cơ sở dữ liệu: ${error.message}. Kiểm tra DATABASE_URL và máy chủ DB.`;
    }
    return MAINTENANCE_MESSAGE;
  }

  // 2. Generic network / fetch errors
  if (isNetworkError(error)) {
    if (isDev && error instanceof Error) {
      return `Lỗi mạng / kết nối: ${error.message}`;
    }
    return MAINTENANCE_MESSAGE;
  }

  // 3. Prisma known request error (query-level) → show code in dev, generic in prod
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (process.env.NODE_ENV === 'development') {
      return `Lỗi truy vấn DB [${error.code}]: ${error.message}`;
    }
    return 'Đã xảy ra lỗi, vui lòng thử lại sau.';
  }

  // 4. Prisma validation errors (wrong shape) → dev detail, prod generic
  if (error instanceof Prisma.PrismaClientValidationError) {
    if (process.env.NODE_ENV === 'development') {
      return `Lỗi validation Prisma: ${error.message}`;
    }
    return 'Đã xảy ra lỗi, vui lòng thử lại sau.';
  }

  // 5. Any other Error with a message → pass through in dev, generic in prod
  if (error instanceof Error) {
    if (process.env.NODE_ENV === 'development') {
      return `Lỗi: ${error.message}`;
    }
    return 'Đã xảy ra lỗi không xác định, vui lòng thử lại sau.';
  }

  return 'Đã xảy ra lỗi không xác định, vui lòng thử lại sau.';
}
