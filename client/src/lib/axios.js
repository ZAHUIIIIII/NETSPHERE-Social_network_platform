// client/src/lib/axios.js
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let isRefreshing = false;

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error?.response?.status;
    const data = error?.response?.data;
    
    // Handle suspended or banned accounts (403)
    // Only redirect if this is specifically about the current user's account being restricted
    // Check for the specific message format from auth.middleware.js
    if (status === 403 && 
        (data?.message?.includes('account has been suspended') || 
         data?.message?.includes('account has been banned'))) {
      
      // Don't redirect multiple times
      if (isRefreshing) return Promise.reject(error);
      
      isRefreshing = true;
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch {}
      
      if (typeof window !== 'undefined') {
        // Redirect to login with the actual message from backend
        const errorMsg = data?.message || 'Your account has been restricted';
        window.location.replace(`/login?error=${encodeURIComponent(errorMsg)}`);
      }
      setTimeout(() => { isRefreshing = false; }, 1000);
      return Promise.reject(error);
    }
    
    // Handle unauthorized (401)
    if (status === 401 && !isRefreshing) {
      // Don't redirect if on reset-password page
      if (window.location.pathname.includes('/reset-password')) {
        return Promise.reject(error);
      }
      
      isRefreshing = true;
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch {}
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.replace('/login');
      }
      setTimeout(() => { isRefreshing = false; }, 1000);
    }
    return Promise.reject(error);
  }
);

export { axiosInstance };
export default axiosInstance;
