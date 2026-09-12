import axios from 'axios';

// One place that knows the address of the server. Every request in the
// project goes through here, so moving the server means changing one line.
export const API_BASE_URL = 'http://localhost:5000';

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
