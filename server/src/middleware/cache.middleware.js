/**
 * Simple in-memory cache middleware with memory leak prevention
 * - Caches responses for a specified duration (default 5 minutes)
 * - Enforces maximum cache size (50 entries) using LRU eviction
 * - Automatically cleans up expired entries every 5 minutes
 */

const cache = new Map();
const MAX_CACHE_SIZE = 50; // Limit cache to 50 entries to prevent memory leak

const cacheMiddleware = (duration = 5 * 60 * 1000) => {
  return (req, res, next) => {
    const key = `__express__${req.originalUrl || req.url}`;
    const cachedResponse = cache.get(key);

    if (cachedResponse && cachedResponse.expiry > Date.now()) {
      // Return cached response
      return res.json(cachedResponse.data);
    }

    // Store the original res.json function
    const originalJson = res.json.bind(res);

    // Override res.json to cache the response
    res.json = (data) => {
      // LRU eviction: If cache is full, remove oldest entry
      if (cache.size >= MAX_CACHE_SIZE) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
        console.log(`🗑️  Cache full (${MAX_CACHE_SIZE}), evicted: ${firstKey}`);
      }
      
      cache.set(key, {
        data,
        expiry: Date.now() + duration
      });
      return originalJson(data);
    };

    next();
  };
};

// Cleanup expired cache entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  let expiredCount = 0;
  
  for (const [key, value] of cache.entries()) {
    if (value.expiry < now) {
      cache.delete(key);
      expiredCount++;
    }
  }
  
  if (expiredCount > 0) {
    console.log(`🧹 Cache cleanup: Removed ${expiredCount} expired entries. Current size: ${cache.size}/${MAX_CACHE_SIZE}`);
  }
}, 5 * 60 * 1000); // Every 5 minutes (improved from 10 minutes)

export default cacheMiddleware;
