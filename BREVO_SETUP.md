# 🚀 Brevo Email Setup Guide

## Why Brevo?
- ✅ **300 emails/day FREE** (no credit card needed)
- ✅ **Works on Render Free Tier** (no SMTP port blocking)
- ✅ **Send to ANY email address** (no domain verification needed)
- ✅ **Takes 5 minutes to setup**

---

## Step 1: Create Brevo Account

1. Go to **https://www.brevo.com**
2. Click **"Sign up free"**
3. Fill in your details:
   - Email: `leeminhuy47@gmail.com`
   - Password: (choose a strong password)
   - Company name: `NETSPHERE`
4. Verify your email address

---

## Step 2: Get Your API Key

1. After login, go to: **Settings** → **SMTP & API** → **API Keys**
   - Direct link: https://app.brevo.com/settings/keys/api

2. Click **"Create a new API Key"**

3. Name it: `NETSPHERE Production`

4. Copy the API key (starts with `xkeysib-...`)
   - ⚠️ **Important**: Copy it now! You won't see it again

---

## Step 3: Update Environment Variables

### For Local Development:
Open `/server/.env` and update:

```env
BREVO_API_KEY=xkeysib-your-actual-api-key-here
EMAIL_FROM=noreply@netsphere.com
```

### For Render Deployment:
1. Go to your Render dashboard
2. Select your **netsphere** service
3. Go to **Environment** tab
4. Add these environment variables:
   - `BREVO_API_KEY` = `xkeysib-your-actual-api-key-here`
   - `EMAIL_FROM` = `noreply@netsphere.com`
5. Click **"Save Changes"**
6. Render will automatically redeploy

---

## Step 4: Test Email Sending

### Test locally:
```bash
cd server
npm run dev
```

Then try to register a new user - you should receive the verification email!

### Check Brevo Dashboard:
- Go to: https://app.brevo.com/statistics/email
- You'll see all sent emails with delivery status

---

## ✅ What's Changed?

### Old (Gmail SMTP):
```
❌ Uses port 465/587 → Blocked by Render
❌ Connection timeout errors
❌ Required Gmail app password setup
```

### New (Brevo API):
```
✅ Uses HTTPS API (port 443) → Always works
✅ No connection issues
✅ Works on all hosting platforms
✅ 300 emails/day free
✅ Better deliverability
```

---

## 📧 Email Limits

**Free Tier (Forever):**
- 300 emails per day
- 9,000 emails per month
- No credit card required

**Your Current Usage:**
- ~10-15 emails/day (signups + password resets)
- **You're well within limits!** ✅

---

## 🔧 Troubleshooting

### "BREVO_API_KEY is not defined"
- Make sure you added the API key to `.env` file
- Restart your server: `npm run dev`
- For Render: Check Environment variables and redeploy

### "Brevo API Error: Unauthorized"
- Your API key is invalid or expired
- Generate a new API key from Brevo dashboard

### "Sender email not verified"
- This is normal! Brevo doesn't require domain verification
- Emails will still be sent successfully
- The "from" address will show as "via brevo.com"

---

## 📊 Monitor Your Emails

**Brevo Dashboard:**
- Real-time delivery tracking
- Open rates and click rates
- Bounce and complaint reports
- Email logs and history

Access at: https://app.brevo.com/statistics/email

---

## 🎉 You're Done!

Your email system is now:
- ✅ Working on Render Free Tier
- ✅ Sending to any email address
- ✅ Free forever (300 emails/day)
- ✅ More reliable than Gmail SMTP

**Need help?** Contact Brevo support or check their docs:
https://developers.brevo.com/docs
