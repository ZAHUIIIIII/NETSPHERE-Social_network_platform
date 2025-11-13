// server/src/index.js
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';

import { connectDB } from './lib/db.js';
import passport from './config/passport.js';

import { app, server } from './lib/socket.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import messageRoutes from './routes/message.route.js';
import postRoutes from './routes/post.routes.js';
import searchRoutes from './routes/search.routes.js';
import commentRoutes from './routes/comment.routes.js'; 
import userRoutes from './routes/user.route.js';
import notificationRoutes from './routes/notification.routes.js';
import adminRoutes from './routes/admin.routes.js';
import reportRoutes from './routes/report.routes.js';
import usageRoutes from './routes/usage.routes.js';
import statsRoutes from './routes/stats.routes.js';



const PORT = process.env.PORT || 5001;
const CLIENT_URL = process.env.CLIENT_URL || 'https://netsphere-nine.vercel.app';

// Trust proxy - Required for cookies to work behind Render's proxy
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(express.json({ limit: '50mb' })); // Increased for multiple image uploads
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Increased for multiple image uploads
app.use(cookieParser());

// Optimized CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    
    // Define allowed origins
    const allowedOrigins = [
      CLIENT_URL,
      'https://netsphere-nine.vercel.app',
      /^https:\/\/netsphere-[a-zA-Z0-9-]+\.vercel\.app$/, // All Vercel preview deployments
    ];
    
    // Check if origin is allowed
    const isAllowed = allowedOrigins.some(pattern => {
      if (pattern instanceof RegExp) {
        return pattern.test(origin);
      }
      return pattern === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`⚠️  CORS blocked request from: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['set-cookie'],
  maxAge: 86400, // 24 hours - cache preflight requests
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: http: https:; connect-src 'self' ws: wss: http: https:;"
  );
  next();
});

app.use(session({
  secret: process.env.JWT_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24h
    httpOnly: true
  },
  proxy: process.env.NODE_ENV === 'production' // Trust proxy in production
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Health check 
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/posts', commentRoutes); 
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', usageRoutes);
app.use('/api/stats', statsRoutes);

// Catch-all for unmatched API routes (debugging)
app.use('/api', (req, res, next) => {
  // Only handle if no route matched
  if (!req.route) {
    console.warn(`⚠️  Unmatched API route: ${req.method} ${req.originalUrl}`);
    return res.status(404).json({ 
      error: 'Route not found',
      path: req.originalUrl,
      method: req.method
    });
  }
  next();
});

(async () => {
  try {
    await connectDB(); // kết nối DB trước khi accept request
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🚀 Server started successfully!`);
      console.log(`📡 API listening on http://0.0.0.0:${PORT}`);
      console.log(`🌐 Client URL: ${CLIENT_URL}`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`⏰ Started at: ${new Date().toISOString()}\n`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
})();

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
