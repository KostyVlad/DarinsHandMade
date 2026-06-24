const isLocalhost =
  typeof window !== "undefined" &&
  /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
  
export const API = isLocalhost
  ? "http://localhost:5000"
  : import.meta.env.VITE_API_URL || "https://darinshandmade.onrender.com";
