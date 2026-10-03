import { fileURLToPath } from 'url';
import sequelize from '../config/database.js';
import { Customer, Product, Category } from '../models/index.js';

/* ────────────────────────────────────────────────────────────── *
 * Seed data                                                      *
 * ────────────────────────────────────────────────────────────── */

/**
 * Categories — seeded first so their IDs are available for products.
 * The `name` column has a UNIQUE constraint, making findOrCreate safe
 * across repeated runs.
 */
const seedCategories = [
  { name: 'Electronics' },
  { name: 'Clothing' },
  { name: 'Books' },
  { name: 'Home & Kitchen' },
  { name: 'Sports & Outdoors' },
];

/**
 * Customers — at least 5 realistic entries.
 * The `email` column has a UNIQUE constraint, so re-running the seed
 * script will skip customers that already exist.
 */
const seedCustomers = [
  {
    name: 'Alice Johnson',
    email: 'alice.johnson@example.com',
    phone: '(555) 123-4567',
    address: '123 Main St, Springfield',
  },
  {
    name: 'Bob Smith',
    email: 'bob.smith@example.com',
    phone: '(555) 234-5678',
    address: '456 Oak Ave, Shelbyville',
  },
  {
    name: 'Carol Williams',
    email: 'carol.williams@example.com',
    phone: '(555) 345-6789',
    address: '789 Pine Rd, Capital City',
  },
  {
    name: 'David Brown',
    email: 'david.brown@example.com',
    phone: '(555) 456-7890',
    address: '321 Maple Dr, Ogdenville',
  },
  {
    name: 'John Davis',
    email: 'john@example.com',
    phone: '(555) 567-8901',
    address: '654 Cedar Ln, North Haverbrook',
  },
];

/**
 * Products — at least 12 with varied names, categories, prices, and
 * stock quantities.  Prices are valid DECIMAL(10, 2) values and all
 * stock quantities are >= 0.
 *
 * The `category` string is resolved to a category_id via the
 * categoryMap built while seeding categories.
 */
const seedProducts = [
  { name: 'MacBook Air M3', description: 'Apple MacBook Air with M3 chip, 13-inch display', price: 1099.99, stock_quantity: 8, status: 'ACTIVE', category: 'Electronics' },
  { name: 'Samsung Galaxy Watch', description: 'Samsung Galaxy Watch6 Classic, 46mm', price: 299.99, stock_quantity: 25, status: 'ACTIVE', category: 'Electronics' },
  { name: 'Cotton T-Shirt', description: '100% cotton, machine washable, assorted colors', price: 19.99, stock_quantity: 100, status: 'ACTIVE', category: 'Clothing' },
  { name: 'Denim Jeans', description: 'Premium denim jeans, straight fit, dark blue', price: 59.99, stock_quantity: 50, status: 'ACTIVE', category: 'Clothing' },
  { name: 'Premium Winter Jacket', description: 'Insulated, water-resistant winter jacket', price: 149.99, stock_quantity: 30, status: 'ACTIVE', category: 'Clothing' },
  { name: 'The Great Gatsby', description: 'Classic American novel by F. Scott Fitzgerald', price: 12.99, stock_quantity: 75, status: 'ACTIVE', category: 'Books' },
  { name: 'Clean Code', description: 'A handbook of agile software craftsmanship by Robert C. Martin', price: 34.99, stock_quantity: 40, status: 'ACTIVE', category: 'Books' },
  { name: 'Sapiens: A Brief History', description: 'A brief history of humankind by Yuval Noah Harari', price: 18.99, stock_quantity: 60, status: 'ACTIVE', category: 'Books' },
  { name: 'Stainless Steel Knife Set', description: '15-piece premium stainless steel knife set with block', price: 89.99, stock_quantity: 35, status: 'ACTIVE', category: 'Home & Kitchen' },
  { name: 'Non-Stick Pan Set', description: '3-piece aluminum non-stick cookware set', price: 129.99, stock_quantity: 20, status: 'ACTIVE', category: 'Home & Kitchen' },
  { name: 'Professional Yoga Mat', description: 'Eco-friendly TPE yoga mat, 6mm thick, non-slip', price: 24.99, stock_quantity: 80, status: 'ACTIVE', category: 'Sports & Outdoors' },
  { name: 'Dumbbell Set 20kg', description: 'Adjustable dumbbell set with 20kg total weight', price: 199.99, stock_quantity: 12, status: 'ACTIVE', category: 'Sports & Outdoors' },
];


/* ────────────────────────────────────────────────────────────── *
 * Seed function                                                  *
 * ────────────────────────────────────────────────────────────── */

/**
 * Categories are seeded first so their IDs can be referenced by products.
 * Basic setup commands
 *   npm run db:reset   ← drop & recreate tables (destructive)
 *   npm run db:seed    ← insert seed data (idempotent)
 *
 * @returns {Promise<void>}
 */
async function seed() {
  // Ensure tables exist without dropping any existing data
  await sequelize.sync();

  // ── 1. Categories (must come before products) ──────────────
  const categoryMap = {};

  for (const item of seedCategories) {
    const [record, created] = await Category.findOrCreate({
      where: { name: item.name },
      defaults: item,
    });
    categoryMap[record.name] = record.id;
    console.log(`  ${created ? 'CREATED' : 'EXISTS '} Category: ${record.name} (id: ${record.id})`);
  }

  // ── 2. Customers ───────────────────────────────────────────
  for (const item of seedCustomers) {
    const [record, created] = await Customer.findOrCreate({
      where: { email: item.email },
      defaults: item,
    });
    console.log(`  ${created ? 'CREATED' : 'EXISTS '} Customer: ${record.name} (${record.email})`);
  }

  // ── 3. Products (requires category IDs) ───────────────────
  let createdCount = 0;
  let existsCount = 0;
  let skippedCount = 0;

  for (const item of seedProducts) {
    const categoryId = categoryMap[item.category];

    if (!categoryId) {
      console.log(`  SKIP   Product: ${item.name} (category "${item.category}" not found)`);
      skippedCount++;
      continue;
    }

    const [record, created] = await Product.findOrCreate({
      where: { name: item.name },
      defaults: {
        description: item.description,
        price: item.price,
        stock_quantity: item.stock_quantity,
        status: item.status,
        category_id: categoryId,
      },
    });

    if (created) {
      createdCount++;
    } else {
      existsCount++;
    }
    console.log(` Seeding in progress:  ${created ? 'CREATED' : 'EXISTS '} Product: ${record.name} — $${record.price} (stock: ${record.stock_quantity})`);
  }

  console.log(`\n\nTotal categories: ${seedCategories.length} created.\n`);
  console.log(`Total customers: ${seedCustomers.length} created.\n`);
  console.log(`Total Products: ${createdCount} created, ${existsCount} already existed, ${skippedCount} skipped.`);

  console.log(`\nSeed complete!!`);
  await sequelize.close();
}

/* ────────────────────────────────────────────────────────────── *
 * Auto-run guard                                                 *
 * ────────────────────────────────────────────────────────────── *
 * Executes only when this file is run directly:
 *   node src/seed/seed.js     or   npm run db:seed
 * Importing the function does NOT trigger execution.
 */
const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] === __filename) {
  seed()
    .then(() => {
      console.log('\nDatabase connection closed. Exiting.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seed failed:', error);
      sequelize.close().finally(() => process.exit(1));
    });
}

export default seed;

