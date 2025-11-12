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
    checkUsername,
    changePassword,
    updatePrivacySettings,
    deleteOwnAccount
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
router.get("/google", (req, res, next) => {
    console.log('🔵 Google OAuth initiated:', req.query);
    googleAuth(req, res, next);
});
router.get("/google/callback", (req, res, next) => {
    console.log('🔵 Google OAuth callback received:', req.query);
    googleCallback(req, res, next);
});
router.get("/google/user", protectRoute, getGoogleUser);

// Protected routes
router.get("/check", protectRoute, checkAuth);
router.put("/update-profile", protectRoute, updateProfile);
router.post("/change-password", protectRoute, changePassword);
router.put("/update-privacy", protectRoute, updatePrivacySettings);
router.delete("/delete-account", protectRoute, deleteOwnAccount);


export default router;