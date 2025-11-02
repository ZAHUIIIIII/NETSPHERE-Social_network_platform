import mongoose from 'mongoose';

/**
 * MongoDB Usage Service
 * Fetches database statistics and normalizes them for frontend consumption
 * Implements 10-minute caching to reduce database load
 */

// Cache storage
let cachedData = null;
let cacheTimestamp = null;
const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Get configured MongoDB quota limit from environment
 * Default: 512MB (Atlas Free Tier)
 * @returns {number} Limit in bytes
 */
const getMongoDBLimit = () => {
  const limitMB = parseInt(process.env.MONGODB_QUOTA_LIMIT_MB || '512', 10);
  return limitMB * 1024 * 1024; // Convert MB to bytes
};

/**
 * Fetch MongoDB database statistics
 * Returns normalized usage data with caching
 * 
 * @returns {Promise<Object>} Normalized usage data
 * @throws {Error} If database connection fails or stats cannot be retrieved
 */
export const getMongoDBUsage = async () => {
  try {
    // Check cache validity
    const now = Date.now();
    if (cachedData && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION_MS)) {
      return cachedData;
    }

    // Ensure database is connected
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database not connected');
    }

    // Get database name from connection
    const dbName = mongoose.connection.db.databaseName;

    // Fetch db.stats() with scale=1 (bytes)
    const stats = await mongoose.connection.db.stats({ scale: 1 });

    // Calculate usage metrics
    const dataSize = stats.dataSize || 0;
    const indexSize = stats.indexSize || 0;
    const used = dataSize + indexSize; // Quota-counted portion
    const limit = getMongoDBLimit();
    const free = Math.max(limit - used, 0);
    const percent = limit > 0 ? Math.round((used / limit) * 100 * 100) / 100 : 0; // Round to 2 decimals

    // Normalize response
    const normalizedData = {
      name: 'MongoDB',
      used,
      limit,
      free,
      percent,
      breakdown: {
        dataSize,
        indexSize,
        collections: stats.collections || 0,
        objects: stats.objects || 0,
        avgObjSize: stats.avgObjSize || 0,
        storageSize: stats.storageSize || 0
      }
    };

    // Update cache
    cachedData = normalizedData;
    cacheTimestamp = now;

    return normalizedData;

  } catch (error) {
    // Clear cache on error
    cachedData = null;
    cacheTimestamp = null;
    
    throw new Error(`Failed to fetch MongoDB usage: ${error.message}`);
  }
};

/**
 * Clear the cache manually (useful for testing or force refresh)
 */
export const clearMongoDBCache = () => {
  cachedData = null;
  cacheTimestamp = null;
};

/**
 * Check if cache is valid
 * @returns {boolean}
 */
export const isCacheValid = () => {
  if (!cachedData || !cacheTimestamp) return false;
  const now = Date.now();
  return (now - cacheTimestamp) < CACHE_DURATION_MS;
};
