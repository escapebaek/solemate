// On web (Vercel) this is '' so relative paths work as-is.
// For a Capacitor build set NEXT_PUBLIC_API_BASE=https://s0lemate.vercel.app
// so the static WebView can reach the server-side routes (Gemini, RapidAPI).
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? ''
