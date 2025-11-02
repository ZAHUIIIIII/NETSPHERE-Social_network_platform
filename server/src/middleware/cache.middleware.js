/**
 * Simple in-memory cache middleware
 * Caches responses for a specified duration (default 5 minutes)
 */

const cache = new Map();

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
      cache.set(key, {
        data,
        expiry: Date.now() + duration
      });
      return originalJson(data);
    };

    next();
  };
};

// Cleanup expired cache entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (value.expiry < now) {
      cache.delete(key);
    }
  }
}, 10 * 60 * 1000);

export default cacheMiddleware;
