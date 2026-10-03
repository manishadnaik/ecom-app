import { z } from 'zod';
import { ALL_ORDER_STATUS } from '../utils/constants.js';

const STATUS_VALUES = Object.values(ALL_ORDER_STATUS);

/**
 * Validator for PUT /api/v1/orders/:id — update an existing order's status only.
 *
 * Body:
 *   { "status": "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED" }
 */
export const updateOrderSchema = z.object({
  status: z
    .string({ required_error: 'status is required' })
    .refine((value) => STATUS_VALUES.includes(value), {
      message: `status must be one of: ${STATUS_VALUES.join(', ')}`,
    }),
});
