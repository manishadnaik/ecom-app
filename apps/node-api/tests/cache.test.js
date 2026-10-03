// P1 proof: node-cache serves HIT on 2nd identical GET. No DB needed -
// we mount the REAL cacheGet middleware on a fake products route.
// 1st call MISS (runs handler), 2nd call HIT (skips handler).
// Run: npm test -w node-api
import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import { cacheGet, invalidateProducts } from '../src/middlewares/cache.js';

const buildApp = () => {
  const app = express();
  let hits = 0; // counts how many times real handler ran
  app.get('/products', cacheGet('products', 60), (req, res) => {
    hits += 1;
    res.json({ n: hits });
  });
  app.post('/products', invalidateProducts, (req, res) => res.json({ ok: true }));
  app.get('/__hits', (req, res) => res.json({ hits }));
  return app;
};

test('cacheGet: 1st MISS runs handler, 2nd HIT skips it', async () => {
  const app = buildApp();
  const first = await request(app).get('/products?category=X');
  assert.equal(first.status, 200);
  assert.equal(first.headers['x-cache'], 'MISS');
  assert.equal(first.body.n, 1);
  const second = await request(app).get('/products?category=X');
  assert.equal(second.status, 200);
  assert.equal(second.headers['x-cache'], 'HIT');
  assert.equal(second.body.n, 1); // same body, handler did NOT run again
});

test('invalidateProducts: POST clears cache so next GET is MISS', async () => {
  const app = buildApp();
  await request(app).get('/products');
  await request(app).post('/products').send({});
  const after = await request(app).get('/products');
  assert.equal(after.headers['x-cache'], 'MISS');
});

