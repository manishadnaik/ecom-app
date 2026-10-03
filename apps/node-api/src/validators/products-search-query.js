import z from 'zod';
export const productQuerySchema = z.object({
  category: z.string().optional(),
  // preprocess converts 'true'/'false' strings to actual booleans
  inStock: z
    .preprocess((val) => {
      if (typeof val === 'string') {
        val = val.replace(/['"]/g, '');
      }
      // change to boolean
      if (val === 'true') return true;
      if (val === 'false') return false;

      return val;
    }, z.boolean({ message: "inStock must be 'true' or 'false'" }))
    .optional(),
});