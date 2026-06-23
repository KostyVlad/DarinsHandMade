const isLocalhost =
  typeof window !== "undefined" &&
  /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);

// On localhost always use the local backend, ignoring VITE_API_URL so a
// production URL left in front/.env can't hijack local development.
export const API = isLocalhost
  ? "http://localhost:5000"
  : import.meta.env.VITE_API_URL || "https://darinshandmade.onrender.com";
