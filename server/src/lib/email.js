// Brevo (Sendinblue) Email Service - Works on Render Free Tier
// No SMTP ports needed - Uses HTTPS API

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

async function sendBrevoEmail({ to, subject, htmlContent, textContent }) {
    if (!process.env.BREVO_API_KEY) {
        throw new Error('BREVO_API_KEY environment variable is required');
    }

    const payload = {
        sender: {
            name: 'NETSPHERE Verification',
            email: process.env.EMAIL_FROM || 'leeminhuy47@gmail.com'
        },
        to: Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }],
        subject: subject,
        htmlContent: htmlContent,
        textContent: textContent
    };

    try {
        const response = await fetch(BREVO_API_URL, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': process.env.BREVO_API_KEY,
                'content-type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Brevo API Error: ${error.message || response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Email sent successfully via Brevo:', data.messageId);
        return data;
    } catch (error) {
        console.error('❌ Error sending email via Brevo:', error.message);
        throw error;
    }
}

export function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendVerificationEmail(email, verificationCode) {
    const subject = 'Your NETSPHERE Verification Code';
    const textContent = `Welcome to NETSPHERE! Your verification code is: ${verificationCode}. This code will expire in 10 minutes.`;
    const htmlContent = `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;background:#f9f9f9;border-radius:12px;">
            <h2 style="color:#4f46e5;">Welcome to NETSPHERE!</h2>
            <p>Hi there,</p>
            <p>Thank you for registering. Your verification code is:</p>
            <div style="font-size:2rem;font-weight:bold;letter-spacing:4px;margin:16px 0;color:#2563eb;text-align:center;">${verificationCode}</div>
            <p>Enter this code in the app to verify your email address.</p>
            <p style="color:#888;font-size:0.95em;margin-top:24px;">If you did not request this, you can ignore this email.</p>
            <div style="margin-top:32px;text-align:center;color:#aaa;font-size:0.9em;">&mdash; The NETSPHERE Team</div>
        </div>
    `;

    try {
        await sendBrevoEmail({ 
            to: email, 
            subject, 
            htmlContent, 
            textContent 
        });
        console.log('✅ Verification email sent successfully to:', email);
    } catch (error) {
        console.error('❌ Error sending verification email:', error);
        throw error;
    }
}

export async function sendPasswordResetEmail(email, token) {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    
    const subject = 'Reset Your NETSPHERE Password';
    const textContent = `Reset Your NETSPHERE Password\n\nHi there,\n\nWe received a request to reset your NETSPHERE password. Click the link below or copy and paste it into your browser to set a new password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you did not request this, you can safely ignore this email.\n\n— The NETSPHERE Team`;
    const htmlContent = `
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
    `;

    try {
        await sendBrevoEmail({ 
            to: email, 
            subject, 
            htmlContent, 
            textContent 
        });
        console.log('✅ Password reset email sent successfully to:', email);
    } catch (error) {
        console.error('❌ Error sending password reset email:', error);
        throw error;
    }
}

export async function sendMail(to, subject, text, html) {
    try {
        await sendBrevoEmail({ 
            to, 
            subject, 
            htmlContent: html, 
            textContent: text 
        });
        console.log('✅ Email sent successfully to:', to);
    } catch (error) {
        console.error('❌ Error sending email:', error);
        throw error;
    }
}