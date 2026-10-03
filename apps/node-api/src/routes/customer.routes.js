import { Router } from 'express';
import * as customerController from '../controllers/customer.js';
import { validate } from '../middlewares/validate.js';
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerIdParamSchema,
} from '../validators/customer.js';

/**
 * /api/v1/customers
 *
 *   GET    /          — list all customers
 *   POST   /          — create a new customer
 *   GET    /:id       — get a single customer
 *   PUT    /:id       — update a customer
 *   DELETE /:id       — delete a customer (blocked if orders exist)
 */
const router = Router();

// Collection-level routes
router.route('/')
  .get(customerController.getAll)
  .post(validate(createCustomerSchema), customerController.create);

// Single-resource routes
router.param('id', validate(customerIdParamSchema, 'params'));
router.route('/:id')
  .get(customerController.getOne)
  .put(validate(updateCustomerSchema), customerController.update)
  .delete(customerController.remove);

export default router;
