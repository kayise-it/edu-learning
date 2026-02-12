import axios from 'axios';

// Use environment variable with fallback to port 4000
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

console.log('🌐 API URL:', API_URL); // This will help debug

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 Making ${config.method.toUpperCase()} request to: ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ Response received from: ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('⏰ Request timeout');
    }
    if (!error.response) {
      console.error('🔴 Network error - backend may be down on port 4000');
    } else {
      console.error(`❌ Error ${error.response.status}:`, error.response.data);
    }
    return Promise.reject(error);
  }
);

export default api;