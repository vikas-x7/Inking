// All API calls go to the same-origin Next.js rewrite proxy at /api, which
// forwards them server-side to API_PROXY_TARGET (the Render backend). Cookies
// therefore stay on the frontend origin (vercel.app / localhost) — first-party,
// safe from third-party-cookie blocking. NEXT_PUBLIC_API_URL should stay unset;
// it exists only for a local-dev setup that calls a backend directly.
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api';
