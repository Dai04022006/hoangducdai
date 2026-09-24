const express = require('express');
const router = express.Router();
const { 
  getCategories, 
  createCategory, 
  deleteCategory 
} = require('../controllers/categoryController');

// [GET] /api/categories - Lấy tất cả danh mục
router.get('/', getCategories);

// [POST] /api/categories - Tạo danh mục mới
router.post('/', createCategory);

// [DELETE] /api/categories/:id - Xóa danh mục theo ID
router.delete('/:id', deleteCategory);

module.exports = router;