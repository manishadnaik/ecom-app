import { fileURLToPath } from 'url';
import sequelize from './database.js';
import '../models/index.js'; // Register all models and associations before syncing

/**
 * Initializes (resets) the database by dropping and recreating all tables.
 *
 * @returns {Promise<void>}
 */
async function initDb() {
  try {
    await sequelize.sync({ force: true }); // @todo: remove { force: true } while pushing the code and add that as command from p.json
    console.log('Database initialized: all tables dropped and recreated.');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

/* Auto-execute only when this file is run directly:
 *   node src/config/initDb.js
 * Import the function from another module without side effects.
 */
const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] === __filename) {
  initDb()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default initDb;
