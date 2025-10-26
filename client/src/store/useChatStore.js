import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      console.log("Users fetched:", res.data); // Debug log
      set({ users: res.data });
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error(error.response?.data?.message || "Failed to fetch users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
      
      // After fetching messages, update the user's unread count to 0
      const { users } = get();
      const updatedUsers = users.map(user => {
        if (user._id === userId) {
          return { ...user, unreadCount: 0 };
        }
        return user;
      });
      set({ users: updatedUsers });
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error(error.response?.data?.message || "Failed to fetch messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  
  sendMessage: async (messageData) => {
    const { selectedUser, messages, users } = get();
    const currentUserId = useAuthStore.getState().authUser?._id;
    
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      const newMessage = res.data;
      
      // Add message to current conversation
      set({ messages: [...messages, newMessage] });
      
      // Update the specific user's last message in the users list WITHOUT refetching
      const updatedUsers = users.map(user => {
        if (user._id === selectedUser._id) {
          return {
            ...user,
            lastMessage: {
              _id: newMessage._id,
              text: newMessage.text || '',
              image: newMessage.image || null,
              senderId: currentUserId,
              senderName: 'You',
              createdAt: newMessage.createdAt || new Date().toISOString(),
              isFromMe: true
            }
          };
        }
        return user;
      });
      
      // Re-sort users by last message time (most recent first)
      updatedUsers.sort((a, b) => {
        if (!a.lastMessage && !b.lastMessage) return 0;
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
      });
      
      set({ users: updatedUsers });
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },  
  
  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const { selectedUser, messages, users } = get();
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser?._id;
      
      if (isMessageSentFromSelectedUser) {
        // Add message to current conversation if from selected user
        set({
          messages: [...messages, newMessage],
        });
      }
      
      // Update the user's last message and unread count in the users list
      const updatedUsers = users.map(user => {
        if (user._id === newMessage.senderId) {
          return {
            ...user,
            lastMessage: {
              _id: newMessage._id,
              text: newMessage.text || '',
              image: newMessage.image || null,
              senderId: newMessage.senderId,
              senderName: user.username,
              createdAt: newMessage.createdAt || new Date().toISOString(),
              isFromMe: false
            },
            // Increment unread count only if not from selected user (not currently viewing)
            unreadCount: isMessageSentFromSelectedUser ? user.unreadCount : (user.unreadCount || 0) + 1
          };
        }
        return user;
      });
      
      // Re-sort users by last message time (most recent first)
      updatedUsers.sort((a, b) => {
        if (!a.lastMessage && !b.lastMessage) return 0;
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
      });
      
      set({ users: updatedUsers });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));