import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Order model.
 *
 * Represents an order placed by a customer.
 *
 * Schema:
 *   id           - auto-incrementing INT, primary key
 *   customer_id  - INT, NOT NULL, foreign key referencing Customer.id
 *   status       - ENUM('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'),
 *                  NOT NULL, default 'PENDING'
 *   order_date   - DATE, NOT NULL
 *   cancelled_at - DATE, nullable
 *   created_at   - DATE, NOT NULL (auto-managed by Sequelize timestamps)
 *   updated_at   - DATE, NOT NULL (auto-managed by Sequelize timestamps)
 *
 * Note: total_amount is intentionally NOT included per requirements.
 */
const Order = sequelize.define(
  'Order',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    order_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    cancelled_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'orders',
    // #10 N+1/indexes: these cover the hot lookups - orders by customer
    // (account page), by status (admin filter), by date (reports).
    // Without them MySQL does a full table scan once orders grow.
    indexes: [
      { fields: ['customer_id'] },
      { fields: ['status'] },
      { fields: ['order_date'] },
    ],
  },
);

export default Order;
