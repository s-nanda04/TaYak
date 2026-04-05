/**
 * API origin for fetch calls.
 * - Dev: `/api` is proxied by Vite to the FastAPI backend (see vite.config.js).
 * - Production: set VITE_API_BASE_URL (e.g. https://your-api.onrender.com) before build.
 */
export const API_BASE =
  (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "") ||
  (import.meta.env.DEV ? "/api" : "http://127.0.0.1:8000");
