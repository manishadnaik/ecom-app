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
- Products: `GET /products` (category + inStock filter, X-Cache HIT/MISS via node-cache 60s), `GET /:id`, `POST/PUT/DELETE` invalidate cache
- Categories: `GET /categories` → `[{id, name, productCount}]` (LEFT JOIN count, cached 60s, powers dropdowns)
- Orders: `POST /orders` (transaction + row lock, no oversell), `GET /orders`, `DELETE /:id` cancel restores stock (409 if shipped)
- NL query: `POST /query` Gemini Text-to-SQL, strict rate limit 10/15min
- Health: `GET /api/v1/health` (uptime, pid, node, memory) - used by compose + k8s probes
- Safety: global rate limit 200/15min, order create 30/min, graceful shutdown (SIGTERM), trust proxy for real IP
- Logging: no console.log in request path (services/controllers) - only server boot + seed scripts log
- Tests: `npm test -w node-api` (node --test + supertest, no DB needed) - 4 tests: query 429 block, rate headers, cache MISS->HIT, invalidate on write

```bash
npm test -w node-api
# ✔ queryLimiter: first 10 pass, 11th is 429 with Retry-After
# ✔ globalLimiter: sends RateLimit headers
# ✔ cacheGet: 1st MISS runs handler, 2nd HIT skips it
# ✔ invalidateProducts: POST clears cache so next GET is MISS
```

### react-ui (`apps/react-ui`)

- S1 Products catalog: MUI card grid, category dropdown with counts e.g. Electronics (8) kept in URL ?category=, stock chips
- S2 Product detail: Details button expands description/stock/status inline on card
- Products CRUD: Add/Edit dialog with category title dropdown (saves id), Delete confirm (409 if in orders), toast + refetch
- S3/S4 Orders: table + status chip, cancel with confirm dialog, toast + refetch, 409 shown plainly
- S5 Customers: table + Add/Edit dialog (name/email required), delete confirm, 409 has-orders + 400 duplicate email shown from backend
- S6 Query console: example prompts, shows generated SQL + result table, friendly 429 message
- Shell: AppBar nav (Products/Orders/Customers/Query), shared Loading/ErrorBox/Empty, Context toasts (no redux), useApi hook (no react-query)
