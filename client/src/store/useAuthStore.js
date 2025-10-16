import {create} from 'zustand';
import axiosInstance from '../lib/axios';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
// import { disconnect } from 'mongoose';

const BASE_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';


export const useAuthStore = create((set, get) => ({
    authUser : null,
    isSigningUp : false,
    isLoggingIn : false,
    isUpdatingProfile : false,
    isCheckingAuth : true,
    onlineUsers: [],
    socket: null,


   checkAuth: async () => {
    try {
        const res = await axiosInstance.get('/auth/check');
        set({authUser: res.data});
        get().connectSocket();
    } catch (error) {
        // Silently handle 401 errors - user is just not authenticated
        if (error.response?.status === 401) {
            set({authUser: null});
        } else {
            console.error('Auth check error:', error);
            set({authUser: null});
        }
    } finally {
        set({isCheckingAuth: false});
    }
},

    registerInitiate: async (data) => {
        set({isSigningUp: true});
        try {
            const res = await axiosInstance.post('/auth/register-initiate', data);
            return res.data;
        } catch (error) {
            throw error;
        } finally {
            set({isSigningUp: false});
        }
    },

    registerVerify: async (data) => {
        set({isSigningUp: true});
        try {
            const res = await axiosInstance.post('/auth/register-verify', data);
            // If the response contains user data (when password is provided), set the auth user
            if (res.data._id) {
                set({authUser: res.data});
                toast.success('Registered and logged in successfully');
                get().connectSocket();
            }
            return res.data;
        } catch (error) {
            throw error;
        } finally {
            set({isSigningUp: false});
        }
    },

    login: async (data) => {
        set({isLoggingIn: true});
        try {
            const res = await axiosInstance.post('/auth/login', data);
            set({authUser: res.data});
            toast.success('Logged in successfully');
            get().connectSocket(); 
        } catch (error) {
            throw error;
        } finally {
            set({isLoggingIn: false});
        }
    },

    logout: async () => {
        try {
            await axiosInstance.post('/auth/logout');
            set({authUser: null});
            toast.success('Logged out successfully');
            get().disconnectSocket();
        } catch (error) {
            toast.error('Logout failed');
            throw error;
        }
    },

    forgotPassword: async (email) => {
        try {
            const res = await axiosInstance.post('/auth/forgot-password', { email });
            toast.success('Password reset link sent to your email');
            return res.data;
        } catch (error) {
            throw error;
        }
    },

    resetPassword: async (token, password) => {
        try {
            const res = await axiosInstance.post('/auth/reset-password', { 
                token, 
                password 
            });
            toast.success('Password reset successfully');
            return res.data;
        } catch (error) {
            throw error;
        }
    },

    updateProfile: async (data) => {
        set({isUpdatingProfile: true});
        try {
            const res = await axiosInstance.put('/auth/update-profile', data);
            set({authUser: res.data});
            toast.success('Profile updated successfully');
            return res.data;
        } catch (error) {
            throw error;
        } finally {
            set({isUpdatingProfile: false});
        }
    },

    connectSocket: () => {
        const { authUser } = get();
        if (!authUser || get().socket?.connected) return;
        
        console.log("Connecting socket for user:", authUser._id);

        const socket = io(BASE_URL, {
            query: { 
                userId: authUser._id,
            },
        });

        socket.connect();
        set({ socket: socket });

        socket.on("get-online-users", (userIds) => {
            console.log("Received online users:", userIds);
            set({ onlineUsers: userIds });
        });

        socket.on("connect", () => {
            console.log("✅ Socket connected successfully:", socket.id);
        });

        socket.on("disconnect", () => {
            console.log("❌ Socket disconnected");
        });

        // Notification event listeners
        socket.on("newNotification", (notification) => {
            console.log("🔔 New notification received:", notification);
            // Emit custom event that App.jsx can listen to
            window.dispatchEvent(new CustomEvent('newNotification', { detail: notification }));
        });

        socket.on("unreadCount", (data) => {
            console.log("📊 Unread count updated:", data.count);
            // Emit custom event that App.jsx can listen to
            window.dispatchEvent(new CustomEvent('unreadCountUpdate', { detail: data.count }));
        });
},

    disconnectSocket: () => {
        if(get().socket?.connected) get ().socket.disconnect();
    },
    

}))

