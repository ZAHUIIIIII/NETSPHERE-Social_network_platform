import { generateToken } from '../lib/utils.js';
import User from '../models/user.model.js';
import TempRegistration from '../models/tempRegistration.model.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendVerificationEmail, sendPasswordResetEmail } from '../lib/email.js';
import passport, { ensureGoogleStrategy } from '../config/passport.js';

// Helper to escape regex special chars
const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const checkUsername = async (req, res) => {
    const { username } = req.body;
    
    try {
        if (!username) {
            return res.status(400).json({ message: "Username is required" });
        }

        // Normalize and create canonical usernameKey
        const normalized = String(username).normalize('NFC').trim();
        const usernameKey = normalized.toLowerCase().replace(/\./g, '');

        // Check usernameKey in both User and TempRegistration
        const byKeyUser = await User.findOne({ usernameKey });
        const byKeyTemp = await TempRegistration.findOne({ usernameKey });

        // Check case-insensitive username match (extra safety)
        const byNameUser = await User.findOne({ username: { $regex: `^${escapeRegExp(normalized)}$`, $options: 'i' } });
        const byNameTemp = await TempRegistration.findOne({ username: { $regex: `^${escapeRegExp(normalized)}$`, $options: 'i' } });

        const exists = byKeyUser || byKeyTemp || byNameUser || byNameTemp;

        if (exists) {
            return res.status(200).json({ 
                available: false, 
                message: "Username already taken." 
            });
        }

        res.status(200).json({ 
            available: true, 
            message: "Username is available." 
        });
    } catch (error) {
        console.error("Error in checkUsername:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const registerInitiate = async (req, res) => {
    const { username, birthday, gender, email } = req.body;
    try {
        // Normalize and create canonical usernameKey (NFC normalize, trim, lowercase, remove periods)
        const normalized = username ? String(username).normalize('NFC').trim() : '';
        const usernameKey = normalized.toLowerCase().replace(/\./g, '');

        // Check for duplicates comprehensively:
        // 1. Check email in both User and TempRegistration
        const byEmailUser = await User.findOne({ email });
        const byEmailTemp = await TempRegistration.findOne({ email });

        if (byEmailUser || byEmailTemp) {
            return res.status(400).json({ 
                message: "Email already in use." 
            });
        }

        // 2. Check usernameKey (canonical) in both User and TempRegistration
        let byKeyUser = null;
        let byKeyTemp = null;
        if (usernameKey) {
            byKeyUser = await User.findOne({ usernameKey });
            byKeyTemp = await TempRegistration.findOne({ usernameKey });
        }

        // 3. Check case-insensitive username match (extra safety check)
        let byNameUser = null;
        let byNameTemp = null;
        if (normalized) {
            byNameUser = await User.findOne({ username: { $regex: `^${escapeRegExp(normalized)}$`, $options: 'i' } });
            byNameTemp = await TempRegistration.findOne({ username: { $regex: `^${escapeRegExp(normalized)}$`, $options: 'i' } });
        }

        const existingUser = byKeyUser || byNameUser;
        const existingTemp = byKeyTemp || byNameTemp;

        if (existingUser || existingTemp) {
            return res.status(400).json({ 
                message: "Username already taken." 
            });
        }

        // Check if there's already a temp registration for this email (should be caught above, but keep for safety)
        let tempReg = await TempRegistration.findOne({ email });
        
        // Generate verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        if (tempReg) {
            // Update existing temp registration
            tempReg.username = normalized;
            tempReg.usernameKey = usernameKey;
            tempReg.birthday = birthday;
            tempReg.gender = gender;
            tempReg.verificationCode = verificationCode;
            tempReg.expiresAt = expiresAt;
            await tempReg.save();
        } else {
            // Create new temp registration
            tempReg = new TempRegistration({
                username: normalized,
                usernameKey,
                birthday,
                gender,
                email,
                verificationCode,
                expiresAt
            });
            await tempReg.save();
        }

        // Send verification email
        try {
            await sendVerificationEmail(email, verificationCode);
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
        }

        res.status(200).json({
            message: "Verification code sent to your email",
            email: email
        });
    } catch (error) {
        console.error("Error in registerInitiate:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const registerVerify = async (req, res) => {
    const { email, code, password } = req.body;
    
    try {
        // Find temp registration
        const tempReg = await TempRegistration.findOne({ 
            email, 
            verificationCode: code,
            expiresAt: { $gt: new Date() }
        });

        if (!tempReg) {
            return res.status(400).json({ 
                message: "Invalid or expired verification code" 
            });
        }

        // If password is provided, complete registration
        if (password) {
            if (password.length < 10) {
                return res.status(400).json({ 
                    message: "Password must be at least 10 characters long" 
                });
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Create user (pre-validate hook will set usernameKey)
            const newUser = new User({
                username: tempReg.username,
                usernameKey: tempReg.usernameKey,
                birthday: tempReg.birthday,
                gender: tempReg.gender,
                email: tempReg.email,
                password: hashedPassword
            });

            await newUser.save();

            // Delete temp registration
            await TempRegistration.deleteOne({ _id: tempReg._id });

            // Generate token and set cookie
            generateToken(newUser._id, res);

            res.status(201).json({
                _id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                birthday: newUser.birthday,
                gender: newUser.gender,
                avatar: newUser.avatar,
                createdAt: newUser.createdAt
            });
        } else {
            // Just verify email, don't complete registration yet
            res.status(200).json({
                message: "Email verified successfully",
                verified: true
            });
        }
    } catch (error) {
        console.error("Error in registerVerify:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const login = async (req, res) => {
    const { email, username, password } = req.body;
    
    try {
        // Allow login with either email or username
        const loginField = email;
        if (!loginField) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email: loginField });

        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        generateToken(user._id, res);

        res.status(200).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            birthday: user.birthday,
            gender: user.gender,
            avatar: user.avatar,
            createdAt: user.createdAt
        });
    } catch (error) {
        console.error("Error in login:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const logout = (req, res) => {
    try {
        res.cookie("token", "", { 
            maxAge: 0,
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'development',
        });
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.error("Error in logout:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    
    try {
        const user = await User.findOne({ email });
        
        if (!user) {
            // Don't reveal whether email exists or not
            return res.status(200).json({
                message: "If an account exists for this email, you'll receive a reset link shortly."
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetTokenExpires;
        await user.save();

        // Send reset email
        await sendPasswordResetEmail(email, resetToken);

        res.status(200).json({
            message: "If an account exists for this email, you'll receive a reset link shortly."
        });
    } catch (error) {
        console.error("Error in forgotPassword:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const resetPassword = async (req, res) => {
    const { token, password } = req.body;
    
    try {
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid or expired reset token"
            });
        }

        if (password.length < 10) {
            return res.status(400).json({
                message: "Password must be at least 10 characters long"
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update user
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({
            message: "Password reset successfully"
        });
    } catch (error) {
        console.error("Error in resetPassword:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const checkAuth = async (req, res) => {
    try {
        // User is already attached to req by protectRoute middleware
        if (!req.user) {
            return res.status(401).json({ message: "Not authorized" });
        }

        // Send only necessary user data including following/followers for follow button state
        return res.json({
            _id: req.user._id,
            username: req.user.username,
            email: req.user.email,
            birthday: req.user.birthday,
            gender: req.user.gender,
            avatar: req.user.avatar,
            following: req.user.following || [],
            followers: req.user.followers || [],
            createdAt: req.user.createdAt
        });
    } catch (error) {
        console.error("Error in checkAuth:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { avatar, bio, website, phone } = req.body;
        const userId = req.user._id;

        // Build update object with only provided fields
        const updateData = {};
        if (avatar !== undefined) updateData.avatar = avatar;
        if (bio !== undefined) updateData.bio = bio;
        if (website !== undefined) updateData.website = website;
        if (phone !== undefined) updateData.phone = phone;

        const updatedUser = await User.findByIdAndUpdate(
            userId, 
            updateData, 
            { new: true }
        ).select("-password");

        res.status(200).json(updatedUser);
    } catch (error) {
        console.error("Error in updateProfile:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Google OAuth Routes
export const googleAuth = (req, res, next) => {
    // Ensure Google strategy is configured
    const isConfigured = ensureGoogleStrategy();
    
    if (!isConfigured) {
        console.error('❌ Google OAuth not configured');
        return res.status(500).json({ 
            message: "Google OAuth is not configured on this server" 
        });
    }
    
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        prompt: 'select_account'
    })(req, res, next);
};

export const googleCallback = (req, res, next) => {
    // Ensure Google strategy is configured
    const isConfigured = ensureGoogleStrategy();
    
    if (!isConfigured) {
        console.error('❌ Google OAuth not configured in callback');
        const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        return res.redirect(`${frontendUrl}/login?error=oauth_not_configured`);
    }
    
    passport.authenticate('google', { session: false }, (err, data, info) => {
        const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        
        if (err) {
            console.error('[Google OAuth] Authentication error:', err);
            return res.redirect(`${frontendUrl}/login?error=oauth_error`);
        }
        
        if (!data || !data.user || !data.token) {
            console.error('[Google OAuth] No user data received:', info);
            return res.redirect(`${frontendUrl}/login?error=oauth_failed`);
        }

        const { user, token } = data;

        // Set the JWT token as a secure HTTP-only cookie
        res.cookie('token', token, {
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'development'
        });

        // Redirect to frontend with success and user info
        res.redirect(`${frontendUrl}/?login=success&user=${encodeURIComponent(user.username)}`);
    })(req, res, next);
};

// Optional: Get Google user info (for debugging)
export const getGoogleUser = async (req, res) => {
    try {
        // This would be called after successful authentication
        res.status(200).json({
            message: "Google authentication successful",
            user: req.user
        });
    } catch (error) {
        console.error("Error in getGoogleUser:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
