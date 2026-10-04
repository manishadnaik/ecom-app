import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * OrderItem model.
 *
 * Represents a single line item within an order, linking an Order to a Product.
 *
 * Schema:
 *   id                   - auto-incrementing INT, primary key
 *   order_id             - INT, NOT NULL, foreign key referencing Order.id
 *   product_id           - INT, NOT NULL, foreign key referencing Product.id
 *   quantity             - INTEGER, NOT NULL, >= 1
 *   unit_price_at_purchase - DECIMAL(10, 2), NOT NULL, >= 0
 *   unique constraint on (order_id, product_id)
 *
 * Note: line_total is intentionally NOT included per requirements.
 */
const OrderItem = sequelize.define(
  'OrderItem',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    unit_price_at_purchase: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
  },
  {
    tableName: 'order_items',
    indexes: [
      {
        unique: true,
        fields: ['order_id', 'product_id'],
        name: 'order_items_order_id_product_id_unique',
      },
      // cancel flow restores stock per item: WHERE order_id = ? (no full scan)
      { fields: ['order_id'] },
      // delete-product guard: WHERE product_id = ? + revenue JOINs on product_id
      { fields: ['product_id'] },
    ],
  },
);

export default OrderItem;
