import axios from 'axios';

// Backend URL - in dev, Vite proxy forwards /api to the backend
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  // Long enough for the Render backend to wake from sleep (can take ~60 s), but a stalled request still ends
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to automatically attach the JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('rie_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle CORS and other errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      // Silently handle error
    } else if (error.request) {
      // Request made but no response
      // Silently handle error
    } else {
      // Silently handle error
    }
    return Promise.reject(error);
  }
);
