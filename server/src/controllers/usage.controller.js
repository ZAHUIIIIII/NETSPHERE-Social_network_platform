import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';

/**
 * Get MongoDB database usage statistics
 * Returns normalized data: { name, used, limit, free, percent, breakdown }
 */
export const getDBUsage = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    
    if (!db) {
      return res.status(503).json({
        error: 'Database not connected'
      });
    }

    // Get database statistics
    const stats = await db.stats();
    
    // Get quota limit from environment variable (in MB)
    const quotaLimitMB = parseFloat(process.env.MONGODB_QUOTA_LIMIT_MB || 512);
    const quotaLimitBytes = quotaLimitMB * 1024 * 1024;

    // Calculate used storage (data + indexes)
    const usedBytes = stats.dataSize + stats.indexSize;
    const usedMB = usedBytes / (1024 * 1024);
    const freeMB = quotaLimitMB - usedMB;
    const percentUsed = (usedMB / quotaLimitMB) * 100;

    // Return normalized data
    res.json({
      name: 'MongoDB',
      used: usedMB,
      limit: quotaLimitMB,
      free: Math.max(0, freeMB),
      percent: Math.min(100, percentUsed),
      breakdown: {
        dataSize: stats.dataSize / (1024 * 1024),
        indexSize: stats.indexSize / (1024 * 1024),
        storageSize: stats.storageSize / (1024 * 1024),
        collections: stats.collections,
        objects: stats.objects,
        indexes: stats.indexes
      }
    });
  } catch (error) {
    console.error('MongoDB usage error:', error);
    res.status(500).json({
      error: 'Failed to fetch MongoDB usage'
    });
  }
};

/**
 * Get Cloudinary CDN usage statistics
 * Returns normalized data: { name, used, limit, free, percent, raw }
 */
export const getCDNUsage = async (req, res) => {
  try {
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || 
        !process.env.CLOUDINARY_API_KEY || 
        !process.env.CLOUDINARY_API_SECRET) {
      return res.json(null); // Return null if not configured
    }

    // Get Cloudinary usage using Admin API
    const usage = await cloudinary.api.usage();
    
    // Extract relevant metrics
    const plan = usage.plan || 'Free';
    const credits = usage.credits || {};
    const usedCredits = credits.usage || 0;
    const limitCredits = credits.limit || 25000; // Free plan default
    const freeCredits = Math.max(0, limitCredits - usedCredits);
    const percentUsed = (usedCredits / limitCredits) * 100;

    // Return normalized data
    res.json({
      name: 'Cloudinary',
      used: usedCredits,
      limit: limitCredits,
      free: freeCredits,
      percent: Math.min(100, percentUsed),
      raw: {
        plan: plan,
        credits: usedCredits,
        storage: usage.resources || 0,
        bandwidth: usage.bandwidth?.usage || 0,
        transformations: usage.transformations?.usage || 0,
        lastUpdated: usage.last_updated || new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Cloudinary usage error:', error);
    
    // Return null instead of error if Cloudinary is not configured
    if (error.message?.includes('Must supply api_key')) {
      return res.json(null);
    }
    
    res.status(500).json({
      error: 'Failed to fetch Cloudinary usage'
    });
  }
};
