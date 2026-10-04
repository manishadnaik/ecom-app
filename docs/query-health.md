# Query health — N+1, indexes, and how to prove it (#10)

## N+1: do we have it? (honest answer)
No active N+1. Past risk was `getAllOrders`/`getOrderById`: one query for orders
plus one per row for items/products would have been N+1. Fixed by eager-loading:
`orderInclude()` fetches Order → OrderItems → Product → Category in 1-2 JOINed
queries (see `src/services/order.js`). Same for products (`include: Category`)
and categories (single GROUP BY). Pagination (`findAndCountAll`, 9-12/page) caps
rows so even a JOIN stays small.

## Indexes added (this polish pass)
Declarative `indexes:` in models — Sequelize creates them on `sync()`:

- `products`: `(category_id)` — category JOIN filter on every browse;
  `(status)` — ACTIVE/INACTIVE filter; `(stock_quantity)` — inStock scan.
- `orders`: `(customer_id)` — account page; `(status)` — admin filter;
  `(order_date)` — reports.
- `order_items`: `(order_id)` — cancel flow `WHERE order_id = ?`;
  `(product_id)` — delete-product guard + revenue JOINs. (Unique
  `(order_id, product_id)` already existed.)
- Untouched: `customers.email` / `categories.name` already UNIQUE (indexed by
  MySQL automatically); all PKs indexed by default.

Why these and not more: an index speeds reads but slows every write and costs
disk. Rule used: index FKs + columns in WHERE/JOIN on hot paths, nothing else.
Single-column (not composite) because our filters come one at a time
(`?category=` OR `?status=`); composite `(customer_id, status)` can come later
if an account+status filter proves slow.

## How to prove it (30-second demo)
```sql
EXPLAIN SELECT * FROM orders WHERE customer_id = 5;
-- type: ref, key: customer_id  -> index used, few rows touched
-- without index: type: ALL (full table scan)

EXPLAIN SELECT * FROM products WHERE category_id = 2 AND status = 'ACTIVE';
-- key: category_id, Extra: Using where -> seeks category slice, then filters
```
In dev: `SET profiling = 1; <query>; SHOW PROFILES;` before/after `DROP INDEX`
shows the timing gap on 100k+ rows (tiny seed data won't show it — say that).

## What we deliberately did NOT do
- No `SELECT *` without limit (pagination everywhere).
- No per-row queries in loops (all `include:`/JOIN).
- No composite/covering indexes yet — premature until EXPLAIN on real volume
  says otherwise. Interview line: "measure, then index."
