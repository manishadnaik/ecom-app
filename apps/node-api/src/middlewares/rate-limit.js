import rateLimit from 'express-rate-limit';

// Global: protects all routes from brute force. High limit so normal UI never hits it.
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  limit: 200,
  standardHeaders: true, // RateLimit-Limit / Remaining / Reset
  legacyHeaders: false,
  message: { status: 'error', message: 'Too many requests, please try again later.' },
});

// Strict: LLM endpoint costs money per call. 10 per 15 min per IP.
// Why express-rate-limit over others: 5-line standard, sends 429+Retry-After,
// upgrades to RedisStore for multi-pod without code change.
export const queryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'Query limit reached (10 per 15 min). Try again later.' },
});

// Medium: prevents order spam / stock abuse.
export const orderLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'Too many order attempts. Slow down.' },
});
