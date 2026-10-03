import NodeCache from 'node-cache';

// In-memory cache. Zero infra needed (Phase-1).
// Phase-2: swap with Redis, keep same get-or-set pattern.
// Why TTL 60s for catalog: products change rarely, read often.
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120, useClones: false });

export default cache;
