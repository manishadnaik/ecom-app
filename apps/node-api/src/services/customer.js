import { Customer, Order } from '../models/index.js';

/**
 * Customer service — encapsulates all business logic for customer
 * operations.  Controllers delegate to these methods so that route
 * handlers stay lean and testable.
 */

/**
 * Fetch every customer.
 * @returns {Promise<Array>}
 */
const getAllCustomers = async () => {
  return Customer.findAll({ order: [['id', 'ASC']] });
};

/**
 * Fetch a single customer by primary key.
 * @param   {number} id
 * @returns {Promise<Customer|null>}
 */
const getCustomerById = async (id) => {
  return Customer.findByPk(id);
};

/**
 * Create a new customer.
 * @param   {object} payload
 * @returns {Promise<Customer>}
 */
const createCustomer = async (payload) => {
  return Customer.create(payload);
};

/**
 * Update an existing customer.
 * @param   {number} id
 * @param   {object} payload
 * @returns {Promise<[number, number]>  [affectedRows, updatedRows]
 */
const updateCustomer = async (id, payload) => {
  return Customer.update(payload, { where: { id } });
};

/**
 * Check whether a customer has existing orders before deletion.
 * @param   {number} id
 * @returns {Promise<boolean>}
 */
const hasOrders = async (id) => {
  const count = await Order.count({ where: { customer_id: id } });
  return count > 0;
};

/**
 * Delete a customer.
 * @param   {number} id
 * @returns {Promise<number>  deletedRowCount
 */
const deleteCustomer = async (id) => {
  return Customer.destroy({ where: { id } });
};

export {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  hasOrders,
};