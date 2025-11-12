import nodemailer from 'nodemailer';

// Lazily create the transporter to ensure environment variables are loaded
let transporter = null;

function getTransporter() {
    if (!transporter) {
        // Debug: Log environment variables (remove this in production)
        console.log('Creating email transporter with:');
        console.log('EMAIL_USER:', process.env.EMAIL_USER);
        console.log('EMAIL_PASS length:', process.env.EMAIL_PASS?.length);
        
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            throw new Error('EMAIL_USER and EMAIL_PASS environment variables are required');
        }
        
        transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            tls: {
                rejectUnauthorized: false
            },
            // Reduced timeouts for faster error responses
            connectionTimeout: 10000, // 10 seconds (default is 2 minutes)
            greetingTimeout: 10000,   // 10 seconds (default is 30 seconds)
            socketTimeout: 15000      // 15 seconds (default is 10 minutes)
        });
    }
    return transporter;
}

export function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendVerificationEmail(email, verificationCode) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your NETSPHERE Verification Code',
        text: `Welcome to NETSPHERE! Your verification code is: ${verificationCode}. This code will expire in 10 minutes.`,
        html: `
            <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;background:#f9f9f9;border-radius:12px;">
                <h2 style="color:#4f46e5;">Welcome to NETSPHERE!</h2>
                <p>Hi there,</p>
                <p>Thank you for registering. Your verification code is:</p>
                <div style="font-size:2rem;font-weight:bold;letter-spacing:4px;margin:16px 0;color:#2563eb;text-align:center;">${verificationCode}</div>
                <p>Enter this code in the app to verify your email address.</p>
                <p style="color:#888;font-size:0.95em;margin-top:24px;">If you did not request this, you can ignore this email.</p>
                <div style="margin-top:32px;text-align:center;color:#aaa;font-size:0.9em;">&mdash; The NETSPHERE Team</div>
            </div>
        `
    };

    try {
        const emailTransporter = getTransporter();
        await emailTransporter.sendMail(mailOptions);
        console.log('Verification email sent successfully');
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw error;
    }
}

export async function sendPasswordResetEmail(email, token) {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Reset Your NETSPHERE Password',
        text: `Reset Your NETSPHERE Password\n\nHi there,\n\nWe received a request to reset your NETSPHERE password. Click the link below or copy and paste it into your browser to set a new password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you did not request this, you can safely ignore this email.\n\n— The NETSPHERE Team`,
        html: `
            <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;background:#f9f9f9;border-radius:12px;">
                <h2 style="color:#4f46e5;">Reset Your Password</h2>
                <p>Hi there,</p>
                <p>We received a request to reset your NETSPHERE password. Click the button below to set a new password:</p>
                <div style="text-align:center;">
                    <a href="${resetUrl}" style="display:inline-block;margin:24px 0;padding:12px 28px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;font-weight:bold;font-size:1.1em;">Reset Password</a>
                </div>
                <p style="color:#666;font-size:0.9em;margin-top:16px;">Or copy and paste this link into your browser:</p>
                <p style="word-break:break-all;color:#2563eb;font-size:0.85em;background:#f0f4ff;padding:12px;border-radius:6px;margin:12px 0;">${resetUrl}</p>
                <p style="color:#888;font-size:0.95em;margin-top:24px;">If you did not request this, you can safely ignore this email. This link will expire in 1 hour.</p>
                <div style="margin-top:32px;text-align:center;color:#aaa;font-size:0.9em;">&mdash; The NETSPHERE Team</div>
            </div>
        `,
    };

    try {
        const emailTransporter = getTransporter();
        await emailTransporter.sendMail(mailOptions);
        console.log('Password reset email sent successfully');
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw error;
    }
}

export async function sendMail(to, subject, text, html) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text,
        html,
    };

    try {
        const emailTransporter = getTransporter();
        await emailTransporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
    } 
}