import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export const protectRoute = async (req, res, next) => {
    try {
        // Support token from cookie OR Authorization header (Bearer)
        let token = req.cookies?.token;
        if (!token) {
            const authHeader = req.headers?.authorization || req.headers?.Authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1];
            }
        }

        if (!token) {
            return res.status(401).json({ message: 'Not authorized, token missing' });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            console.error('JWT verification failed:', err.message);
            return res.status(401).json({ message: 'Not authorized, token invalid' });
        }

        const user = await User.findById(decoded.userId).select('-password');
        if (!user) {
            return res.status(401).json({ message: 'user not found' });
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
                reason: user.banReason || 'No reason provided'
            });
        }

        // Update lastActive timestamp
        await User.findByIdAndUpdate(decoded.userId, { 
            lastActive: new Date() 
        });

        req.user = user;
        next();
    } catch (error) {
        console.error('Error in protectRoute middleware:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};