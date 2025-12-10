import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

let googleStrategyConfigured = false;

// Function to configure Google OAuth Strategy (called when needed)
function ensureGoogleStrategy() {
    if (googleStrategyConfigured) {
        return true;
    }

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
        return false;
    }

    try {
        passport.use(
            new GoogleStrategy(
                {
                    clientID: process.env.GOOGLE_CLIENT_ID,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                    callbackURL: process.env.GOOGLE_REDIRECT_URI || 'https://netsphere-901z.onrender.com/api/auth/google/callback',
                    scope: ['profile', 'email']
                },
                async ( profile, done) => {
                    try {
                        const email = profile.emails[0].value;
                        const googleAvatar = profile.photos && profile.photos[0] && profile.photos[0].value;
                        
                        // Normalize display name: NFC normalize + trim
                        const displayName = profile.displayName ? String(profile.displayName).normalize('NFC').trim() : '';
                        
                        // Sanitize username: remove invalid characters (keep only letters, numbers, spaces)
                        // Remove periods, parentheses, and other special characters
                        const sanitized = displayName.replace(/[^\p{L}\p{N} ]/gu, '').trim();
                        const normalized = sanitized || `user_${profile.id}`;
                        
                        // Create canonical usernameKey (lowercase, remove periods)
                        const usernameKey = normalized.toLowerCase().replace(/\./g, '');

                        // Check if user already exists by email
                        let user = await User.findOne({ email });

                        if (!user) {
                            // ensure no collision on usernameKey (should be rare)
                            const existingByKey = await User.findOne({ usernameKey });
                            if (existingByKey) {
                                // fallback to a safe unique username
                                const fallback = `user_${profile.id}`;
                                user = await User.create({
                                    username: fallback,
                                    usernameKey: fallback.toLowerCase().replace(/\./g, ''),
                                    email,
                                    avatar: googleAvatar || '',
                                    birthday: new Date('2000-01-01'),
                                    gender: 'other',
                                    password: 'google-oauth-dummy',
                                    googleId: profile.id,
                                    isGoogleUser: true
                                });
                            } else {
                                // Create new user with Google profile data
                                user = await User.create({
                                    username: normalized,
                                    usernameKey,
                                    email,
                                    avatar: googleAvatar || '',
                                    birthday: new Date('2000-01-01'), // Default birthday
                                    gender: 'other', // Default gender for Google users
                                    password: 'google-oauth-dummy', // Dummy password for Google users
                                    googleId: profile.id,
                                    isGoogleUser: true
                                });
                            }

                        } else {
                            // Existing user found - check if it's a password-based account
                            if (!user.isGoogleUser && !user.googleId) {
                                // This is a password-based account trying to login via Google
                                // Prevent this to avoid confusion between login methods
                                return done(null, false, { 
                                    message: 'This email is already registered with a password. Please login using your email and password instead.',
                                    status: 'password_account',
                                    email: user.email
                                });
                            }
                            
                            // Update existing Google user data if needed
                            let updated = false;
                            
                            if (!user.googleId) {
                                user.googleId = profile.id;
                                updated = true;
                            }
                            
                            if ((!user.avatar || user.avatar === '') && googleAvatar) {
                                user.avatar = googleAvatar;
                                updated = true;
                            }
                            
                            if (updated) {
                                await user.save();
                            }
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

                        // Check if user is suspended or banned before generating token
                        if (user.status === 'suspended') {
                            const expiryMsg = user.suspendedUntil 
                                ? ` Your suspension will expire on ${user.suspendedUntil.toLocaleDateString()}.`
                                : '';
                            return done(null, false, { 
                                message: `Your account has been temporarily suspended. Please contact support.${expiryMsg}`,
                                status: 'suspended',
                                suspendedUntil: user.suspendedUntil
                            });
                        }

                        if (user.status === 'banned') {
                            return done(null, false, { 
                                message: 'Your account has been permanently banned.',
                                status: 'banned',
                                reason: user.banReason || 'Violation of terms of service'
                            });
                        }

                        // Update lastActive timestamp
                        user.lastActive = new Date();
                        await user.save();

                        // Generate JWT token
                        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
                            expiresIn: '7d',
                        });

                        return done(null, { user, token });
                    } catch (error) {
                        console.error('[GoogleOAuth] Error during authentication:', error);
                        return done(error, null);
                    }
                }
            )
        );
        
        googleStrategyConfigured = true;

        return true;
    } catch (error) {
        console.error('Error configuring Google OAuth strategy:', error);
        return false;
    }
}

// save user to session
passport.serializeUser((data, done) => {
    done(null, data);
});

// get user from session
passport.deserializeUser((data, done) => {
    done(null, data);
});

export { ensureGoogleStrategy };
export default passport;