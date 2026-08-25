// By default the browser talks straight to the backend API. In production
// (Vercel frontend, Render backend) set NEXT_PUBLIC_API_URL to the Render URL,
// e.g. "https://inking-1.onrender.com". All API calls then go cross-origin to
// that URL (Sign-in → <API_URL>/auth/google, callback → <API_URL>/auth/google/callback).
// Only as a fallback (when the var is unset) requests go to the same-origin
// Next.js rewrite proxy at /api, which forwards to API_PROXY_TARGET.
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api';
