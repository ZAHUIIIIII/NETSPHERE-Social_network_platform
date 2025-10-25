import jwt from 'jsonwebtoken';

export const generateToken = (userId, res) => {

    const token = jwt.sign({userId}, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { 
        maxAge: 7 * 24 * 60 * 60 * 1000, // Milliseconds in a week
        httpOnly: true,
        // Allow top-level navigations (OAuth redirects) to set the cookie in dev (lax)
        // and use 'none' in production to allow cross-site requests when behind secure HTTPS
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    });
    return token;
}