import { Router } from 'express';
import customerRoutes from './customer.routes.js';
import productRoutes from './product.routes.js';
import categoryRoutes from './category.routes.js';
import orderRoutes from './order.js';
import searchRoutes from './search.js';
import healthRoutes from './health.js';

/**
 * Main API router.
 *
 * All route modules are mounted here.  New route files should be
 * imported and registered below.
 */
const router = Router();

// Feature route modules
router.use('/health', healthRoutes);
router.use('/customers', customerRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/orders', orderRoutes);
router.use('/query', searchRoutes);
export default router;

