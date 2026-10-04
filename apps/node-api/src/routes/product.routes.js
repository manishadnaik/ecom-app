import { Router } from 'express';
import * as productController from '../controllers/product.js';
import { cacheGet, invalidateProducts } from '../middlewares/cache.js';
import { validate } from '../middlewares/validate.js';
import { productQuerySchema } from '../validators/products-search-query.js';
import { uploadProductImage } from '../middlewares/upload.js';

/**
 * /api/v1/products
 *
 *   GET    /          — list products (supports ?category= and ?inStock=true) [CACHED 60s]
 *   POST   /          — create a new product [invalidates cache]
 *   GET    /:id       — get a single product
 *   PUT    /:id       — update a product [invalidates cache]
 *   DELETE /:id       — delete a product (blocked if referenced in order items)
 *   POST   /:id/image — upload product image (multipart field "image") [invalidates cache]
 */
const router = Router();

// Collection-level routes
router.route('/')
  .get(validate(productQuerySchema, 'query'), cacheGet('products', 60), productController.getAll)
  .post(invalidateProducts, productController.create);

// Single-resource routes
router.route('/:id')
  .get(cacheGet('products', 60), productController.getOne)
  .put(invalidateProducts, productController.update)
  .delete(invalidateProducts, productController.remove);

// Image upload (multipart/form-data, field "image")
router.post('/:id/image', uploadProductImage, invalidateProducts, productController.uploadImage);

export default router;
