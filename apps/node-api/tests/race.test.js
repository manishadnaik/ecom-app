// #6 race proof: stock=1 + 5 parallel orders.
// /locked serializes via a JS mutex (stands in for MySQL SELECT ... FOR UPDATE
// in services/order.js). /unlocked does naive read-check-write (the bug).
// Expect: locked -> exactly 1x201 + 4x400. unlocked -> 5x201 (oversell).
// Run: npm test -w node-api (node --test + supertest, no DB/server).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';

// tiny mutex: queue() runs fn exclusively, like a row lock would.
const makeMutex = () => {
  let tail = Promise.resolve();
  return (fn) => {
    const run = tail.then(fn, fn);
    tail = run.catch(() => {});
    return run;
  };
};

const buildApp = () => {
  const app = express();
  app.use(express.json());
  let lockedStock = 1;
  let unlockedStock = 1;
  const lock = makeMutex();
  const work = () => new Promise((r) => setTimeout(r, 10)); // force overlap window

  app.post('/locked', (req, res) => {
    lock(async () => {
      await work();
      if (lockedStock < 1) return res.status(400).json({ error: 'Insufficient stock' });
      lockedStock -= 1;
      return res.status(201).json({ ok: true });
    }).catch(() => {
      if (!res.headersSent) res.status(500).json({ error: 'lock failed' });
    });
  });

  app.post('/unlocked', async (req, res) => {
    const seen = unlockedStock; // read BEFORE async gap -> stale for all 5
    await work();
    if (seen < 1) return res.status(400).json({ error: 'Insufficient stock' });
    unlockedStock -= 1;
    return res.status(201).json({ ok: true });
  });

  app.get('/__stock', (req, res) => res.json({ lockedStock, unlockedStock }));
  return app;
};

test('race: locked stock=1, 5 parallel -> exactly 1 wins', async () => {
  const app = buildApp();
  const results = await Promise.all(
    Array.from({ length: 5 }, () => request(app).post('/locked'))
  );
  const wins = results.filter((r) => r.status === 201).length;
  const rejects = results.filter((r) => r.status === 400).length;
  assert.equal(wins, 1, `expected 1 winner, got ${wins}`);
  assert.equal(rejects, 4, `expected 4 rejects, got ${rejects}`);
  const stock = await request(app).get('/__stock');
  assert.equal(stock.body.lockedStock, 0, 'stock must be exactly 0, never negative');
});

test('race: unlocked (no lock) oversells -> all 5 win, stock goes negative', async () => {
  const app = buildApp();
  const results = await Promise.all(
    Array.from({ length: 5 }, () => request(app).post('/unlocked'))
  );
  const wins = results.filter((r) => r.status === 201).length;
  assert.equal(wins, 5, 'without lock every parallel order wins (the bug)');
  const stock = await request(app).get('/__stock');
  assert.ok(stock.body.unlockedStock < 0, `stock went negative: ${stock.body.unlockedStock}`);
});
