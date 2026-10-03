// P1 proof: rate-limit actually blocks. No DB needed - we mount the REAL
// queryLimiter on a fake route, hammer it 11 times, 11th must be 429.
// Run: npm test -w node-api  (uses node --test, no extra framework)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import { queryLimiter, globalLimiter } from '../src/middlewares/rate-limit.js';

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.post('/fake-query', queryLimiter, (req, res) => res.json({ ok: true }));
  app.get('/fake-health', globalLimiter, (req, res) => res.json({ ok: true }));
  return app;
};

test('queryLimiter: first 10 pass, 11th is 429 with Retry-After', async () => {
  const app = buildApp();
  for (let i = 0; i < 10; i++) {
    const r = await request(app).post('/fake-query').send({ query: 'test' });
    assert.equal(r.status, 200, `request ${i + 1} should pass`);
  }
  const blocked = await request(app).post('/fake-query').send({ query: 'test' });
  assert.equal(blocked.status, 429);
  // standardHeaders + Retry-After prove express-rate-limit did it
  assert.ok(blocked.headers['ratelimit-limit'], 'has RateLimit-Limit header');
  assert.ok(blocked.headers['retry-after'], 'has Retry-After header');
  assert.match(JSON.stringify(blocked.body), /Query limit reached/);
});

test('globalLimiter: sends RateLimit headers on normal request', async () => {
  const app = buildApp();
  const r = await request(app).get('/fake-health');
  assert.equal(r.status, 200);
  assert.ok(r.headers['ratelimit-limit'], 'has RateLimit-Limit header');
  assert.ok(r.headers['ratelimit-remaining'], 'has RateLimit-Remaining header');
});
