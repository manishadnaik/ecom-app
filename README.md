# my-app-monorepo

Monorepo for ecom interview prep. Vanilla JS only (no TypeScript).

## Layout

- `apps/node-api` - Express 5 + Sequelize 6 + MySQL API (auth-free admin API)
- `apps/react-ui` - Vite + React 18 + MUI 7 UI (vanilla JSX)
- `packages/common-lib` - shared constants + validators (not deployed)
- `k8s/` - api + ui Deployment + Service YAML
- `docker-compose.yml` - local mysql + api (ui optional via profile)

## Quick start

```bash
npm install
npm run dev:api   # http://localhost:3000/api/v1/health
npm run dev:ui    # http://localhost:5173 (proxies /api to :3000)
```

Docker:

```bash
docker compose up --build
docker compose --profile ui up --build  # also serves UI on :8080
```

## Features

### node-api (`apps/node-api`)

- Customers CRUD: `GET/POST /customers`, `GET/PUT/DELETE /customers/:id` (zod validate, 409 delete when orders exist, 400 duplicate email)
- Products: `GET /products?category=&inStock=&page=1&limit=12` (paginated `findAndCountAll`, meta `{total,page,limit,totalPages}`, X-Cache HIT/MISS 60s), `GET /products/export?format=csv` (streamed CSV download, 500/page backpressure, see docs/streaming.md), `GET /:id`, `POST/PUT/DELETE` invalidate cache, `POST /:id/image` upload (multer 5MB images-only → `/uploads`, served via express.static, 400 on bad type/size)
- Categories: `GET /categories` → `[{id, name, productCount}]` (LEFT JOIN count, cached 60s, powers dropdowns)
- Orders: `POST /orders` (transaction + row lock, no oversell), `GET /orders`, `DELETE /:id` cancel restores stock (409 if shipped)
- Race demo: `node tests/race-manual.js [PRODUCT_ID] [CUSTOMER_ID]` resets stock to 1, fires 3 parallel real orders (expect 1x201 + 2x400), restores stock to 5
- NL query: `POST /query` Gemini Text-to-SQL, strict rate limit 10/15min
- Health: `GET /api/v1/health` (uptime, pid, node, memory) - used by compose + k8s probes
- Safety: global rate limit 200/15min, order create 30/min, graceful shutdown (SIGTERM), trust proxy for real IP
- Logging: no console.log in request path (services/controllers) - only server boot + seed scripts log
- Tests: `npm test -w node-api` (node --test + supertest, no DB needed) - 7 tests: query 429 block, rate headers, cache MISS->HIT, invalidate on write, race locked 1-win, race unlocked oversell, stream CSV export
- Express 5 note: `req.query`/`req.params` are getter-only - validate() stores parsed values on `req.validated.query/params` instead of overwriting

```bash
npm test -w node-api
# ✔ queryLimiter: first 10 pass, 11th is 429 with Retry-After
# ✔ globalLimiter: sends RateLimit headers
# ✔ cacheGet: 1st MISS runs handler, 2nd HIT skips it
# ✔ invalidateProducts: POST clears cache so next GET is MISS
# ✔ race: locked stock=1, 5 parallel -> exactly 1 wins
# ✔ race: unlocked (no lock) oversells -> all 5 win, stock goes negative
# ✔ stream: CSV export sends header + all rows as download
```

### react-ui (`apps/react-ui`)

- S1 Products catalog: MUI card grid (9/page) with real image first (`image_url`: /uploads file at API root or remote URL, vite proxies /uploads in dev), placeholder fallback (placehold.co/picsum), category dropdown with counts, Pagination + page-in-URL, stock chips, Export CSV button (streams full filtered catalog as download)
- S2 Product detail: Details button expands description/stock/status inline on card
- Products CRUD: Add/Edit dialog with category dropdown + Image URL field + file picker (file upload wins, max 5MB images-only), Delete confirm (409 if in orders), toast + refetch
- S3 Orders create: New order dialog (customer dropdown + up to 5 line items with stock hints, duplicate/empty guarded client-side, 400 stock/404 customer/429 shown from backend), toast + refetch
- S4 Orders list/update: table + status chip, Status dialog (PENDING/CONFIRMED/SHIPPED/DELIVERED via PUT), cancel with confirm (DELETE restores stock, 409 if shipped), toast + refetch
- S5 Customers: table + Add/Edit dialog (name/email required), delete confirm, 409 has-orders + 400 duplicate email shown from backend
- S6 Query console: example prompts, shows generated SQL + result table, friendly 429 message
- Shell: AppBar nav (Products/Orders/Customers/Query), shared Loading/ErrorBox/Empty, Context toasts (no redux), useApi hook (no react-query)
