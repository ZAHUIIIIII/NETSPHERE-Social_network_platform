import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    console.log("getUsersForSidebar called by user:", req.user._id);
    const loggedInUserId = req.user._id;
    const blockedUserIds = req.blockedUserIds || [];
    
    // Get current user's muted conversations
    const currentUser = await User.findById(loggedInUserId);
    const mutedConversations = currentUser?.notificationSettings?.mutedConversations || [];
    
    // Exclude logged in user and blocked users
    const excludeIds = [loggedInUserId, ...blockedUserIds];
    const filteredUsers = await User.find({ _id: { $nin: excludeIds } }).select("-password");
    
    // Get last message and unread count for each user
    const usersWithLastMessage = await Promise.all(
      filteredUsers.map(async (user) => {
        const lastMessage = await Message.findOne({
          $or: [
            { senderId: loggedInUserId, receiverId: user._id },
            { senderId: user._id, receiverId: loggedInUserId },
          ],
          deletedFor: { $ne: loggedInUserId } // Exclude messages deleted by current user
        })
        .sort({ createdAt: -1 })
        .populate('senderId', 'username')
        .populate('receiverId', 'username');

        // Check if this conversation is muted
        const isMuted = mutedConversations.some(id => id.toString() === user._id.toString());

        // Count unread messages from this user (excluding deleted)
        // If conversation is muted, don't count unread messages
        const unreadCount = isMuted ? 0 : await Message.countDocuments({
          senderId: user._id,
          receiverId: loggedInUserId,
          read: false,
          deletedFor: { $ne: loggedInUserId }
        });

        return {
          ...user.toObject(),
          lastMessage: lastMessage ? {
            _id: lastMessage._id,
            text: lastMessage.text,
            image: lastMessage.image,
            senderId: lastMessage.senderId._id,
            senderName: lastMessage.senderId.username,
            createdAt: lastMessage.createdAt,
            isFromMe: lastMessage.senderId._id.toString() === loggedInUserId.toString()
          } : null,
          unreadCount,
          isMuted
        };
      })
    );

    // Sort users by last message time (most recent first)
    usersWithLastMessage.sort((a, b) => {
      if (!a.lastMessage && !b.lastMessage) return 0;
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
    });

    console.log("Found users with last messages:", usersWithLastMessage.length);
    res.status(200).json(usersWithLastMessage);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
      deletedFor: { $ne: myId } // Exclude messages deleted by current user
    })
    .sort({ createdAt: 1 }); // Sort by creation time in ascending order (oldest first)

    // Mark all messages from the other user as read
    await Message.updateMany(
      {
        senderId: userToChatId,
        receiverId: myId,
        read: false,
        deletedFor: { $ne: myId }
      },
      {
        $set: { read: true }
      }
    );

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    // Check if receiver has muted this conversation or disabled message notifications
    const receiver = await User.findById(receiverId);
    const settings = receiver?.notificationSettings || {};
    const mutedConversations = settings.mutedConversations || [];
    const isConversationMuted = mutedConversations.some(id => id.toString() === senderId.toString());
    
    // Check if all notifications are muted or messages are disabled
    const allNotificationsMuted = settings.allNotificationsMuted === true;
    const messagesDisabled = settings.messages === false;
    const pushDisabled = settings.push === false;

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      // Always emit the message so it appears in chat
      io.to(receiverSocketId).emit("newMessage", newMessage);
      
      // Only emit notification if:
      // 1. Conversation is not muted
      // 2. All notifications are not muted
      // 3. Messages notifications are not disabled
      if (!isConversationMuted && !allNotificationsMuted && !messagesDisabled) {
        io.to(receiverSocketId).emit("newMessageNotification", {
          message: newMessage,
          sender: req.user,
          showToast: !pushDisabled
        });
      }
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Toggle mute conversation (mute/unmute message notifications for specific conversation)
export const toggleMuteConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id: targetUserId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Initialize notificationSettings if it doesn't exist
    if (!user.notificationSettings) {
      user.notificationSettings = {
        allNotificationsMuted: false,
        mutedPosts: [],
        mutedUsers: [],
        mutedConversations: []
      };
    }

    // Initialize mutedConversations array if it doesn't exist
    if (!user.notificationSettings.mutedConversations) {
      user.notificationSettings.mutedConversations = [];
    }

    const mutedConversations = user.notificationSettings.mutedConversations || [];
    const isMuted = mutedConversations.some(id => id.toString() === targetUserId);

    if (isMuted) {
      // Unmute conversation
      user.notificationSettings.mutedConversations = mutedConversations.filter(
        id => id.toString() !== targetUserId
      );
    } else {
      // Mute conversation
      user.notificationSettings.mutedConversations.push(targetUserId);
    }

    await user.save();

    res.status(200).json({
      message: isMuted ? 'Conversation unmuted' : 'Conversation muted',
      isMuted: !isMuted,
      mutedConversations: user.notificationSettings.mutedConversations
    });
  } catch (error) {
    console.error('Error in toggleMuteConversation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Check if conversation is muted
export const checkConversationMuteStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id: targetUserId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const mutedConversations = user.notificationSettings?.mutedConversations || [];
    const isMuted = mutedConversations.some(id => id.toString() === targetUserId);

    res.status(200).json({ isMuted });
  } catch (error) {
    console.error('Error in checkConversationMuteStatus:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete conversation (one-sided - only for the current user)
export const deleteConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id: targetUserId } = req.params;

    // Mark all messages in this conversation as deleted for the current user
    const result = await Message.updateMany(
      {
        $or: [
          { senderId: userId, receiverId: targetUserId },
          { senderId: targetUserId, receiverId: userId }
        ]
      },
      {
        $addToSet: { deletedFor: userId }
      }
    );

    res.status(200).json({ 
      message: 'Conversation deleted successfully',
      deletedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error in deleteConversation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};