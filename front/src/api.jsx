import axios from 'axios';

// One place that knows the address of the server. On the development machine
// it is the local server; anywhere else it is the deployed one.
const hostname = window.location.hostname;
const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

let baseUrl = 'https://darinshandmade.onrender.com';
if (isLocalhost) {
  baseUrl = 'http://localhost:5000';
} else if (import.meta.env.VITE_API_URL) {
  baseUrl = import.meta.env.VITE_API_URL;
}

export const API_BASE_URL = baseUrl;

// Same value under the shorter name used by the order and account pages.
export const API = API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Builds the full address of a picture that the server keeps in /uploads,
// for example: imageUrl('uploads/pink.jpg') -> http://localhost:5000/uploads/pink.jpg
export const imageUrl = (fileName) => {
  if (!fileName) {
    return '';
  }

  // "/uploads/pink.jpg" -> "uploads/pink.jpg", so the address has no "//".
  let cleanName = String(fileName);
  if (cleanName.startsWith('/')) {
    cleanName = cleanName.slice(1);
  }

  return `${API_BASE_URL}/${cleanName}`;
};

// The token is kept in localStorage after login and has to be sent with
// every protected request, in the header the server expects.
export const authHeader = (token) => {
  return { headers: { Authorization: `Bearer ${token}` } };
};

export default api;
