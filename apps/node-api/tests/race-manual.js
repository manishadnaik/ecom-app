// Live race demo vs REAL MySQL (for screen-share, not CI).
// Sets a product to stock=1, fires 3 parallel POST /orders, prints who won.
// Your services/order.js FOR UPDATE lock means exactly 1x201 + 2x400.
// Run: node tests/race-manual.js [PRODUCT_ID] [CUSTOMER_ID]
// Env: BASE_URL (default http://localhost:3000), DB_* for stock reset via API? No -
// stock reset uses sequelize directly so DB creds come from .env like the API.
import sequelize from '../src/config/database.js';
import { Product } from '../src/models/index.js';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const productId = Number(process.argv[2]) || 1;
const customerId = Number(process.argv[3]) || 1;

const product = await Product.findByPk(productId);
if (!product) {
  console.error(`Product #${productId} not found. Usage: node tests/race-manual.js [PRODUCT_ID] [CUSTOMER_ID]`);
  await sequelize.close();
  process.exit(1);
}
await product.update({ stock_quantity: 1 });
console.log(`Stock for product #${productId} (${product.name}) reset to 1.`);

const payload = { customer_id: customerId, line_items: [{ product_id: productId, quantity: 1 }] };
const results = await Promise.all(
  [1, 2, 3].map(async (i) => {
    const r = await fetch(`${BASE}/api/v1/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await r.text();
    return { attempt: i, status: r.status, body: body.slice(0, 160) };
  })
);
results.forEach((r) => console.log(`attempt ${r.attempt}: ${r.status} ${r.body}`));
const wins = results.filter((r) => r.status === 201).length;
console.log(wins === 1 ? 'RACE OK: exactly 1 winner (lock works)' : `UNEXPECTED: ${wins} winners`);

// restore some stock so demo data stays usable
await product.reload();
await product.update({ stock_quantity: Math.max(product.stock_quantity, 5) });
await sequelize.close();
