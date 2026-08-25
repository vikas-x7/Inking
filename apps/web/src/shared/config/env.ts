// Cronix-style cross-origin setup: the browser calls the backend DIRECTLY.
// In production NEXT_PUBLIC_API_URL is the Render backend URL
// (e.g. "https://inking-1.onrender.com"); the sign-in buttons navigate to
// <API_URL>/auth/google and axios calls <API_URL>/auth/me etc. withCredentials.
// Cookies stay host-only on the backend domain (SameSite=None; Secure in prod).
// The same-origin /api rewrite below is only a local-dev fallback when the var
// is unset.
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api';