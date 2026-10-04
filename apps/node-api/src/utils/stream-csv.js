// #3 Streaming: CSV export without loading all rows into memory.
// Async-generator pages (500/page) -> Transform formats CSV lines ->
// stream.pipeline pushes to HTTP response with backpressure.
// Memory stays flat (~500 rows) even for 1M products. No CSV library needed.
import { Readable, Transform, pipeline } from 'stream';
import { Product, Category } from '../models/index.js';

const PAGE_SIZE = 500;
const CSV_HEADER = 'id,name,category,price,stock_quantity,status\n';

// quote fields containing comma/quote/newline per RFC 4180
const cell = (v) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// pull one DB page at a time until empty - only PAGE_SIZE rows in memory
async function* allProducts(where, include) {
  let page = 0;
  for (;;) {
    const rows = await Product.findAll({
      where,
      include,
      order: [['id', 'ASC']],
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    });
    if (!rows.length) return;
    yield rows;
    if (rows.length < PAGE_SIZE) return;
    page += 1;
  }
}

const toCsvLines = () =>
  new Transform({
    writableObjectMode: true, // receives arrays of products
    transform(chunk, _enc, cb) {
      try {
        const out = chunk
          .map((p) => {
            const j = p.toJSON ? p.toJSON() : p;
            return [j.id, cell(j.name), cell(j.Category?.name), j.price, j.stock_quantity, j.status].join(',') + '\n';
          })
          .join('');
        cb(null, out);
      } catch (e) {
        cb(e);
      }
    },
  });

// Express handler: GET /api/v1/products/export?format=csv[&category=]
// Streams download with Content-Disposition so browser saves a file.
const exportCsv = (buildWhere) => async (req, res, next) => {
  try {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');
    res.write(CSV_HEADER);
    const { where, include } = buildWhere(req);
    const source = Readable.from(allProducts(where, include));
    pipeline(source, toCsvLines(), res, (err) => {
      if (err && !res.headersSent) next(err);
      // client abort mid-download surfaces here - nothing to do, socket is gone
    });
  } catch (error) {
    next(error);
  }
};

export { exportCsv, PAGE_SIZE };
export { Category };
