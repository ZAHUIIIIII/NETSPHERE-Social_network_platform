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
                    callbackURL: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5001/api/auth/google/callback',
                    scope: ['profile', 'email']
                },
                async (accessToken, refreshToken, profile, done) => {
                    try {
                        const email = profile.emails[0].value;
                        const googleAvatar = profile.photos && profile.photos[0] && profile.photos[0].value;
                        // normalize display name and create canonical key
                        const displayName = profile.displayName ? String(profile.displayName).normalize('NFC').trim() : '';
                        const normalized = displayName || `user_${profile.id}`;
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
                            // Update existing user with Google data if not already set
                            let updated = false;
                            
                            if (!user.googleId) {
                                user.googleId = profile.id;
                                user.isGoogleUser = true;
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

// Serialize user for session
passport.serializeUser((data, done) => {
    done(null, data);
});

// Deserialize user from session
passport.deserializeUser((data, done) => {
    done(null, data);
});

export { ensureGoogleStrategy };
export default passport;