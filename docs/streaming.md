# Streaming in this project — what, why, and why this solution

## What are Node.js streams? (plain words)
A stream moves data in small pieces instead of loading everything at once.
Four types: **Readable** (DB/file gives data), **Writable** (response/socket takes
data), **Duplex/Transform** (changes data in the middle), connected by
**pipeline()** which also handles backpressure (slow reader pauses the fast writer)
and errors in one place.

## What we built
`GET /api/v1/products/export?format=csv[&category=]` streams the FULL catalog as a
CSV file download:
- `src/utils/stream-csv.js` — async-generator pulls DB pages (500 rows/page) →
  `Readable.from()` → `Transform` formats RFC-4180 CSV lines → `pipeline()` → HTTP.
- `src/routes/product.routes.js` — `/export` mounted BEFORE `/:id` (else Express
  reads "export" as an id). Supports `?category=` filter. Sends
  `Content-Disposition: attachment` so the browser downloads a file.
- `tests/stream.test.js` — asserts headers + all rows + comma/quote escaping.
- Live check: `curl .../products/export?format=csv | head` returns header + rows.

## Why streams here (use cases in THIS app)
1. **Catalog export** (done): admin downloads 1M products without OOM.
2. **Image/video upload** (next): today multer buffers the whole file in memory/disk
   before we touch it. Streaming upload (busboy → Transform resize → S3) keeps
   memory flat for 500MB videos and lets us reject bad files early.
3. **Report generation**: revenue-by-category CSV without `findAll()` blowup.

## Benefits (numbers that matter)
- **Memory flat**: ~500 rows (~200KB) in RAM regardless of catalog size. Naive
  `findAll()` + `join()` holds ALL rows + full CSV string (1M rows ≈ 200MB+).
- **First byte fast**: browser starts downloading in ms (header + page 1), not after
  a 30s query finishes.
- **Backpressure**: slow client (mobile) pauses DB reads automatically — no buffer
  bloat, no crashed server.
- **Composable**: add gzip (`pipeline(..., zlib.createGzip(), res)`) in one line.

## Why THIS solution beats the alternatives
| Alternative | Why we rejected it |
|---|---|
| `findAll()` → build string → `res.send()` | OOM on big catalogs; user waits with blank screen; single 200MB alloc |
| Pagination loop client-side (`?page=1..N`) | N+1 HTTP round-trips, gaps if rows change mid-export, client merges files |
| `csv-stringify` / `fast-csv` npm package | Fine, but 15-line hand Transform shows the concept in interview; zero new dep |
| `sequelize.stream()` / query-streaming | MySQL2 streaming cursors hold a DB connection open for minutes; page-loop releases it between pages, friendlier to pool (max:10) |
| OFFSET pages getting slow at 1M rows | True (deep OFFSET scans). Phase-2: keyset (`WHERE id > last`) — same pipeline, swap the generator |

## How to demo (30 seconds)
```bash
curl -s http://localhost:3000/api/v1/products/export?format=csv | head -n 3
# id,name,category,price,stock_quantity,status
# 1,MacBook Air M3,Electronics,1099.99,5,ACTIVE ...
npm test -w node-api  # ✔ stream: CSV export sends header + all rows
```
Say: "Readable pages the DB, Transform formats CSV, pipeline streams with
backpressure — 500 rows in memory whether the catalog is 12 or 1M."
