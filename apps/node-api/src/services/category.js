// Categories are seed-managed (no create/edit UI). One read endpoint is enough.
// productCount lets UI show "Electronics (8)" without extra calls.
import { Category, Product, sequelize } from '../models/index.js';

const getAllCategories = async () => {
  const rows = await Category.findAll({
    attributes: [
      'id',
      'name',
      [sequelize.fn('COUNT', sequelize.col('Products.id')), 'productCount'],
    ],
    include: [{ model: Product, attributes: [], required: false }],
    group: ['Category.id'],
    order: [['name', 'ASC']],
    raw: true,
  });
  // COUNT comes back as string from mysql - normalise to number for UI
  return rows.map((r) => ({ ...r, productCount: Number(r.productCount) }));
};

export { getAllCategories };
