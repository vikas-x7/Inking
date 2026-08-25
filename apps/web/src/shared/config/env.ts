// All API requests go through the Next.js rewrite proxy at /api.
// The proxy forwards them to the backend (API_PROXY_TARGET in .env).
// This keeps cookies same-origin and avoids CORS/third-party-cookie issues.
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api';
