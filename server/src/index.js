import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';

import { connectDB } from './lib/db.js';


import passport from './config/passport.js';
import authRoutes from './routes/auth.route.js';
import messageRoutes from './routes/message.route.js';
import postRoutes from './routes/post.route.js';
import { app, server } from './lib/socket.js';
import searchRoutes from './routes/search.route.js';
import userRoutes from './routes/user.route.js';



const PORT = process.env.PORT || 5001;



// Middleware
app.use(express.json({ limit: '10mb' })); // Increase payload limit for image uploads
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['set-cookie']
}));

// Add security headers to prevent CSP issues
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: http: https:; connect-src 'self' ws: wss: http: https:;");
  next();
});



// Session middleware for Passport
app.use(session({
  secret: process.env.JWT_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));



// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);


server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();

  // Search routes
  app.use('/api/search', searchRoutes);


});
