import { Order } from "../models/index.js";
import * as orderService from '../services/order.js'

const getOne = async (req, res, next) => {
  try {
    const id = req.params.id;
    const order = await orderService.getOrderById(id);

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
        field: 'id',
      });
    }

    res.status(200).json({ status: 'success', data: order });
  } catch (error) {
    next(error);
  }
}

const createOrder = async (req, res, next) => {
  try {
  // const created = await Order.create(req.body)
    const order = await orderService.createOrder(req?.body);
    res.status(201).json({ message: 'Order created successfully', order });
  } catch (error) {
    next(error)
  }
}

const getAllOrders = async (req, res, next) => {
  try {
    const orders = await orderService.getAllOrders();
    res.status(200).json({ status: 'success', rowCount: orders.length, data: orders });
  } catch (error) {
    next(error);
  }
}

/**
 * Cancel order
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const cancelOrder = async(req, res, next) => {
  try {
    
    const order = await orderService.cancelOrder(req.params)
    res.json({ status: 'success', data: order })
  } catch (error) {
    next(error)
  }
}

/**
 * Update an existing order — change its status only.
 *
 * Body (validated by `updateOrderSchema`):
 *   { status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' }  →   PUT /api/v1/orders/:id
 */
const updateOrder = async (req, res, next) => {
  try {
    // Spread params (id) + body (status/line_items) into one payload
    const order = await orderService.updateOrder({ ...req.params, ...req.body });
    res.status(200).json({ status: 'success', data: order });
  } catch (error) {
    next(error);
  }
}

export { getOne, createOrder, getAllOrders, cancelOrder, updateOrder }