import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'https://netsphere-nine.vercel.app';

const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin
      if (!origin) return callback(null, true);
      
      // List of allowed origins
      const allowedOrigins = [
        CLIENT_URL,
        "https://netsphere-nine.vercel.app",
        /^https:\/\/netsphere-[a-zA-Z0-9-]+\.vercel\.app$/, // Allow all Vercel preview deployments
      ];
      
      // Check if origin matches any allowed pattern
      const isAllowed = allowedOrigins.some(pattern => {
        if (pattern instanceof RegExp) {
          return pattern.test(origin);
        }
        return pattern === origin;
      });
      
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ["GET", "POST"]
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