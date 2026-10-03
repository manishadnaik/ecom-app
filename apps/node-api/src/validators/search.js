import { z } from 'zod';

/**
 * Validator for POST /api/v1/query — natural-language query endpoint.
 *
 * Body:
 *   { "query": "Which products are out of stock?" }
 *
 */
export const searchQuerySchema = z.object({
  query: z
    .string({ required_error: 'Query is required' })
    .trim()
    .min(1, 'Query cannot be empty')
    .max(500, 'Query cannot exceed 500 characters'),
});
