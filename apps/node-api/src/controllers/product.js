import * as productService from '../services/product.js';
import { productQuerySchema } from '../validators/products-search-query.js';

/**
 * Product controller — thin HTTP layer.
 * Delegates all business logic to productService and translates
 * results into HTTP responses with structured error bodies.
 */

const getAll = async (req, res, next) => {
  try {
    const validatedQuery = productQuerySchema.parse(req.query);
    const products = await productService.getAllProducts(validatedQuery);
    res.status(200).json({ status: 'success', rowCount: products.length, data: products});
  } catch (error) {
    next(error);
  }
};

const getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id);

    if (!product) {
      return res.status(404).json({
        status: 'error',
        error: 'Product not found',
        field: 'id',
      });
    }

    res.status(200).json({ status: 'success', data: product });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body);
    res.status(201).json({ status: 'success', data: product });
  } catch (error) {
    // Sequelize validation errors (price < 0, stock < 0, etc.)
    if (error.name === 'SequelizeValidationError') {
      const field = Object.keys(error.errors)[0];
      return res.status(400).json({
        status: 'error',
        error: error.errors[field].message,
        field,
      });
    }
    // Foreign-key violation (non-existent category_id)
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        status: 'error',
        error: 'The specified category does not exist',
        field: 'category_id',
      });
    }
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [updated] = await productService.updateProduct(id, req.body);

    if (!updated) {
      return res.status(404).json({
        status: 'error',
        error: 'Product not found',
        field: 'id',
      });
    }

    const product = await productService.getProductById(id);
    res.status(200).json({ status: 'success', data: product });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      const field = Object.keys(error.errors)[0];
      return res.status(400).json({
        status: 'error',
        error: error.errors[field].message,
        field,
      });
    }
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        status: 'error',
        error: 'The specified category does not exist',
        field: 'category_id',
      });
    }
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 404 if the product doesn't exist
    const product = await productService.getProductById(id);
    if (!product) {
      return res.status(404).json({
        status: 'error',
        error: 'Product not found',
        field: 'id',
      });
    }

    // 409 if the product is referenced in any order items
    const hasOrderItems = await productService.hasOrderItems(id);
    if (hasOrderItems) {
      return res.status(409).json({
        status: 'error',
        error: 'Cannot delete product: product is referenced in existing order items',
        field: 'id',
      });
    }

    await productService.deleteProduct(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export { getAll, getOne, create, update, remove };