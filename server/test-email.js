// Test Brevo Email Integration
// Run this to verify email is working: node test-email.js

import 'dotenv/config';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

async function testBrevoEmail() {
    console.log('🧪 Testing Brevo Email Integration...\n');

    // Check environment variables
    if (!process.env.BREVO_API_KEY) {
        console.error('❌ BREVO_API_KEY not found in .env file');
        console.log('📝 Please add: BREVO_API_KEY=xkeysib-your-key-here');
        process.exit(1);
    }

    console.log('✅ BREVO_API_KEY found');
    console.log(`   Key: ${process.env.BREVO_API_KEY.substring(0, 15)}...`);

    // Test email payload
    const payload = {
        sender: {
            name: 'NETSPHERE Test',
            email: process.env.EMAIL_FROM || 'noreply@netsphere.com'
        },
        to: [{ email: 'leeminhuy47@gmail.com' }], // Your email
        subject: 'Test Email from NETSPHERE',
        htmlContent: `
            <div style="font-family:sans-serif;padding:20px;background:#f5f5f5;border-radius:10px;">
                <h2 style="color:#4f46e5;">🎉 Success!</h2>
                <p>Your Brevo email integration is working perfectly!</p>
                <p>You can now:</p>
                <ul>
                    <li>Send verification emails</li>
                    <li>Send password reset emails</li>
                    <li>Send to ANY email address</li>
                    <li>Work on Render Free Tier</li>
                </ul>
                <p style="color:#888;margin-top:20px;">— NETSPHERE Team</p>
            </div>
        `,
        textContent: 'Success! Your Brevo email integration is working perfectly!'
    };

    try {
        console.log('\n📤 Sending test email...');
        
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
        
        console.log('\n✅ TEST SUCCESSFUL!');
        console.log('📧 Email sent to: leeminhuy47@gmail.com');
        console.log(`📨 Message ID: ${data.messageId}`);
        console.log('\n💡 Check your inbox (and spam folder)');
        console.log('🎯 View in Brevo dashboard: https://app.brevo.com/statistics/email');
        
    } catch (error) {
        console.error('\n❌ TEST FAILED');
        console.error('Error:', error.message);
        
        if (error.message.includes('Unauthorized')) {
            console.log('\n💡 Troubleshooting:');
            console.log('   1. Check your API key is correct');
            console.log('   2. Get new key: https://app.brevo.com/settings/keys/api');
            console.log('   3. Update .env file with new key');
        }
        
        process.exit(1);
    }
}

testBrevoEmail();
