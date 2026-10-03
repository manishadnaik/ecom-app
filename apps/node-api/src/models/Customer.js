import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Customer model.
 *
 * Represents a customer who can place orders in the system.
 *
 * Schema:
 *   id          - auto-incrementing INT, primary key
 *   name        - STRING, NOT NULL
 *   email       - STRING, NOT NULL, UNIQUE
 *   phone       - STRING, nullable
 *   address     - STRING, nullable
 *   created_at  - DATE, NOT NULL (auto-managed by Sequelize timestamps)
 *   updated_at  - DATE, NOT NULL (auto-managed by Sequelize timestamps)
 */
const Customer = sequelize.define(
  'Customer',
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
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: 'customers',
  },
);

export default Customer;
