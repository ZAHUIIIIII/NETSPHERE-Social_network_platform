# NETSPHERE Deployment Guide

## Architecture
- **Client**: Deployed on Vercel (React + Vite)
- **Server**: Deployed on Railway (Express + Node.js)

## Railway Deployment

### Required Environment Variables
Make sure to set these in your Railway dashboard:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# JWT & Security
JWT_SECRET=your_jwt_secret

# Email Service (Nodemailer)
EMAIL_USER=your_email
EMAIL_PASS=your_email_password

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=your_railway_url/api/auth/google/callback

# Environment
NODE_ENV=production
PORT=5001
CLIENT_URL=https://netsphere-nine.vercel.app
```

### Deployment Steps

1. **Connect Repository**: Link your GitHub repository to Railway

2. **Configure Build**: Railway will automatically detect the `nixpacks.toml` and `start.sh` files

3. **Set Environment Variables**: Add all required variables in Railway dashboard

4. **Deploy**: Railway will build and deploy your server automatically

5. **Update Client**: Update your Vercel deployment's `VITE_API_URL` environment variable to point to your Railway server URL

### Files Created for Deployment

- `start.sh` - Entry point script for starting the server
- `build.sh` - Build script for installing dependencies
- `nixpacks.toml` - Nixpacks configuration for Railway
- `railway.json` - Railway-specific deployment configuration
- `.railwayignore` - Files to exclude from deployment
- `package.json` (root) - Root package manager for monorepo

### Health Check
The server exposes a health check endpoint at `/api/health` that Railway uses to monitor server status.

### Port Configuration
The server listens on `0.0.0.0:${PORT}` where PORT is provided by Railway (default: 5001).

## Troubleshooting

### Build Fails
- Check Railway logs for specific error messages
- Ensure all dependencies in `server/package.json` are correctly specified
- Verify Node.js version compatibility (>=18.0.0)

### Runtime Errors
- Verify all environment variables are set
- Check MongoDB connection string is correct
- Ensure Cloudinary credentials are valid
- Verify Google OAuth callback URL matches Railway URL

### CORS Issues
- Update the `CLIENT_URL` environment variable
- Check CORS configuration in `server/src/index.js`
- Ensure Vercel deployment URL is whitelisted

## Support
For issues, check:
- Railway logs: `railway logs`
- Server health: `https://your-railway-url.railway.app/api/health`
- MongoDB connection status in logs
