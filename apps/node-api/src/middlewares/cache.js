import cache from '../config/cache.js';

// Cache GET responses. Key includes full query string so ?category=X differs from ?category=Y.
// Sets X-Cache: HIT/MISS header so interviewer sees it working in Network tab.
export const cacheGet = (keyPrefix, ttlSeconds = 60) => async (req, res, next) => {
  try {
    const key = `${keyPrefix}:${req.originalUrl}`;
    const hit = cache.get(key);
    if (hit) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(hit);
    }
    // Wrap res.json to store body on first MISS
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode === 200) cache.set(key, body, ttlSeconds);
      res.setHeader('X-Cache', 'MISS');
      return originalJson(body);
    };
    return next();
  } catch {
    return next(); // cache must never break API
  }
};

// Call after POST/PUT/DELETE products to avoid stale catalog.
export const invalidateProducts = (req, res, next) => {
  try {
    for (const k of cache.keys()) {
      if (k.startsWith('products:')) cache.del(k);
    }
  } catch { /* ignore */ }
  return next();
};
