/** Placeholder used by the UI sandbox when Vercel has no auth env vars. */
export const authSecret =
  process.env.NEXTAUTH_SECRET || "sandbox-nextauth-secret-change-me";
