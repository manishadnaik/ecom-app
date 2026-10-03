// Thin HTTP layer - no business logic here, no console.log in request path.
import * as categoryService from '../services/category.js';

const getAll = async (req, res, next) => {
  try {
    const categories = await categoryService.getAllCategories();
    res.status(200).json({ status: 'success', rowCount: categories.length, data: categories });
  } catch (error) {
    next(error);
  }
};

export { getAll };
