import { Router } from 'express';
import * as productController from '../controllers/product.js';
import { cacheGet, invalidateProducts } from '../middlewares/cache.js';

/**
 * /api/v1/products
 *
 *   GET    /          — list products (supports ?category= and ?inStock=true) [CACHED 60s]
 *   POST   /          — create a new product [invalidates cache]
 *   GET    /:id       — get a single product
 *   PUT    /:id       — update a product [invalidates cache]
 *   DELETE /:id       — delete a product (blocked if referenced in order items)
 */
const router = Router();

// Collection-level routes
router.route('/')
  .get(cacheGet('products', 60), productController.getAll)
  .post(invalidateProducts, productController.create);

// Single-resource routes
router.route('/:id')
  .get(cacheGet('products', 60), productController.getOne)
  .put(invalidateProducts, productController.update)
  .delete(invalidateProducts, productController.remove);

export default router;
