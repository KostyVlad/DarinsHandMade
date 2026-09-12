import axios from 'axios';

// One place that knows the address of the server. On the development machine
// it is the local server; anywhere else it is the deployed one.
const isLocalhost =
  typeof window !== 'undefined' &&
  /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);

export const API_BASE_URL = isLocalhost
  ? 'http://localhost:5000'
  : import.meta.env.VITE_API_URL || 'https://darinshandmade.onrender.com';

// Same value under the shorter name used by the order and account pages.
export const API = API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Builds the full address of a picture that the server keeps in /uploads,
// for example: imageUrl('uploads/pink.jpg') -> http://localhost:5000/uploads/pink.jpg
export const imageUrl = (fileName) => {
  if (!fileName) return '';
  return `${API_BASE_URL}/${String(fileName).replace(/^\//, '')}`;
};

// The token is kept in localStorage after login and has to be sent with
// every protected request, in the header the server expects.
export const authHeader = (token) => {
  return { headers: { Authorization: `Bearer ${token}` } };
};

export default api;
