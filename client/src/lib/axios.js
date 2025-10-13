import axios from 'axios';

// Create axios instance with custom config
const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor
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

// Response interceptor
let isRefreshing = false;

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Handle 401 Unauthorized errors
        if (error?.response?.status === 401 && !isRefreshing) {
            isRefreshing = true;
            
            // Clear token and user data
            try {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            } catch (e) {}

            // Only redirect in browser environment and if we're not already on the login page
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                window.location.replace('/login');
            }
            
            setTimeout(() => {
                isRefreshing = false;
            }, 1000); // Prevent multiple redirects within 1 second
        }
        return Promise.reject(error);
    }
);

export { axiosInstance };
export default axiosInstance;