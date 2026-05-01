/**
 * Check if running in development mode.
 * Server-side: checks NODE_ENV
 * Client-side: checks import.meta.env (set by Vite)
 */
export function isDevEnvironment(): boolean {
  // Server-side (Node.js)
  if (typeof window === "undefined") {
    return process.env.NODE_ENV !== "production";
  }

  // Client-side (Vite)
  try {
    return !!(import.meta as any).env?.DEV;
  } catch {
    return false;
  }
}

/**
 * Check if auth bypass is enabled. Only works in development mode.
 * Controlled by XYD_AUTH_BYPASS=1 environment variable.
 */
export function isAuthBypassed(): boolean {
  if (!isDevEnvironment()) return false;

  return (
    process.env.XYD_AUTH_BYPASS === "1" ||
    process.env.XYD_AUTH_BYPASS === "true"
  );
}