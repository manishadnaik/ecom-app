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
 *   image_url       - STRING(512), nullable (Option B: uploaded file or remote URL)
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
    image_url: {
      type: DataTypes.STRING(512),
      allowNull: true,
      validate: {
        // allow relative /uploads/xxx paths or full http(s) URLs, but nothing else
        isValidImageUrl(value) {
          if (value == null || value === '') return;
          if (value.startsWith('/uploads/')) return;
          if (/^https?:\/\/.+/i.test(value)) return;
          throw new Error('image_url must be a /uploads/... path or http(s) URL');
        },
      },
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
    // catalog filters hit these on every browse: category join + inStock scan.
    indexes: [
      { fields: ['category_id'] },
      { fields: ['status'] },
      { fields: ['stock_quantity'] },
    ],
  },
);

export default Product;
