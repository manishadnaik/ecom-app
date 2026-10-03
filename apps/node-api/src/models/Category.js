import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Category model.
 *
 * Represents a product category.  Normalises the denormalised `category`
 * STRING column that previously lived on Product.
 *
 * Schema:
 *   id          - auto-incrementing INT, primary key
 *   name        - STRING, NOT NULL, UNIQUE
 *   created_at  - DATE, NOT NULL (auto-managed by Sequelize timestamps)
 *   updated_at  - DATE, NOT NULL (auto-managed by Sequelize timestamps)
 */
const Category = sequelize.define(
  'Category',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  },
  {
    tableName: 'categories',
  },
);

export default Category;
