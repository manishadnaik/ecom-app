// supertest-style test without dependency: boots app, hits health + rate headers.
// Run: node tests/smoke.js (needs DB? No - /health works without DB).
const BASE = process.env.BASE_URL || 'http://localhost:3000';
const get = async (p) => {
  const r = await fetch(`${BASE}${p}`);
  return { status: r.status, headers: Object.fromEntries(r.headers.entries()), body: await r.text() };
};
const health = await get('/api/v1/health');
console.log('health:', health.status, health.body.slice(0, 200));
console.log('rate headers:', health.headers['ratelimit-limit'], health.headers['ratelimit-remaining']);
if (health.status !== 200) process.exit(1);
console.log('SMOKE OK');
