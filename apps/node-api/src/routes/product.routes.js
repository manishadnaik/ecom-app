import { Router } from 'express';
import * as productController from '../controllers/product.js';
import { cacheGet, invalidateProducts } from '../middlewares/cache.js';
import { validate } from '../middlewares/validate.js';
import { productQuerySchema } from '../validators/products-search-query.js';
import { uploadProductImage } from '../middlewares/upload.js';
import { exportCsv, Category } from '../utils/stream-csv.js';

/**
 * /api/v1/products
 *
 *   GET    /          — list products (supports ?category= and ?inStock=true) [CACHED 60s]
 *   GET    /export?format=csv — stream full catalog as CSV download (no pagination, backpressure)
 *   POST   /          — create a new product [invalidates cache]
 *   GET    /:id       — get a single product
 *   PUT    /:id       — update a product [invalidates cache]
 *   DELETE /:id       — delete a product (blocked if referenced in order items)
 *   POST   /:id/image — upload product image (multipart field "image") [invalidates cache]
 */
const router = Router();

// Collection-level routes
// NOTE: /export must sit BEFORE /:id or Express 5 reads "export" as an id.
router.get(
  '/export',
  exportCsv((req) => {
    const category = req.query?.category;
    return {
      where: {},
      include: category
        ? [{ model: Category, where: { name: category }, attributes: ['id', 'name'] }]
        : [{ model: Category, attributes: ['id', 'name'] }],
    };
  })
);
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
