// Quick test to Gmail
import 'dotenv/config';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

const payload = {
    sender: {
        name: 'NETSPHERE Verification',
        email: 'leeminhuy47@gmail.com'
    },
    to: [{ email: 'dualeo.nature@gmail.com' }],
    subject: '🎉 NETSPHERE - Email Test Successful!',
    htmlContent: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;background:#f9f9f9;border-radius:12px;">
            <h2 style="color:#4f46e5;">✅ Success!</h2>
            <p>Hi there,</p>
            <p><strong>Your Brevo email is working perfectly!</strong></p>
            <p>This email was sent from your NETSPHERE app on Render.</p>
            <div style="background:#e0f2fe;padding:15px;border-radius:8px;margin:20px 0;">
                <p style="margin:0;"><strong>📧 Check these folders:</strong></p>
                <ul style="margin:10px 0;">
                    <li>Inbox (should be here)</li>
                    <li>Spam/Junk (check if not in inbox)</li>
                    <li>Promotions tab (Gmail)</li>
                </ul>
            </div>
            <p style="color:#888;font-size:0.95em;margin-top:24px;">If you see this, your verification emails will work too!</p>
            <div style="margin-top:32px;text-align:center;color:#aaa;font-size:0.9em;">&mdash; The NETSPHERE Team</div>
        </div>
    `,
    textContent: 'Success! Your Brevo email integration is working perfectly!'
};

const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json'
    },
    body: JSON.stringify(payload)
});

const data = await response.json();
console.log('✅ Email sent to Gmail:', data.messageId);
console.log('📧 Check: dualeo.nature@gmail.com');
console.log('🔍 Also check SPAM folder!');
console.log('📊 View in dashboard: https://app.brevo.com/statistics/email');
