// In development: set VITE_API_URL in .env.local to point to your backend LAN IP.
// e.g. VITE_API_URL=http://192.168.1.100:3000
export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
