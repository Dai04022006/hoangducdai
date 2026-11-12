const mongoose = require('mongoose');
const Category = require('../models/Category');

// [GET] /api/categories/:id
exports.getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;

        // Kiểm tra ID có đúng định dạng MongoDB không
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID danh mục không hợp lệ!'
            });
        }

        // Tìm danh mục theo ID
        const category = await Category.findById(id);

        // Không tìm thấy danh mục
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy danh mục!'
            });
        }

        // Trả về thông tin danh mục
        res.status(200).json({
            success: true,
            data: category
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// [PUT] /api/categories/:id
exports.updateCategory = async (req, res) => {
    try {
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy danh mục!'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật danh mục thành công',
            data: category
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// [GET] /api/categories - Lấy tất cả danh mục
exports.getCategories = async (req, res) => {
 try {
 const categories = await Category.find().sort({ createdAt: -1 });
 res.status(200).json({
 success: true,
 message: 'Lấy danh sách danh mục thành công',
 total: categories.length,
 data: categories
 });
 } catch (error) {
 res.status(500).json({ success: false, message: error.message });
 }
};
// [POST] /api/categories - Tạo danh mục mới
exports.createCategory = async (req, res) => {
 try {
 const { name, description, image } = req.body;
 if (!name) {
 return res.status(400).json({ success: false, message: 'Vui lòng nhập tên danh mục!'
});
 }
 const slug = name.toLowerCase().replace(/\s+/g, '-');
 const category = await Category.create({ name, slug, description, image });
 res.status(201).json({
 success: true,
 message: 'Tạo danh mục mới thành công',
 data: category
 });
 } catch (error) {
 res.status(500).json({ success: false, message: error.message });
 }
};
// [DELETE] /api/categories/:id - Xóa danh mục
exports.deleteCategory = async (req, res) => {
 try {
 const category = await Category.findByIdAndDelete(req.params.id);
 if (!category) {
 return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục để xóa!' });
 }
 res.status(200).json({
 success: true,
 message: 'Đã xóa danh mục thành công',
 data: category
 });
 } catch (error) {
 res.status(500).json({ success: false, message: error.message });
 }
};
