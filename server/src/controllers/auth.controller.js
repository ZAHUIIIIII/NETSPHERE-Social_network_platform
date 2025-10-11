import { generateToken } from '../lib/utils.js';
import User from '../models/user.model.js';
import TempRegistration from '../models/tempRegistration.model.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendVerificationEmail, sendPasswordResetEmail } from '../lib/email.js';
import passport, { ensureGoogleStrategy } from '../config/passport.js';

export const registerInitiate = async (req, res) => {
    const { username, birthday, gender, email } = req.body;
    try {
        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });
        
        if (existingUser) {
            return res.status(400).json({ 
                message: existingUser.email === email ? "Email already in use." : "Username already taken." 
            });
        }

        // Check if there's already a temp registration for this email
        let tempReg = await TempRegistration.findOne({ email });
        
        // Generate verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        if (tempReg) {
            // Update existing temp registration
            tempReg.username = username;
            tempReg.birthday = birthday;
            tempReg.gender = gender;
            tempReg.verificationCode = verificationCode;
            tempReg.expiresAt = expiresAt;
            await tempReg.save();
        } else {
            // Create new temp registration
            tempReg = new TempRegistration({
                username,
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

            // Create user
            const newUser = new User({
                username: tempReg.username,
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
            secure: process.env.NODE_ENV === 'production'
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

        // Send only necessary user data
        return res.json({
            _id: req.user._id,
            username: req.user.username,
            email: req.user.email,
            birthday: req.user.birthday,
            gender: req.user.gender,
            avatar: req.user.avatar,
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
            secure: process.env.NODE_ENV === 'production'
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
