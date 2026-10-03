import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Product model.
 *
 * Represents a product available for purchase.
 *
 * Schema:
 *   id              - auto-incrementing INT, primary key
 *   name            - STRING, NOT NULL
 *   description     - TEXT, nullable
 *   category_id     - INT, NOT NULL, foreign key referencing Category.id
 *   price           - DECIMAL(10, 2), NOT NULL, >= 0
 *   stock_quantity  - INTEGER, NOT NULL, >= 0
 *   status          - ENUM('ACTIVE', 'INACTIVE'), NOT NULL, default 'ACTIVE'
 *   created_at      - DATE, NOT NULL (auto-managed by Sequelize timestamps)
 *   updated_at      - DATE, NOT NULL (auto-managed by Sequelize timestamps)
 */
const Product = sequelize.define(
  'Product',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    stock_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
      allowNull: false,
      defaultValue: 'ACTIVE',
    },
  },
  {
    tableName: 'products',
  },
);

export default Product;
