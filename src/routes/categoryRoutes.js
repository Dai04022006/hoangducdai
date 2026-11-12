const express = require('express');
const router = express.Router();
const { getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory } =
require('../controllers/categoryController');

router.get('/', getCategories);
router.post('/', createCategory);
router.get('/:id', getCategoryById);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);
module.exports = router;