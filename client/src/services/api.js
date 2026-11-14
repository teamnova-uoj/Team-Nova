import axios from 'axios';

// Create axios instance pointing to your backend
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

// Before every request — automatically attach JWT token if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mg_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// After every response — if we get 401, token is expired/invalid
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const token = localStorage.getItem('mg_token');
      if (token) {
        localStorage.removeItem('mg_token');
        localStorage.removeItem('mg_user');
        window.location.href = `${process.env.PUBLIC_URL}/`;
      }
    }
    return Promise.reject(error);
  }
  
);

export default api;