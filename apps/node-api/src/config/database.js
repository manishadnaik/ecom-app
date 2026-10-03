import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Initializes and exports a Sequelize instance configured with
 * credentials from environment variables.
 *
 * Expected environment variables:
 *   DB_HOST     - Database host (default: localhost)
 *   DB_USER     - Database username (default: root)
 *   DB_PASSWORD - Database password
 *   DB_NAME     - Database name
 *   DB_PORT     - Database port (default: 3306)
 *   DB_DIALECT  - SQL dialect (default: mysql)
 */
const sequelize = new Sequelize(
  process.env.DB_NAME || 'nodejs_ecom',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || 'your_password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
);

/**
 * Verifies the database connection.
 * @returns {Promise<boolean>} - Returns true if connection is successful.
 */
export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully to: ', process.env.DB_NAME);
    return true;
  } catch (error) {
    console.error('Error connecting to the database:', error.message);
    return false;
  }
};


export default sequelize;
