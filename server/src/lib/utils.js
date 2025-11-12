import jwt from 'jsonwebtoken';

export const generateToken = (userId, res) => {
    const token = jwt.sign({userId}, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    // Cookie configuration for production (cross-origin)
    const cookieOptions = {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' required for cross-origin
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        path: '/',
    };
    
    res.cookie('token', token, cookieOptions);
    return token;
}