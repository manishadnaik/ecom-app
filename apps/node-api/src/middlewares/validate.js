import z from 'zod'

/**
 * Validation middleware wrapper around a Zod schema.
 *
 * Usage:
 *   validate(schema)                        → validates req.body
 *   validate(schema, 'body')                → validates req.body (default)
 *   validate(schema, 'params')              → validates req.params
 *   validate(schema, 'query')               → validates req.query
 *
 * On failure it returns a 400 with a structured, per-field error list:
 *   { "status": "error", "errors": [{ "field": "...", "message": "..." }] }
 */
export const validate = (schema, source = 'body') => async (req, res, next) => {
  try {
    // parseAsync handles your database checks cleanly
    const valueToValidate = source === 'body'
      ? req.body
      : source === 'params'
        ? req.params
        : req.query;

    const validatedValue = await schema.parseAsync(valueToValidate);

    // Replace the original value with the strictly typed, sanitized data
    if (source === 'body') {
      req.body = validatedValue;
    } else if (source === 'params') {
      req.params = validatedValue;
    } else {
      req.query = validatedValue;
    }
    return next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Use safe navigation or fallback to an empty array / single message
      const errorIssues = error.errors || error.issues || [];

      return res.status(400).json({
        status: "error",
        errors: errorIssues.length > 0
          ? errorIssues.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
          : [{ field: "validation", message: error.message }] // Fallback if empty
      });
    }
    next(error);
  }
};
