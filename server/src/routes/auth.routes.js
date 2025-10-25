import express from 'express';
import { 
    login, 
    logout, 
    updateProfile, 
    registerInitiate, 
    registerVerify, 
    forgotPassword, 
    resetPassword,
    checkAuth,
    googleAuth,
    googleCallback,
    getGoogleUser,
    checkUsername
} from '../controllers/auth.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

// Check username availability
router.post("/check-username", checkUsername);

// Multi-step registration routes
router.post("/register-initiate", registerInitiate);
router.post("/register-verify", registerVerify);

// Password reset routes
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Authentication routes
router.post("/login", login);
router.post("/logout", logout);

// Google OAuth routes
router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);
router.get("/google/user", protectRoute, getGoogleUser);

// Protected routes
router.get("/check", protectRoute, checkAuth);
router.put("/update-profile", protectRoute, updateProfile);


export default router;