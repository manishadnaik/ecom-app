# API Reference

RESTful API for the **nodejs-ecom** e-commerce platform.

- **Base URL:** `http://localhost:3000/api/v1`
- **Content-Type:** `application/json`
- **Auth:** None currently required

This reference mirrors the live implementation in `src/routes`, `src/controllers`,
`src/services`, and `src/validators`. Every endpoint below includes a **Postman**
setup and a **cURL** example.

---

## Table of Contents

1. [Common Response Formats](#common-response-formats)
2. [Status Codes](#status-codes)
3. [Customers](#customers)
4. [Products](#products)
5. [Orders](#orders)
6. [Natural Language Query](#natural-language-query)

---

## Common Response Formats

| Shape | Used by |
|---|---|
| `{ "status": "success", "data": [...], "rowCount": N }` | List endpoints (some include `rowCount`) |
| `{ "status": "success", "data": {...} }` | Single-resource endpoints |
| `{ "message": "...", "order": {...} }` | `POST /orders` (custom success shape) |
| `{ "error": "message", "field": "fieldName" }` | Structured 400/404 error from controllers |
| `{ "status": "error", "errors": [{ "field": "...", "message": "..." }] }` | Zod validation error (400) |
| `{ "naturalLanguageQuery": "...", "generatedSQL": "...", "results": [...], "rowCount": N }` | `POST /query` |

---

## Status Codes

| Code | Meaning |
|---|---|
| `200` | OK |
| `201` | Created |
| `204` | No Content (successful delete) |
| `400` | Validation / bad request (structured error body) |
| `404` | Resource not found |
| `409` | Conflict (delete blocked by references; order cannot be cancelled) |
| `500` | Server / database error |

---

## Customers

### 1. List all customers

**`GET /api/v1/customers`**

- **Postman:** Method `GET`, URL `http://localhost:3000/api/v1/customers`
- **cURL:**
  ```bash
  curl http://localhost:3000/api/v1/customers
  ```
- **Response `200`:**
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": 1,
        "name": "Alice Johnson",
        "email": "alice.johnson@example.com",
        "phone": "(555) 123-4567",
        "address": "123 Main St, Springfield",
        "created_at": "2026-09-06T10:00:00.000Z",
        "updated_at": "2026-09-06T10:00:00.000Z"
      }
    ]
  }
### 2. Create a customer

**`POST /api/v1/customers`**

- **Postman:** Method `POST`, URL `http://localhost:3000/api/v1/customers`,
  Headers `Content-Type: application/json`, Body &rarr; raw &rarr; JSON:
  ```json
  {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "(555) 999-0000",
    "address": "77 Elm St, Springfield"
  }
  ```
- **cURL:**
  ```bash
  curl -X POST http://localhost:3000/api/v1/customers \
    -H "Content-Type: application/json" \
    -d '{
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "(555) 999-0000",
      "address": "77 Elm St, Springfield"
    }'
  ```
- **Response `201`:** `{ "status": "success", "data": { <created customer> } }`
- **Errors:**
  - `400` duplicate email &rarr; `{ "error": "A customer with this email already exists", "field": "email" }`
  - `400` missing name/email &rarr; `{ "error": "<validation message>", "field": "<field>" }`

### 3. Fetch a single customer

**`GET /api/v1/customers/:id`**

- **Postman:** Method `GET`, URL `http://localhost:3000/api/v1/customers/1`
- **cURL:** `curl http://localhost:3000/api/v1/customers/1`
- **Response `200`:** `{ "status": "success", "data": { <customer> } }`
- **Error `404`:** `{ "error": "Customer not found", "field": "id" }`

### 4. Update a customer

**`PUT /api/v1/customers/:id`**

- **Postman:** Method `PUT`, URL `http://localhost:3000/api/v1/customers/1`,
  Headers `Content-Type: application/json`, Body &rarr; raw &rarr; JSON:
  ```json
  { "phone": "(555) 111-2222", "address": "88 Oak Ave, Shelbyville" }
  ```
- **cURL:**
  ```bash
  curl -X PUT http://localhost:3000/api/v1/customers/1 \
    -H "Content-Type: application/json" \
    -d '{ "phone": "(555) 111-2222" }'
  ```
- **Response `200`:** `{ "status": "success", "data": { <updated customer> } }`
- **Errors:** `404` not found (same shape as get); `400` duplicate email.

### 5. Delete a customer

**`DELETE /api/v1/customers/:id`**

- **Postman:** Method `DELETE`, URL `http://localhost:3000/api/v1/customers/1`
- **cURL:** `curl -X DELETE http://localhost:3000/api/v1/customers/1`
- **Response `204`:** (empty body)
- **Errors:**
  - `404` &rarr; `{ "error": "Customer not found", "field": "id" }`
  - `409` if customer has orders &rarr; `{ "error": "Cannot delete customer: customer has existing orders", "field": "id" }`

---
## Products

### 6. List products (with filters)

**`GET /api/v1/products`**

Query params (validated by `products-search-query.js`):

| Param | Type | Behavior |
|---|---|---|
| `category` | string | filter by category `name` (JOIN on Category) |
| `inStock` | `"true"` / `"false"` | `"true"` &rarr; `stock_quantity > 0`; `"false"` &rarr; `stock_quantity = 0` |

- **Postman:** Method `GET`, URL `http://localhost:3000/api/v1/products?category=Electronics&inStock=true`
  (set params in the **Params** tab)
- **cURL:**
  ```bash
  curl "http://localhost:3000/api/v1/products?category=Electronics&inStock=true"
  ```
- **Response `200`:**
  ```json
  {
    "status": "success",
    "rowCount": 1,
    "data": [
      {
        "id": 1,
        "name": "MacBook Air M3",
        "description": "Apple MacBook Air with M3 chip",
        "category_id": 1,
        "price": "1099.99",
        "stock_quantity": 5,
        "status": "ACTIVE",
        "created_at": "2026-09-06T10:00:00.000Z",
        "updated_at": "2026-09-06T10:00:00.000Z",
        "Category": { "id": 1, "name": "Electronics" }
      }
    ]
  }
  ```

### 7. Create a product

**`POST /api/v1/products`**

- **Postman:** Method `POST`, URL `http://localhost:3000/api/v1/products`,
  Headers `Content-Type: application/json`, Body &rarr; raw &rarr; JSON:
  ```json
  {
    "name": "Wireless Mouse",
    "description": "Ergonomic 2.4GHz wireless mouse",
    "category_id": 1,
    "price": 29.99,
    "stock_quantity": 50,
    "status": "ACTIVE"
  }
  ```
- **cURL:**
  ```bash
  curl -X POST http://localhost:3000/api/v1/products \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Wireless Mouse",
      "description": "Ergonomic 2.4GHz wireless mouse",
      "category_id": 1,
      "price": 29.99,
      "stock_quantity": 50,
      "status": "ACTIVE"
    }'
  ```
- **Response `201`:** `{ "status": "success", "data": { <created product> } }`
- **Errors:** `400` validation (`price`/`stock_quantity` &lt; 0 etc.); `400` non-existent `category_id` &rarr; `{ "error": "The specified category does not exist", "field": "category_id" }`

### 8. Fetch a single product

**`GET /api/v1/products/:id`**

- **Postman:** Method `GET`, URL `http://localhost:3000/api/v1/products/1`
- **cURL:** `curl http://localhost:3000/api/v1/products/1`
- **Response `200`:** `{ "status": "success", "data": { <product + Category> } }`
- **Error `404`:** `{ "error": "Product not found", "field": "id" }`

### 9. Update a product

**`PUT /api/v1/products/:id`**

- **Postman:** Method `PUT`, URL `http://localhost:3000/api/v1/products/1`,
  Headers `Content-Type: application/json`, Body &rarr; raw &rarr; JSON:
  ```json
  { "price": 24.99, "stock_quantity": 45 }
  ```
- **cURL:**
  ```bash
  curl -X PUT http://localhost:3000/api/v1/products/1 \
    -H "Content-Type: application/json" \
    -d '{ "price": 24.99, "stock_quantity": 45 }'
  ```
- **Response `200`:** `{ "status": "success", "data": { <updated product> } }`
- **Errors:** `404` not found; `400` validation / bad `category_id`.

### 10. Delete a product

**`DELETE /api/v1/products/:id`**

- **Postman:** Method `DELETE`, URL `http://localhost:3000/api/v1/products/1`
- **cURL:** `curl -X DELETE http://localhost:3000/api/v1/products/1`
- **Response `204`:** (empty body)
- **Errors:**
  - `404` &rarr; `{ "error": "Product not found", "field": "id" }`
  - `409` if referenced in an order item &rarr; `{ "error": "Cannot delete product: product is referenced in existing order items", "field": "id" }`

---
## Orders

### 11. Create an order

**`POST /api/v1/orders`**

Validated by `create-order.js`:

| Field | Rules |
|---|---|
| `customer_id` | int, positive, **required** |
| `order_date` | ISO date, today or future; defaults to now if omitted |
| `line_items` | array of `{ product_id, quantity }`, **1&ndash;5 items**, `quantity >= 1`, **no duplicate `product_id`** |
| `total_amount` | **rejected** if provided (`z.never`) — amounts are computed server-side |

- **Postman:** Method `POST`, URL `http://localhost:3000/api/v1/orders`,
  Headers `Content-Type: application/json`, Body &rarr; raw &rarr; JSON:
  ```json
  {
    "customer_id": 1,
    "order_date": "2026-09-06T10:00:00.000Z",
    "line_items": [
      { "product_id": 1, "quantity": 2 },
      { "product_id": 4, "quantity": 1 }
    ]
  }
  ```
- **cURL:**
  ```bash
  curl -X POST http://localhost:3000/api/v1/orders \
    -H "Content-Type: application/json" \
    -d '{
      "customer_id": 1,
      "order_date": "2026-09-06T10:00:00.000Z",
      "line_items": [
        { "product_id": 1, "quantity": 2 },
        { "product_id": 4, "quantity": 1 }
      ]
    }'
  ```
- **Behavior:** Validates customer exists and stock is sufficient **inside a managed transaction**; deducts stock atomically; returns the populated order with computed `total_amount`.
- **Response `201`:**
  ```json
  {
    "message": "Order created successfully",
    "order": {
      "id": 2,
      "customer_id": 1,
      "status": "PENDING",
      "order_date": "2026-09-06T10:00:00.000Z",
      "total_amount": 2259.97,
      "OrderItems": [
        {
          "id": 3,
          "product_id": 1,
          "quantity": 2,
          "unit_price_at_purchase": "1099.99",
          "Product": {
            "id": 1,
            "name": "MacBook Air M3",
            "price": "1099.99",
            "Category": { "id": 1, "name": "Electronics" }
          }
        },
        {
          "id": 4,
          "product_id": 4,
          "quantity": 1,
          "unit_price_at_purchase": "59.99",
          "Product": {
            "id": 4,
            "name": "Denim Jeans",
            "price": "59.99",
            "Category": { "id": 3, "name": "Clothing" }
          }
        }
      ]
    }
  }
  ```
- **Errors (Zod 400):**
  ```json
  {
    "status": "error",
    "errors": [{ "field": "line_items", "message": "Duplicate product_id not allowed" }]
  }
  ```
- **Errors (business logic):**
  - `404` customer does not exist &rarr; `{ "status": "error", "message": "Customer with id X does not exist." }` (AppError)
  - `404` product(s) do not exist &rarr; `{ "status": "error", "message": "One or more products supplied do not exist." }`
  - `400` insufficient stock &rarr; `{ "status": "error", "message": "Insufficient stock for <name>. Available: N. Requested: M." }`

### 12. List all orders

**`GET /api/v1/orders`**

- **Postman:** Method `GET`, URL `http://localhost:3000/api/v1/orders`
- **cURL:** `curl http://localhost:3000/api/v1/orders`
- **Response `200`:** `{ "status": "success", "rowCount": N, "data": [ <orders with items + total_amount> ] }`

### 13. Fetch a single order

**`GET /api/v1/orders/:id`**

- **Postman:** Method `GET`, URL `http://localhost:3000/api/v1/orders/1`
- **cURL:** `curl http://localhost:3000/api/v1/orders/1`
- **Response `200`:** order object with nested `OrderItems` &rarr; `Product` &rarr; `Category`, plus computed `total_amount`
- **Error `404`:** `{ "error": "Order not found", "field": "id" }`

### 14. Cancel an order (restores stock)

**`DELETE /api/v1/orders/:id`**

Cancellation is allowed only for `PENDING` or `CONFIRMED` orders. It updates the
status to `CANCELLED`, sets `cancelled_at`, and **restores product stock** inside
a transaction.

- **Postman:** Method `DELETE`, URL `http://localhost:3000/api/v1/orders/1`
- **cURL:** `curl -X DELETE http://localhost:3000/api/v1/orders/1`
- **Response `200`:** `{ "status": "success", "data": { <cancelled order> } }`
- **Errors:**
  - `404` &rarr; `{ "status": "error", "message": "Order with id X does not exist." }`
  - `409` already SHIPPED/DELIVERED/CANCELLED &rarr; `{ "status": "error", "message": "Order with id X cannot be cancelled as its already in <STATUS> state." }`

---
## Natural Language Query

### 15. Text-to-SQL query

**`POST /api/v1/query`**

Sends a natural-language question to an LLM (Gemini), which generates SQL executed
against the database. The `query` field is required.

- **Postman:** Method `POST`, URL `http://localhost:3000/api/v1/query`,
  Headers `Content-Type: application/json`, Body &rarr; raw &rarr; JSON:
  ```json
  {
    "query": "Find all products that are out of stock"
  }
  ```
- **cURL:**
  ```bash
  curl -X POST http://localhost:3000/api/v1/query \
    -H "Content-Type: application/json" \
    -d '{ "query": "Find all products that are out of stock" }'
  ```
- **Response `200`:**
  ```json
  {
    "naturalLanguageQuery": "Find all products that are out of stock",
    "generatedSQL": "SELECT id, name, price, stock_quantity FROM products WHERE stock_quantity <= 0;",
    "results": [
      { "id": 1, "name": "MacBook Air M3", "price": "1099.99", "stock_quantity": 0 }
    ],
    "rowCount": 1
  }
  ```
- **Error `500`:** `{ "success": false, "error": "<message>" }`
  ```