require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Category = require('./models/Category');
const Product = require('./models/Product');
const User = require('./models/User');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Đã kết nối MongoDB Atlas thành công.');

    // 1. Dọn dẹp dữ liệu cũ
    console.log('🧹 Đang làm sạch dữ liệu cũ trong CSDL...');
    await User.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});

    // 2. Tạo tài khoản mẫu (1 Quản trị viên và 1 Khách hàng)
    console.log('👥 Đang tạo tài khoản mẫu...');
    await User.create([
      {
        name: 'Quản Trị Viên LHU',
        email: 'admin@lhu.edu.vn',
        password: 'AdminPassword123@',
        phone: '0901234567',
        role: 'admin'
      },
      {
        name: 'Khách Hàng Mẫu',
        email: 'khachhang@gmail.com',
        password: 'KhachPassword123@',
        phone: '0987654321',
        role: 'customer'
      }
    ]);
    console.log('✅ Đã tạo tài khoản mẫu:');
    console.log(' 👑 Admin: admin@lhu.edu.vn / AdminPassword123@');
    console.log(' 👤 Customer: khachhang@gmail.com / KhachPassword123@');

    // 3. Đọc dữ liệu danh mục chuẩn từ src/data/categories.json
    console.log('📂 Đang nạp danh mục công nghệ từ src/data/categories.json...');
    const categoriesRaw = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'data/categories.json'), 'utf8')
    );

    // Lưu từng category vào MongoDB và tạo bảng ánh xạ _id (String -> ObjectId)
    const categoryIdMap = {};
    for (const catData of categoriesRaw) {
      const createdCat = await Category.create({
        name: catData.name,
        slug: catData.slug,
        icon: catData.icon || '💻',
        description: catData.description || '',
        image: catData.image || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500',
        subcategories: catData.subcategories || {}
      });
      categoryIdMap[catData._id] = createdCat._id;
    }
    console.log(`✅ Đã nạp thành công ${categoriesRaw.length} danh mục công nghệ kèm đầy đủ icon và subcategories.`);

    // 4. Đọc dữ liệu sản phẩm chuẩn từ src/data/products.json
    console.log('📦 Đang nạp toàn bộ sản phẩm công nghệ từ src/data/products.json...');
    const productsRaw = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'data/products.json'), 'utf8')
    );

    const formattedProducts = productsRaw.map(p => {
      // Map category ID từ chuỗi String sang ObjectId tương ứng vừa tạo trong MongoDB
      const mappedCatId = categoryIdMap[p.category] || null;

      return {
        name: p.name,
        category: mappedCatId,
        brand: p.brand || 'LHU Brand',
        costPrice: Number(p.costPrice) || 0,
        originalPrice: Number(p.originalPrice) || Number(p.price) || 0,
        salePrice: Number(p.salePrice) || Number(p.price) || 0,
        stock: Number(p.stock) || 15,
        image: (p.images && p.images[0]) || p.image || 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=500',
        images: (p.images && p.images.length > 0) ? p.images : [(p.image || 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=500')],
        specs: p.specs || {},
        ram: p.ram || '',
        storage: p.storage || '',
        screen: p.screen || '',
        cpu: p.cpu || '',
        battery: p.battery || '',
        camera: p.camera || '',
        color: p.color || '',
        description: p.description || '',
        rating: Number(p.rating) || 4.9,
        isFeatured: p.isFeatured !== undefined ? p.isFeatured : true
      };
    });

    await Product.insertMany(formattedProducts);
    console.log(`🎉 Nạp dữ liệu hoàn tất thành công! Tổng cộng: ${formattedProducts.length} sản phẩm công nghệ mới.`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi nạp dữ liệu Seeder:', error);
    process.exit(1);
  }
};

seedData();
