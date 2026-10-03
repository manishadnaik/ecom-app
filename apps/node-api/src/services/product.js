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
 * @returns {Promise<Array>}
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
  const options = { where, order: [['id', 'ASC']] };

  if (query.category) {
    // When category filter is provided, eager-load Category and filter
    options.include = [
      {
        model: Category,
        where: { name: query.category },
        attributes: ['id', 'name'],
      },
    ];
  }
  return Product.findAll(options);
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