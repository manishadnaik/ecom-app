import { Router } from "express";
import * as orderController from '../controllers/order.js'
import { validate } from "../middlewares/validate.js";
import { createOrderSchema } from "../validators/create-order.js";
import { updateOrderSchema } from "../validators/update-order.js";
import { orderLimiter } from "../middlewares/rate-limit.js";

const router = Router();

router.route('/')
  .post(orderLimiter, validate(createOrderSchema), orderController.createOrder)
  .get(orderController.getAllOrders);

router.route('/:id')
  .get(orderController.getOne)
  .put(validate(updateOrderSchema), orderController.updateOrder)
  .delete(orderController.cancelOrder);



export default router;