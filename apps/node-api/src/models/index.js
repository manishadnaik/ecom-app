import { Sequelize, DataTypes } from 'sequelize';
import sequelize, { testConnection } from '../config/database.js';

// Import all models so they are registered on the Sequelize instance
import Customer from './Customer.js';
import Product from './Product.js';
import Category from './Category.js';
import Order from './Order.js';
import OrderItem from './OrderItem.js';

/**
 * Initialize Sequelize connection and load all models.
 *
 * Models placed in this directory will be imported here and
 * their associations can be defined.
 */

// Export Sequelize library utilities for use in individual model files
export { Sequelize, DataTypes };

// Export the initialized Sequelize instance and connection test
export { sequelize, testConnection };

// Export all model classes
export { Customer, Product, Category, Order, OrderItem };

/* ────────────────────────────────────────────────────────────── *
 * Association definitions                                        *
 * ────────────────────────────────────────────────────────────── */

/**
 * Customer ↔ Order
 *   A customer can have many orders; an order belongs to one customer.
 *   Deleting a customer is restricted while orders still reference it.
 */
Customer.hasMany(Order, { foreignKey: 'customer_id', onDelete: 'RESTRICT' });
Order.belongsTo(Customer, { foreignKey: 'customer_id', onDelete: 'RESTRICT' });

/**
 * Order ↔ OrderItem
 *   An order can have many order items; an item belongs to one order.
 *   Deleting an order cascade-deletes its order items.
 */
Order.hasMany(OrderItem, { foreignKey: 'order_id', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', onDelete: 'CASCADE' });

/**
 * Product ↔ OrderItem
 *   A product can appear in many order items; an item belongs to one product.
 *   Deleting a product is restricted while order items reference it.
 */
Product.hasMany(OrderItem, { foreignKey: 'product_id', onDelete: 'RESTRICT' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id', onDelete: 'RESTRICT' });

/**
 * Category ↔ Product
 *   A category can have many products; a product belongs to one category.
 *   Deleting a category is restricted while products still reference it.
 *   Sequelize sync respects this dependency, creating the categories table
 *   before the products table.
 */
Category.hasMany(Product, { foreignKey: 'category_id', onDelete: 'RESTRICT' });
Product.belongsTo(Category, { foreignKey: 'category_id', onDelete: 'RESTRICT' });

export default { Customer, Product, Category, Order, OrderItem, sequelize, Sequelize };
