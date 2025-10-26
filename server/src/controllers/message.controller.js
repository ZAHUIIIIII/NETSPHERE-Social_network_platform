import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    console.log("getUsersForSidebar called by user:", req.user._id);
    const loggedInUserId = req.user._id;
    
    
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
    
    // Get last message and unread count for each user
    const usersWithLastMessage = await Promise.all(
      filteredUsers.map(async (user) => {
        const lastMessage = await Message.findOne({
          $or: [
            { senderId: loggedInUserId, receiverId: user._id },
            { senderId: user._id, receiverId: loggedInUserId },
          ],
        })
        .sort({ createdAt: -1 })
        .populate('senderId', 'username')
        .populate('receiverId', 'username');

        // Count unread messages from this user
        const unreadCount = await Message.countDocuments({
          senderId: user._id,
          receiverId: loggedInUserId,
          read: false
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
          unreadCount
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
    })
    .sort({ createdAt: 1 }); // Sort by creation time in ascending order (oldest first)

    // Mark all messages from the other user as read
    await Message.updateMany(
      {
        senderId: userToChatId,
        receiverId: myId,
        read: false
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

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};