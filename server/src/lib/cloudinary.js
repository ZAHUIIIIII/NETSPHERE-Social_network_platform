import {v2 as cloudinary} from 'cloudinary';
import {config} from 'dotenv';

config();

// Verify Cloudinary credentials are loaded
const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
const api_key = process.env.CLOUDINARY_API_KEY;
const api_secret = process.env.CLOUDINARY_API_SECRET;

if (!cloud_name || !api_key || !api_secret) {
    console.error('❌ Cloudinary credentials missing!');
    console.error('CLOUDINARY_CLOUD_NAME:', cloud_name ? '✅' : '❌');
    console.error('CLOUDINARY_API_KEY:', api_key ? '✅' : '❌');
    console.error('CLOUDINARY_API_SECRET:', api_secret ? '✅' : '❌');
} else {
    console.log('✅ Cloudinary credentials loaded');
}

cloudinary.config({
    cloud_name,
    api_key,
    api_secret,
});

export default cloudinary; // Export configured Cloudinary instance