import * as customerService from '../services/customer.js';

/**
 * Customer controller — thin HTTP layer.
 * Delegates all business logic to customerService and translates
 * results into HTTP responses with structured error bodies.
 */

const getAll = async (req, res, next) => {
  try {
    const customers = await customerService.getAllCustomers();
    res.status(200).json({ status: 'success', data: customers });
  } catch (error) {
    next(error);
  }
};

const getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customer = await customerService.getCustomerById(id);

    if (!customer) {
      return res.status(404).json({
        status: 'error',
        error: 'Customer not found',
        field: 'id',
      });
    }

    res.status(200).json({ status: 'success', data: customer });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const customer = await customerService.createCustomer(req.body);
    res.status(201).json({ status: 'success', data: customer });
  } catch (error) {
    // Sequelize unique-constraint violation on email
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        status: 'error',
        error: 'A customer with this email already exists',
        field: 'email',
      });
    }
    // Validation errors (name, email missing, etc.)
    if (error.name === 'SequelizeValidationError') {
      const field = Object.keys(error.errors)[0];
      return res.status(400).json({
        status: 'error',
        error: error.errors[field].message,
        field,
      });
    }
    // Cast error (invalid ID format, e.g. /customers/abc)
    if (error.name === 'SequelizeDatabaseError' && error.parent?.code === 'ER_BAD_FIELD_ERROR') {
      return res.status(400).json({
        status: 'error',
        error: 'Invalid request data',
        field: 'body',
      });
    }
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [updated] = await customerService.updateCustomer(id, req.body);

    if (!updated) {
      return res.status(404).json({
        status: 'error',
        error: 'Customer not found',
        field: 'id',
      });
    }

    const customer = await customerService.getCustomerById(id);
    res.status(200).json({ status: 'success', data: customer });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        status: 'error',
        error: 'A customer with this email already exists',
        field: 'email',
      });
    }
    if (error.name === 'SequelizeValidationError') {
      const field = Object.keys(error.errors)[0];
      return res.status(400).json({
        status: 'error',
        error: error.errors[field].message,
        field,
      });
    }
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 404 if the customer doesn't exist
    const customer = await customerService.getCustomerById(id);
    if (!customer) {
      return res.status(404).json({
        status: 'error',
        error: 'Customer not found',
        field: 'id',
      });
    }

    // 409 if the customer has orders
    const hasOrders = await customerService.hasOrders(id);
    if (hasOrders) {
      return res.status(409).json({
        status: 'error',
        error: 'Cannot delete customer: customer has existing orders',
        field: 'id',
      });
    }

    await customerService.deleteCustomer(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export { getAll, getOne, create, update, remove };