import axios from 'axios';

const api = axios.create({
  baseURL: '', // Use relative paths so Next.js rewrites handle the proxying
  headers: {
    'Content-Type': 'application/json',
  },
});

// We can add interceptors here later (e.g. attaching clerk auth tokens)
api.interceptors.request.use(async (config) => {
  // If integrating with Clerk on the client side, token fetching can be done here
  // const token = await window.Clerk?.session?.getToken();
  // if (token) {
  //   config.headers.Authorization = `Bearer ${token}`;
  // }
  return config;
});

export default api;
