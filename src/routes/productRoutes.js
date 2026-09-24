const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');

// [GET] /api/products - Lấy danh sách sản phẩm (có Lọc, Tìm kiếm, Sắp xếp)
router.get('/', getProducts);

// [GET] /api/products/:id - Lấy chi tiết 1 sản phẩm
router.get('/:id', getProductById);

// [POST] /api/products - Thêm sản phẩm mới
router.post('/', createProduct);

// [PUT] /api/products/:id - Cập nhật thông tin sản phẩm
router.put('/:id', updateProduct);

// [DELETE] /api/products/:id - Xóa sản phẩm theo ID
router.delete('/:id', deleteProduct);

module.exports = router;