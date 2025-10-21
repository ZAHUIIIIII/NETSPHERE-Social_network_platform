import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}


// used to store online users
const userSocketMap = {}; // {userId: socketId}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  console.log("Socket userId:", userId);
  
  if (userId && userId !== 'undefined') {
    userSocketMap[userId] = socket.id;
    console.log("User added to socket map:", userId);
    
    // Join user's personal notification room
    socket.join(`user:${userId}`);
  } else {
    console.log("No valid userId provided in socket connection");
  }

  console.log("Current online users:", Object.keys(userSocketMap));
  // io.emit() is used to send events to all the connected clients
  io.emit("get-online-users", Object.keys(userSocketMap));

  // Join a post's comment room
  socket.on("join-post", (postId) => {
    if (postId) {
      socket.join(`post:${postId}`);
      console.log(`User ${userId} joined post room: ${postId}`);
    }
  });

  // Leave a post's comment room
  socket.on("leave-post", (postId) => {
    if (postId) {
      socket.leave(`post:${postId}`);
      console.log(`User ${userId} left post room: ${postId}`);
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    if (userId && userId !== 'undefined') {
      delete userSocketMap[userId];
      console.log("User removed from socket map:", userId);
    }
    console.log("Current online users after disconnect:", Object.keys(userSocketMap));
    io.emit("get-online-users", Object.keys(userSocketMap));
  });
});

export { io, app, server };