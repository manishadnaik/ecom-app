import { z } from 'zod';

export const createOrderSchema = z.object({
  customer_id: z.number({ required_error: "Customer ID is required" }).int().positive(),
  total_amount: z.never({ message: "total_amount is not allowed/accepted in this request" }).optional(),
  // Order date can be today or future. String check is safer before parsing.
  order_date: z.coerce.date()
    .refine((date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    }, { message: "Order date cannot be in the past" })
    .default(() => new Date()),
  line_items: z.array(
    z.object({
      product_id: z.number().int().positive(),
      quantity: z.number().int().min(1, "Quantity must be at least 1"),
    })
  )
    .min(1, "Order must contain at least 1 item")
    .max(5, "Order cannot exceed 5 line items")
    .refine(items => new Set(items.map(i => i.product_id)).size === items.length,
      { message: "Duplicate product_id not allowed" }),
});
