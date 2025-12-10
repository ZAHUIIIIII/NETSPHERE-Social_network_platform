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
            const token = generateToken(newUser._id, res);

            res.status(201).json({
                _id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                birthday: newUser.birthday,
                gender: newUser.gender,
                avatar: newUser.avatar,
                role: newUser.role,
                isGoogleUser: newUser.isGoogleUser || false,
                createdAt: newUser.createdAt,
                token // Send token in response for mobile browsers
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

        // Check if suspension has expired
        if (user.status === 'suspended' && user.suspendedUntil) {
            if (new Date() > user.suspendedUntil) {
                // Suspension expired, automatically reactivate
                user.status = 'active';
                user.suspendedUntil = null;
                await user.save();
            }
        }

        // Check if user is suspended or banned
        if (user.status === 'suspended') {
            const expiryMsg = user.suspendedUntil 
                ? ` Your suspension will expire on ${user.suspendedUntil.toLocaleDateString()}.`
                : '';
            return res.status(403).json({ 
                message: `Your account has been temporarily suspended. Please contact support.${expiryMsg}`,
                status: 'suspended',
                suspendedUntil: user.suspendedUntil
            });
        }

        if (user.status === 'banned') {
            return res.status(403).json({ 
                message: 'Your account has been permanently banned.',
                status: 'banned',
                reason: user.banReason || 'Violation of terms of service'
            });
        }

        // Update lastActive on login
        user.lastActive = new Date();
        await user.save();

        const token = generateToken(user._id, res);

        res.status(200).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            birthday: user.birthday,
            gender: user.gender,
            avatar: user.avatar,
            role: user.role,
            isGoogleUser: user.isGoogleUser || false,
            createdAt: user.createdAt,
            token // Send token in response for mobile browsers
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
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            secure: process.env.NODE_ENV === 'production', // Fixed: was 'development', should be 'production'
            path: '/',
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

        // Check if user logged in with Google
        if (user.isGoogleUser) {
            return res.status(400).json({
                message: "This account uses Google Sign-In. Please log in with Google instead of resetting your password."
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
            role: req.user.role,
            isGoogleUser: req.user.isGoogleUser || false,
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
        const { avatar, bio, website, phone, location, work, username } = req.body;
        const userId = req.user._id;

        // Build update object with only provided fields
        const updateData = {};
        if (avatar !== undefined) updateData.avatar = avatar;
        if (bio !== undefined) updateData.bio = bio;
        if (website !== undefined) updateData.website = website;
        if (phone !== undefined) updateData.phone = phone;
        if (location !== undefined) updateData.location = location;
        if (work !== undefined) updateData.work = work;

        // Handle username update with validation
        if (username !== undefined && username !== req.user.username) {
            // Normalize and validate username
            const normalized = String(username).normalize('NFC').trim();
            
            // Basic validation
            if (normalized.length < 2 || normalized.length > 35) {
                return res.status(400).json({ 
                    message: "Username must be between 2 and 35 characters" 
                });
            }

            // Check for periods
            if (normalized.includes('.')) {
                return res.status(400).json({ 
                    message: "Periods are not allowed in usernames" 
                });
            }

            // Check allowed characters: letters, numbers, and spaces
            if (!/^[\p{L}\p{N} ]+$/u.test(normalized)) {
                return res.status(400).json({ 
                    message: "Username can only contain letters, numbers, and spaces" 
                });
            }

            // Create canonical key for uniqueness check
            const usernameKey = normalized.toLowerCase().replace(/\./g, '');

            // Check forbidden words
            const forbidden = [
                'admin','support','root','system','postmaster','webmaster',
                'contact','security','abuse','mail','smtp','ftp','api',
                'help','info','billing','test'
            ];
            if (forbidden.includes(usernameKey)) {
                return res.status(400).json({ 
                    message: "Username contains a forbidden word" 
                });
            }

            // Check domain-like suffixes
            const forbiddenSuffixes = ['.com', '.net', '.org', '.io', '.app', '.dev', '.me'];
            for (const suffix of forbiddenSuffixes) {
                if (usernameKey.endsWith(suffix.replace('.', ''))) {
                    return res.status(400).json({ 
                        message: "Username cannot look like a domain" 
                    });
                }
            }

            // Check if usernameKey already exists (excluding current user)
            const existingUser = await User.findOne({ 
                usernameKey,
                _id: { $ne: userId }
            });

            if (existingUser) {
                return res.status(400).json({ 
                    message: "Username is already taken" 
                });
            }

            // Add username and usernameKey to update
            updateData.username = normalized;
            updateData.usernameKey = usernameKey;
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId, 
            updateData, 
            { new: true, runValidators: true }
        ).select("-password");

        res.status(200).json(updatedUser);
    } catch (error) {
        console.error("Error in updateProfile:", error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                message: Object.values(error.errors)[0].message 
            });
        }
        
        res.status(500).json({ message: "Internal server error" });
    }
};

// Update Privacy Settings
export const updatePrivacySettings = async (req, res) => {
    try {
        const { showEmail } = req.body;
        const userId = req.user._id;

        // Build update object with only provided fields
        const updateData = {};
        if (showEmail !== undefined) updateData.showEmail = showEmail;

        const updatedUser = await User.findByIdAndUpdate(
            userId, 
            updateData, 
            { new: true, runValidators: true }
        ).select("-password");

        res.status(200).json(updatedUser);
    } catch (error) {
        console.error("Error in updatePrivacySettings:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Change Password
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user._id;

        // Check if user is a Google user
        if (req.user.isGoogleUser) {
            return res.status(400).json({ 
                message: "Google users cannot change password. Please manage your password through Google." 
            });
        }

        // Validate inputs
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ 
                message: "Current password and new password are required" 
            });
        }

        // Validate new password length
        if (newPassword.length < 10) {
            return res.status(400).json({ 
                message: "New password must be at least 10 characters long" 
            });
        }

        // Get user with password
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Verify current password
        const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ 
                message: "Current password is incorrect" 
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ 
            message: "Password changed successfully" 
        });
    } catch (error) {
        console.error("Error in changePassword:", error);
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
    console.log('🔵 Google callback URL:', req.originalUrl);
    console.log('🔵 Google callback host:', req.get('host'));
    console.log('🔵 CLIENT_URL env:', process.env.CLIENT_URL);
    
    // Ensure Google strategy is configured
    const isConfigured = ensureGoogleStrategy();
    
    if (!isConfigured) {
        console.error('❌ Google OAuth not configured in callback');
        const frontendUrl = process.env.CLIENT_URL || 'https://netsphere-one.vercel.app';
        return res.redirect(`${frontendUrl}/login?error=oauth_not_configured`);
    }
    
    passport.authenticate('google', { session: false }, (err, data, info) => {
        const frontendUrl = process.env.CLIENT_URL || 'https://netsphere-one.vercel.app';
        console.log('🔵 Redirecting to frontend:', frontendUrl);
        
        if (err) {
            console.error('[Google OAuth] Authentication error:', err);
            return res.redirect(`${frontendUrl}/login?error=oauth_error`);
        }
        
        // Check if user is banned, suspended, or using wrong login method (data will be false in this case)
        if (!data && info) {
            if (info.status === 'suspended') {
                return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(info.message)}`);
            }
            if (info.status === 'banned') {
                const message = info.reason ? `${info.message} Reason: ${info.reason}` : info.message;
                return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(message)}`);
            }
            if (info.status === 'password_account') {
                return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(info.message)}`);
            }
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
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: '/',
        });

        // Mobile browser detection - fallback to token in URL for mobile Safari
        // Desktop: Clean URL (cookie-only for better security)
        // Mobile: Token in URL (fallback because Safari ITP blocks cross-site cookies)
        const userAgent = req.headers['user-agent'] || '';
        const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(userAgent);
        
        let redirectUrl;
        if (isMobile) {
            // Mobile: Include token as fallback (Safari ITP issues)
            redirectUrl = `${frontendUrl}/?login=success&token=${encodeURIComponent(token)}`;
        } else {
            // Desktop: Clean URL (cookie-only)
            redirectUrl = `${frontendUrl}/?login=success`;
        }
        
        res.redirect(redirectUrl);
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

// Delete own account
export const deleteOwnAccount = async (req, res) => {
    try {
        const userId = req.user._id;
        const { password } = req.body;
        
        console.log('User requesting account deletion:', userId);
        
        // Get user with password
        const user = await User.findById(userId).select('+password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Verify password for security (unless Google user)
        if (!user.isGoogleUser) {
            if (!password) {
                return res.status(400).json({ message: 'Password is required to delete account' });
            }
            
            const isPasswordCorrect = await bcrypt.compare(password, user.password);
            if (!isPasswordCorrect) {
                return res.status(400).json({ message: 'Incorrect password' });
            }
        }
        
        // Import required models
        const Post = (await import('../models/post.model.js')).default;
        const Comment = (await import('../models/comment.model.js')).default;
        const Notification = (await import('../models/notification.model.js')).default;
        const Message = (await import('../models/message.model.js')).default;
        const Report = (await import('../models/report.model.js')).default;
        const cloudinary = (await import('../lib/cloudinary.js')).default;
        
        console.log('Starting account deletion process for:', user.username);
        
        // Delete all user-related data
        try {
            // 1. Get all user's posts for image cleanup
            const userPosts = await Post.find({ author: userId });
            
            // Delete images from Cloudinary for user's posts
            for (const post of userPosts) {
                if (post.images && post.images.length > 0) {
                    await Promise.all(post.images.map(async (imageUrl) => {
                        try {
                            const publicId = imageUrl.split('/').slice(-2).join('/').split('.')[0];
                            await cloudinary.uploader.destroy(publicId);
                        } catch (err) {
                            console.error('Error deleting post image from cloudinary:', err);
                        }
                    }));
                }
            }
            
            // Delete all posts
            const deletedPosts = await Post.deleteMany({ author: userId });
            console.log(`Deleted ${deletedPosts.deletedCount} posts`);
            
            // 2. Soft delete user's comments (preserve thread structure and username only)
            // Save username snapshot so others know who they replied to
            const softDeletedComments = await Comment.updateMany(
                { authorId: userId },
                { 
                    $set: { 
                        isDeleted: true,
                        content: '(comment deleted)',
                        authorSnapshot: {
                            username: user.username
                        }
                    }
                }
            );
            console.log(`Soft deleted ${softDeletedComments.modifiedCount} comments`);
            
            // 3. Delete notifications
            const deletedNotifications = await Notification.deleteMany({
                $or: [
                    { sender: userId },
                    { recipient: userId }
                ]
            });
            console.log(`Deleted ${deletedNotifications.deletedCount} notifications`);
            
            // 4. Delete messages
            const deletedMessages = await Message.deleteMany({
                $or: [
                    { senderId: userId },
                    { receiverId: userId }
                ]
            });
            console.log(`Deleted ${deletedMessages.deletedCount} messages`);
            
            // 5. Delete reports
            const deletedReports = await Report.deleteMany({ reportedBy: userId });
            await Report.deleteMany({ postId: { $in: userPosts.map(p => p._id) } });
            console.log(`Deleted ${deletedReports.deletedCount} reports`);
            
            // 6. Remove from followers/following
            await User.updateMany(
                { followers: userId },
                { $pull: { followers: userId } }
            );
            await User.updateMany(
                { following: userId },
                { $pull: { following: userId } }
            );
            
            // 7. Remove from blocked lists
            await User.updateMany(
                { blockedUsers: userId },
                { $pull: { blockedUsers: userId } }
            );
            await User.updateMany(
                { blockedBy: userId },
                { $pull: { blockedBy: userId } }
            );
            
            // 8. Remove from notification settings
            await User.updateMany(
                { savedPosts: { $in: userPosts.map(p => p._id) } },
                { $pull: { savedPosts: { $in: userPosts.map(p => p._id) } } }
            );
            await User.updateMany(
                { 'notificationSettings.mutedUsers': userId },
                { $pull: { 'notificationSettings.mutedUsers': userId } }
            );
            await User.updateMany(
                { 'notificationSettings.mutedConversations': userId },
                { $pull: { 'notificationSettings.mutedConversations': userId } }
            );
            await User.updateMany(
                { 'notificationSettings.mutedPosts': { $in: userPosts.map(p => p._id) } },
                { $pull: { 'notificationSettings.mutedPosts': { $in: userPosts.map(p => p._id) } } }
            );
            
            // 9. Remove reactions and reposts
            await Post.updateMany(
                { 'reactions.like': userId },
                { $pull: { 'reactions.like': userId } }
            );
            await Post.updateMany(
                { 'reactions.love': userId },
                { $pull: { 'reactions.love': userId } }
            );
            await Post.updateMany(
                { 'reactions.haha': userId },
                { $pull: { 'reactions.haha': userId } }
            );
            await Post.updateMany(
                { 'reactions.wow': userId },
                { $pull: { 'reactions.wow': userId } }
            );
            await Post.updateMany(
                { 'reactions.sad': userId },
                { $pull: { 'reactions.sad': userId } }
            );
            await Post.updateMany(
                { 'reactions.angry': userId },
                { $pull: { 'reactions.angry': userId } }
            );
            await Post.updateMany(
                { reposts: userId },
                { $pull: { reposts: userId }, $inc: { repostCount: -1 } }
            );
            
            // 10. Delete avatar from Cloudinary
            if (user.avatar && !user.avatar.includes('default-avatar')) {
                try {
                    const publicId = user.avatar.split('/').slice(-2).join('/').split('.')[0];
                    await cloudinary.uploader.destroy(publicId);
                    console.log('Deleted user avatar from Cloudinary');
                } catch (err) {
                    console.error('Error deleting avatar from cloudinary:', err);
                }
            }
            
            // 11. Finally, delete the user
            await User.findByIdAndDelete(userId);
            console.log('User account deleted:', user.username);
            
            // Clear the auth cookie
            res.cookie("token", "", { 
                maxAge: 0,
                httpOnly: true,
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                secure: process.env.NODE_ENV === 'production',
                path: '/',
            });
            
            res.json({ 
                message: 'Your account and all related data have been permanently deleted',
                success: true
            });
        } catch (cleanupError) {
            console.error('Error during account deletion cleanup:', cleanupError);
            throw cleanupError;
        }
    } catch (error) {
        console.error('Error in deleteOwnAccount:', error);
        res.status(500).json({ 
            message: 'Error deleting account',
            error: error.message
        });
    }
};
