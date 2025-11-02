import { v2 as cloudinary } from 'cloudinary';

/**
 * Cloudinary Usage Service
 * Fetches usage statistics from Cloudinary Admin API
 * Implements 10-minute caching to avoid rate limits
 */

// Cache storage
let cachedData = null;
let cacheTimestamp = null;
const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Parse plan information from Cloudinary usage response
 * @param {Object} usage - Raw Cloudinary usage object
 * @returns {string} Plan name
 */
const getPlanName = (usage) => {
  if (usage.plan === 'Free') return 'Free';
  if (usage.plan === 'Plus') return 'Plus';
  if (usage.plan === 'Advanced') return 'Advanced';
  return usage.plan || 'Unknown';
};

/**
 * Fetch Cloudinary usage statistics
 * Returns normalized usage data with caching
 * 
 * @returns {Promise<Object>} Normalized usage data
 * @throws {Error} If Cloudinary API call fails
 */
export const getCloudinaryUsage = async () => {
  try {
    // Check cache validity
    const now = Date.now();
    if (cachedData && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION_MS)) {
      return cachedData;
    }

    // Fetch usage from Cloudinary Admin API
    const usage = await new Promise((resolve, reject) => {
      cloudinary.api.usage((error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });

    // Extract plan information
    const plan = getPlanName(usage);

    // Parse credits (primary quota metric for Cloudinary)
    const creditsUsed = usage.credits?.usage || 0;
    const creditsLimit = usage.credits?.limit || 0;
    const creditsFree = Math.max(creditsLimit - creditsUsed, 0);
    const creditsPercent = creditsLimit > 0 
      ? Math.round((creditsUsed / creditsLimit) * 100 * 100) / 100 
      : 0;

    // Parse storage
    const storageUsed = usage.storage?.usage || 0;
    const storageLimit = usage.storage?.limit || 0;

    // Parse bandwidth
    const bandwidthUsed = usage.bandwidth?.usage || 0;
    const bandwidthLimit = usage.bandwidth?.limit || 0;

    // Parse transformations
    const transformationsUsed = usage.transformations?.usage || 0;
    const transformationsLimit = usage.transformations?.limit || 0;

    // Parse requests (API calls)
    const requestsUsed = usage.requests?.usage || 0;
    const requestsLimit = usage.requests?.limit || 0;

    // Normalize response (using credits as primary metric)
    const normalizedData = {
      name: `Cloudinary (${plan})`,
      used: creditsUsed,
      limit: creditsLimit,
      free: creditsFree,
      percent: creditsPercent,
      raw: {
        plan,
        credits: {
          used: creditsUsed,
          limit: creditsLimit,
          free: creditsFree,
          percent: creditsPercent
        },
        storage: {
          used: storageUsed,
          limit: storageLimit,
          free: Math.max(storageLimit - storageUsed, 0),
          percent: storageLimit > 0 
            ? Math.round((storageUsed / storageLimit) * 100 * 100) / 100 
            : 0
        },
        bandwidth: {
          used: bandwidthUsed,
          limit: bandwidthLimit,
          free: Math.max(bandwidthLimit - bandwidthUsed, 0),
          percent: bandwidthLimit > 0 
            ? Math.round((bandwidthUsed / bandwidthLimit) * 100 * 100) / 100 
            : 0
        },
        transformations: {
          used: transformationsUsed,
          limit: transformationsLimit,
          free: Math.max(transformationsLimit - transformationsUsed, 0),
          percent: transformationsLimit > 0 
            ? Math.round((transformationsUsed / transformationsLimit) * 100 * 100) / 100 
            : 0
        },
        requests: {
          used: requestsUsed,
          limit: requestsLimit,
          free: Math.max(requestsLimit - requestsUsed, 0),
          percent: requestsLimit > 0 
            ? Math.round((requestsUsed / requestsLimit) * 100 * 100) / 100 
            : 0
        }
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
    
    throw new Error(`Failed to fetch Cloudinary usage: ${error.message}`);
  }
};

/**
 * Clear the cache manually (useful for testing or force refresh)
 */
export const clearCloudinaryCache = () => {
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
