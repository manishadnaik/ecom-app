import { Op } from 'sequelize';
import { Order, OrderItem, Customer, Product, sequelize, Category } from '../models/index.js';
import { AppError } from '../errors/AppError.js';
import { ALL_ORDER_STATUS, ORDER_STATUS_CAN_NOT_CANCELLED } from '../utils/constants.js';

// Shared eager-load definition used by single + list queries
const orderInclude = () => ({
  model: OrderItem,
  attributes: ['id', 'product_id', 'quantity', 'unit_price_at_purchase'],
  include: [{
    model: Product,
    attributes: ['id', 'name', 'price'],
    include: [{ model: Category, attributes: ['id', 'name'] }],
  }],
});

const computeTotal = orderData => orderData.OrderItems.reduce((sum, item) => {
  const price = parseFloat(item.unit_price_at_purchase);
  return sum + (price * item.quantity);
}, 0);;

const getOrderById = async (id) => {
  const order = await Order.findByPk(id, { include: [orderInclude()] });
  if (!order) return null;
  const orderData = order.toJSON ? order.toJSON() : order;
  orderData.total_amount = Number(computeTotal(orderData).toFixed(2));
  return orderData;
}

const createOrder = async (payload) => {
  const { customer_id, order_date, line_items } = payload;

  // use managed transaction
  return await sequelize.transaction(async (t) => {

    // check customer exists (Include transaction to ensure they aren't deleted in between)
    const customer = await Customer.findByPk(customer_id, { transaction: t });
    if (!customer) {
      throw new AppError(`Customer with id ${customer_id} does not exist.`, 404);
    }

    // Lock and fetch products immediately using FOR UPDATE to prevent concurrent reads/writes
    const productIds = line_items.map(item => item.product_id);
    const products = await Product.findAll({
      where: { id: { [Op.in]: productIds } },
      lock: t.LOCK.UPDATE, // Prevents race conditions on stock/price updates
      transaction: t
    });

    // Verify all requested products exist
    if (products.length !== new Set(productIds).size) {
      throw new AppError('One or more products supplied do not exist.', 404);
    }

    // Map database items for quick retrieval
    const productMap = new Map(products.map(p => [p.id, p]));
    const itemsToCreate = [];

    // Validate stock and prepare order items
    for (const item of line_items) {
      const product = productMap.get(item.product_id);

      // Check if enough stock exists in the freshly locked record
      if (product.stock_quantity < item.quantity) {
        throw new AppError(
          `Insufficient stock for product id: ${product.id}, name ${product.name}. Available: ${product.stock_quantity}. Requested: ${item.quantity}`,
          400
        );
      }

      // Deduct stock safely directly on the locked instance
      product.stock_quantity -= item.quantity;
      await product.save({ transaction: t });

      // Build the item payload using the locked, real-time database price
      itemsToCreate.push({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price_at_purchase: product.price,
      });
    }

    // Create the root Order
    const order = await Order.create({
      customer_id,
      order_date: order_date || new Date(),
      status: 'PENDING'
    }, { transaction: t });

    // Add order_id reference and bulk insert items
    const orderItems = itemsToCreate.map(item => ({
      ...item,
      order_id: order.id
    }));
    await OrderItem.bulkCreate(orderItems, { transaction: t });

    // Managed transaction automatically COMMITS here if execution succeeds.
    // await t.commit();
    // If any error is thrown above, it automatically ROLLS BACK perfectly.
    return order.id;
  }).then(orderId => {
    // Return the populated order outside the lock block to keep transactions fast
    return getOrderById(orderId);
  });
};


const cancelOrder = async (payload) => {
  const { id } = payload;
  // if order does not exits, return error
  const initialOrder = await Order.findByPk(id);
  if (!initialOrder) {
    throw new AppError(`Order with id ${id} does not exist.`, 404);
  }
  // if order is in shipped, delivered or already cancelled status, return error
  if (Object.values(ORDER_STATUS_CAN_NOT_CANCELLED).includes(initialOrder.status)) {
    throw new AppError(`Order with id ${id} cannot be cancelled as its already in ${initialOrder.status} state.`, 409);
  }
  // start the transaction
  const t = await sequelize.transaction();
  try {
    const order = await Order.findByPk(id, {
      transaction: t,
      lock: t.LOCK.UPDATE
    });
    if (!order) throw new AppError(`Order with id ${id} does not exist.`, 404);
    // double check in case if that was updated by another
    if (Object.values(ORDER_STATUS_CAN_NOT_CANCELLED).includes(order.status)) {
      throw new AppError(`Order was updated by another process to ${order.status}. Cancellation aborted.`, 400);
    }
    // change status to cancelled
    await order.update({ status: ALL_ORDER_STATUS.CANCELLED, cancelled_at: new Date() }, { transaction: t });

    const orderItems = await OrderItem.findAll({
      where: {
        order_id: id
      },
      transaction: t
    });

    // restore/add the product stock by getting value from each order item
    if (orderItems.length > 0) {
      for (let item of orderItems) {
        const affected = await Product.increment('stock_quantity', {
          by: item.quantity,
          where: { id: item.product_id },
          transaction: t,
        });
      }
    }
    // do not delete order items as we should be still be able to see cancelled orders
    await t.commit();
    return order;
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

const getAllOrders = async () => {
  const orders = await Order.findAll({ include: [orderInclude()] });
  return orders.map((order) => {
    const orderData = order.toJSON ? order.toJSON() : order;
    orderData.total_amount = Number(computeTotal(orderData).toFixed(2));
    return orderData;
  });
}

/**
 * Update an existing order — change its status only.
 *
 * @param {object} payload - { id, status }
 *   - `status` : new status the order should be moved to
 * If the requested status is `CANCELLED`, the existing `cancelOrder` service
 * is reused, which already enforces the rule that an order cannot be cancelled
 * once it is already in `CANCELLED`, `SHIPPED` or `DELIVERED` state。
 */
const updateOrder = async (payload) => {
  const { id, status } = payload;

  // Reuse the existing cancel flow when the requested change is a cancellation。
  if (status === ALL_ORDER_STATUS.CANCELLED) {

    return cancelOrder({ id });
  }

  const order = await Order.findByPk(id);
  if (!order) {
    throw new AppError(`Order with id ${id} does not exist.`, 404);
  }

  await order.update({ status });
  return getOrderById(id);
};
export { getOrderById, createOrder, getAllOrders, cancelOrder, updateOrder }