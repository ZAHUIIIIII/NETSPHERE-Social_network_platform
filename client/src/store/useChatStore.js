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
  searchInConversation: null, // { query: string, currentMatchId: string }

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Unable to load conversations. Please refresh the page.");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getAllUsersForNewMessage: async () => {
    try {
      const res = await axiosInstance.get("/messages/users/all");
      return res.data;
    } catch (error) {
      console.error("Error fetching all users:", error);
      toast.error("Unable to load users. Please try again.");
      return [];
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
      toast.error("Unable to load messages. Please try again.");
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
      
      // Check if this user already exists in the sidebar
      const userExists = users.some(user => user._id.toString() === selectedUser._id.toString());
      
      let updatedUsers;
      
      if (userExists) {
        // Update existing user's last message
        updatedUsers = users.map(user => {
          if (user._id.toString() === selectedUser._id.toString()) {
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
      } else {
        // Add new user to the sidebar (first message to this person)
        updatedUsers = [
          {
            ...selectedUser,
            lastMessage: {
              _id: newMessage._id,
              text: newMessage.text || '',
              image: newMessage.image || null,
              senderId: currentUserId,
              senderName: 'You',
              createdAt: newMessage.createdAt || new Date().toISOString(),
              isFromMe: true
            },
            unreadCount: 0,
            isMuted: false
          },
          ...users
        ];
      }
      
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
      toast.error("Unable to send message. Please check your connection.");
    }
  },  
  
  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", async (newMessage) => {
      const { selectedUser, messages, users } = get();
      const currentUserId = useAuthStore.getState().authUser?._id;
      
      // Check if message is part of current conversation (either received or sent)
      const isMessageFromSelectedUser = newMessage.senderId === selectedUser?._id;
      const isMessageToSelectedUser = newMessage.receiverId === selectedUser?._id;
      const isInCurrentConversation = isMessageFromSelectedUser || isMessageToSelectedUser;
      
      if (isInCurrentConversation) {
        // Avoid duplicate: only add if not already in messages array
        const messageExists = messages.some(msg => msg._id === newMessage._id);
        if (!messageExists) {
          set({
            messages: [...messages, newMessage],
          });
        }
      }
      
      // Determine chat partner and check if they exist in sidebar
      const isMyOwnMessage = newMessage.senderId?.toString() === currentUserId?.toString();
      const chatPartnerId = isMyOwnMessage ? newMessage.receiverId : newMessage.senderId;
      const userExists = users.some(user => user._id.toString() === chatPartnerId?.toString());
      
      let updatedUsers;
      
      if (userExists) {
        // Update existing user's last message
        updatedUsers = users.map(user => {
          if (user._id.toString() === chatPartnerId.toString()) {
            return {
              ...user,
              lastMessage: {
                _id: newMessage._id,
                text: newMessage.text || '',
                image: newMessage.image || null,
                senderId: newMessage.senderId,
                senderName: isMyOwnMessage ? 'You' : user.username,
                createdAt: newMessage.createdAt || new Date().toISOString(),
                isFromMe: isMyOwnMessage
              },
              // Don't increment unread count here - it will be handled by newMessageNotification event
              // This ensures muted conversations don't show unread counts
            };
          }
          return user;
        });
      } else {
        // Add new user to sidebar (first message from/to this person)
        try {
          const res = await axiosInstance.get(`/users/id/${chatPartnerId}`);
          const chatPartner = res.data;
          
          updatedUsers = [
            {
              ...chatPartner,
              lastMessage: {
                _id: newMessage._id,
                text: newMessage.text || '',
                image: newMessage.image || null,
                senderId: newMessage.senderId,
                senderName: isMyOwnMessage ? 'You' : chatPartner.username,
                createdAt: newMessage.createdAt || new Date().toISOString(),
                isFromMe: isMyOwnMessage
              },
              unreadCount: 0,
              isMuted: false
            },
            ...users
          ];
        } catch (error) {
          console.error("Error fetching chat partner details:", error);
          // Fallback: keep existing users
          updatedUsers = users;
        }
      }
      
      // Re-sort users by last message time (most recent first)
      updatedUsers.sort((a, b) => {
        if (!a.lastMessage && !b.lastMessage) return 0;
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
      });
      
      set({ users: updatedUsers });
    });

    // Listen for notification event (only emitted if conversation is not muted)
    // This is where we increment unread count
    socket.on("newMessageNotification", ({ message, sender, showToast }) => {
      const { selectedUser, users } = get();
      const isMessageFromCurrentChat = message.senderId === selectedUser?._id;
      
      // Increment unread count for this conversation (only if not currently viewing)
      if (!isMessageFromCurrentChat) {
        const updatedUsers = users.map(user => {
          if (user._id === message.senderId) {
            return {
              ...user,
              unreadCount: (user.unreadCount || 0) + 1
            };
          }
          return user;
        });
        set({ users: updatedUsers });
        
        // Show toast notification only if showToast is not explicitly false
        if (showToast !== false) {
          const messageText = message.text || 'Sent an image';
          toast.success(`${sender.username}: ${messageText}`, {
            duration: 4000,
            icon: '💬'
          });
        }
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("newMessageNotification");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
  setSearchInConversation: (searchData) => set({ searchInConversation: searchData }),
}));