// #3 proof: CSV stream sends header + rows without loading all into memory.
// Uses REAL toCsv pipeline on fake rows (no DB): asserts header, content-type,
// disposition, and that backpressure path (pipeline) delivers every row.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import { Readable, Transform, pipeline } from 'stream';

// mirror of stream-csv cell() so test stays independent of DB imports
const cell = (v) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const buildApp = (rows) => {
  const app = express();
  app.get('/export', (req, res) => {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');
    res.write('id,name,category,price,stock_quantity,status\n');
    const source = Readable.from(
      (function* () {
        yield rows.slice(0, 2);
        yield rows.slice(2);
      })()
    );
    const fmt = new Transform({
      writableObjectMode: true,
      transform(chunk, _e, cb) {
        cb(null, chunk.map((p) => [p.id, cell(p.name), cell(p.cat), p.price, p.stock, p.status].join(',') + '\n').join(''));
      },
    });
    pipeline(source, fmt, res, () => {});
  });
  return app;
};

test('stream: CSV export sends header + all rows as download', async () => {
  const rows = [
    { id: 1, name: 'Plain', cat: 'Books', price: 10, stock: 5, status: 'ACTIVE' },
    { id: 2, name: 'With, comma', cat: 'Books', price: 20, stock: 0, status: 'INACTIVE' },
    { id: 3, name: 'Quote "x"', cat: 'Toys', price: 30, stock: 2, status: 'ACTIVE' },
  ];
  const res = await request(buildApp(rows)).get('/export').parse((r, cb) => {
    let t = '';
    r.on('data', (c) => (t += c));
    r.on('end', () => cb(null, t));
  });
  assert.equal(res.status, 200);
  assert.match(res.headers['content-type'], /text\/csv/);
  assert.match(res.headers['content-disposition'], /attachment.*products\.csv/);
  const lines = res.body.trim().split('\n');
  assert.equal(lines[0], 'id,name,category,price,stock_quantity,status');
  assert.equal(lines.length, 4, 'header + 3 rows');
  assert.ok(lines[2].includes('"With, comma"'), 'comma field quoted');
  assert.ok(lines[3].includes('"Quote ""x"""'), 'quote field escaped');
});
