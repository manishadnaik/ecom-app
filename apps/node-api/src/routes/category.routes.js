import { Router } from 'express';
import * as categoryController from '../controllers/category.js';
import { cacheGet } from '../middlewares/cache.js';

/**
 * /api/v1/categories
 *
 *   GET / — list categories with productCount (cached 60s)
 * Categories are seed-managed, so no POST/PUT/DELETE on purpose.
 */
const router = Router();

router.route('/').get(cacheGet('categories', 60), categoryController.getAll);

export default router;
