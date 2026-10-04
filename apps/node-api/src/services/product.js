import { Op } from 'sequelize';
import { Product, Category, OrderItem } from '../models/index.js';

/**
 * Product service — encapsulates all business logic for product
 * operations.
 */

/**
 * Fetch products with optional filtering.
 *
 * Query params:
 *   ?category=<name>  — join on Category and filter by name
 *   ?inStock=true     — only products where stock_quantity > 0
 *
 * @param   {object} query
 *   ?page=1&limit=12  — pagination (limit capped at 100)
 *
 * @param   {object} query
 * @returns {Promise<{rows: Array, count: number, page: number, limit: number, totalPages: number}>}
 */
const getAllProducts = async (query) => {
  const where = {};
  
  if (query.inStock) {
    where.stock_quantity = { [Op.gt]: 0 };
  }
  // If they want items out of stock (inventory = 0)
  if (query.inStock === false) {
    where.stock_quantity = 0;
  }
  const page = query.page ?? 1;
  const limit = query.limit ?? 12;
  const offset = (page - 1) * limit;
  const options = { where, order: [['id', 'ASC']], limit, offset, distinct: true };

  if (query.category) {
    // When category filter is provided, eager-load Category and filter
    options.include = [
      {
        model: Category,
        where: { name: query.category },
        attributes: ['id', 'name'],
      },
    ];
  } else {
    // Always include category so UI shows names without extra calls
    options.include = [{ model: Category, attributes: ['id', 'name'] }];
  }
  const { rows, count } = await Product.findAndCountAll(options);
  return { rows, count, page, limit, totalPages: Math.max(1, Math.ceil(count / limit)) };
};

/**
 * Fetch a single product by primary key — includes its category.
 * @param   {number} id
 * @returns {Promise<Product|null>}
 */
const getProductById = async (id) => {
  return Product.findByPk(id, {
    include: [{ model: Category, attributes: ['id', 'name'] }],
  });
};

/**
 * Create a new product.
 * @param   {object} payload
 * @returns {Promise<Product>}
 */
const createProduct = async (payload) => {
  return Product.create(payload);
};

/**
 * Update an existing product.
 * @param   {number} id
 * @param   {object} payload
 * @returns {Promise<[number, number]>}
 */
const updateProduct = async (id, payload) => {
  return Product.update(payload, { where: { id } });
};

/**
 * Check whether a product is referenced in any order items.
 * @param   {number} id
 * @returns {Promise<boolean>}
 */
const hasOrderItems = async (id) => {
  const count = await OrderItem.count({ where: { product_id: id } });
  return count > 0;
};

/**
 * Delete a product.
 * @param   {number} id
 * @returns {Promise<number>}  deletedRowCount
 */
const deleteProduct = async (id) => {
  return Product.destroy({ where: { id } });
};

export {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  hasOrderItems,
};