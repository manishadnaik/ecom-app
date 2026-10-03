import { z } from 'zod';

/**
 * Customer validators.
 *
 * Used by the /api/v1/customers routes via the `validate` middleware.
 * Each schema returns a structured list of `{ field, message }` errors on 400.
 */

// Reusable field definitions so create/update stay consistent
const nameField = z
  .string({ required_error: 'Name is required' })
  .trim()
  .min(1, 'Name cannot be empty')
  .max(100, 'Name cannot exceed 100 characters');

const emailField = z
  .string({ required_error: 'Email is required' })
  .trim()
  .min(1, 'Email cannot be empty')
  .email('A valid email is required')
  .max(255, 'Email cannot exceed 255 characters');

const phoneField = z
  .string()
  .trim()
  .max(20, 'Phone cannot exceed 20 characters')
  .regex(/^[0-9+\-() ]*$/, 'Phone can only contain digits, spaces and + - ( )')
  .optional()
  .nullable();

const addressField = z
  .string()
  .trim()
  .max(255, 'Address cannot exceed 255 characters')
  .optional()
  .nullable();

/**
 * POST /api/v1/customers
 * All fields required except the nullable phone/address.
 */
export const createCustomerSchema = z.object({
  name: nameField,
  email: emailField,
  phone: phoneField,
  address: addressField,
});

/**
 * PUT /api/v1/customers/:id
 * All fields optional, but at least one must be provided.
 */
export const updateCustomerSchema = z
  .object({
    name: nameField.optional(),
    email: emailField.optional(),
    phone: phoneField,
    address: addressField,
  })
  .refine((data) => {
    return Object.values(data).some((value) => value !== undefined && value !== null);
  }, { message: 'At least one field (name, email, phone, address) must be provided' });

/**
 * /:id param used by GET, PUT and DELETE.
 * Validates that the id is a positive integer.
 */
export const customerIdParamSchema = z.object({
  id: z.coerce
    .number({ message: 'Customer id must be a number' })
    .int({ message: 'Customer id must be an integer' })
    .positive({ message: 'Customer id must be a positive number' }),
});