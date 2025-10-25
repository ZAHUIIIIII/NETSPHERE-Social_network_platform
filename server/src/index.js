
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";

import { connectDB } from "./lib/db.js";
import passport from "./config/passport.js";
import { app, server } from "./lib/socket.js";

// ===== Routes =====
import authRoutes from "./routes/auth.routes.js";
import messageRoutes from "./routes/message.route.js";
import postRoutes from "./routes/post.routes.js";
import searchRoutes from "./routes/search.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import userRoutes from "./routes/user.route.js";
import notificationRoutes from "./routes/notification.routes.js";

// ===== Config =====
const PORT = process.env.PORT || 5001;
const NODE_ENV = process.env.NODE_ENV || "production";
const CLIENT_URL = process.env.CLIENT_URL || "https://netsphere-git-main-zahuis-projects.vercel.app";

// Khi chạy sau reverse proxy (Render), cần bật trust proxy để cookie `secure` hoạt động
if (NODE_ENV === "production") app.set("trust proxy", 1);

// ===== Body & cookies =====
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());

// ===== CORS (cho phép Frontend & *.onrender.com) =====
const allowSet = new Set([
  CLIENT_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

const corsOptions = {
  origin(origin, cb) {
    // Cho phép: same-origin (no origin), domain đã khai báo, *.onrender.com, và *.vercel.app
    if (!origin || allowSet.has(origin) || /\.onrender\.com$/.test(origin) || /\.vercel\.app$/.test(origin)) {
      return cb(null, true);
    }
    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["set-cookie"],
};
app.use(cors(corsOptions));

// Handle preflight OPTIONS requests without using a path pattern (avoid
// path-to-regexp '*' parsing issues on some environments).
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return cors(corsOptions)(req, res, next);
  }
  next();
});

// ===== CSP lỏng đủ để chạy API + WebSocket =====
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: http: https:; connect-src 'self' ws: wss: http: https:;"
  );
  next();
});

// ===== Session (chỉ dùng nếu bạn thật sự cần session) =====
app.use(
  session({
    secret: process.env.JWT_SECRET || "your-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: NODE_ENV === "production",
      sameSite: NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24h
    },
  })
);

// ===== Passport =====
app.use(passport.initialize());
app.use(passport.session());

// ===== Health & Home =====
app.get("/", (_req, res) => res.send("NETSPHERE API is running ✅"));
app.get("/healthz", (_req, res) => res.status(200).json({ status: "ok" }));
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ===== Mount APIs =====
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/posts", commentRoutes); // comment routes trước
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/notifications", notificationRoutes);

// 404 cho các đường dẫn /api chưa định nghĩa
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ===== Error handler cuối cùng =====
app.use((err, _req, res, _next) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// ===== Start server =====
(async () => {
  try {
    await connectDB();
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`API listening on http://0.0.0.0:${PORT}`);
      console.log(`Client URL set to: ${CLIENT_URL}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
})();

// ===== Unhandled safety =====
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});
