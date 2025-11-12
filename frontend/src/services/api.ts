import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { requestQueue } from '../utils/requestQueue';

// Use Render backend URL in production, local proxy in development
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.MODE === 'development' 
    ? 'http://localhost:3001/api' 
    : 'https://taskflow-backend-53y4.onrender.com/api');

console.log('[API Config] Mode:', import.meta.env.MODE);
console.log('[API Config] Base URL:', API_BASE_URL);

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

// Helper function to wait
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Add token to requests if available
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors (unauthorized) and 429 errors (rate limit) with retry logic
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & { _retryCount?: number };
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    // Handle 429 Rate Limit with exponential backoff
    if (error.response?.status === 429 && config) {
      const retryCount = config._retryCount || 0;
      
      if (retryCount < MAX_RETRIES) {
        config._retryCount = retryCount + 1;
        
        // Exponential backoff: 1s, 2s, 4s
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
        
        // Check if server provided Retry-After header
        const retryAfter = error.response.headers['retry-after'];
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : delay;
        
        console.log(`[API] Rate limited. Retrying in ${waitTime}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        
        await wait(waitTime);
        
        return axiosInstance.request(config);
      } else {
        console.error('[API] Max retries reached for rate limit');
        // Create a more user-friendly error
        const friendlyError = new Error(
          'Server is busy. Please wait a moment and try again.'
        ) as AxiosError;
        friendlyError.response = error.response;
        return Promise.reject(friendlyError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Wrap axios instance with request queue to prevent too many concurrent requests
const api = {
  get: <T = any>(url: string, config?: any) =>
    requestQueue.add(() => axiosInstance.get<T>(url, config)),
  
  post: <T = any>(url: string, data?: any, config?: any) =>
    requestQueue.add(() => axiosInstance.post<T>(url, data, config)),
  
  put: <T = any>(url: string, data?: any, config?: any) =>
    requestQueue.add(() => axiosInstance.put<T>(url, data, config)),
  
  patch: <T = any>(url: string, data?: any, config?: any) =>
    requestQueue.add(() => axiosInstance.patch<T>(url, data, config)),
  
  delete: <T = any>(url: string, config?: any) =>
    requestQueue.add(() => axiosInstance.delete<T>(url, config)),
  
  request: <T = any>(config: any) =>
    requestQueue.add(() => axiosInstance.request<T>(config)),
};

export default api;
