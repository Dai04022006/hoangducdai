const { GoogleGenerativeAI } = require('@google/generative-ai');
const Product = require('../models/Product');

// [POST] /api/ai/chat
exports.chatWithAI = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Vui lòng nhập câu hỏi!' });

    // 1. Lấy dữ liệu điện thoại mới nhất từ CSDL hoặc Catalog
    const products = await Product.find().populate('category', 'name').select('name brand salePrice originalPrice stock rating description category ram storage screen cpu battery camera color');
    const productCatalog = products
      .map((p, idx) => `${idx + 1}. Tên: "${p.name}" | Hãng: ${p.brand || ''} | Danh mục: ${p.category ? p.category.name : 'Điện thoại'} | Giá bán: ${Number(p.salePrice).toLocaleString('vi-VN')} đ | RAM: ${p.ram || ''} | Bộ nhớ: ${p.storage || ''} | Màn hình: ${p.screen || ''} | Chip: ${p.cpu || ''} | Pin: ${p.battery || ''} | Còn lại: ${p.stock} máy | Đánh giá: ${p.rating}⭐ | Mô tả: ${p.description}`)
      .join('\n');

    const systemInstruction = `
Bạn là "NOVAPHONE AI Assistant" - Chuyên gia tư vấn điện thoại di động thông minh, thân thiện của Hệ thống Siêu thị Điện thoại NovaPhone.
DANH SÁCH ĐIỆN THOẠI HIỆN CÓ TRONG KHO:
${productCatalog}

QUY TẮC TƯ VẤN:
1. Luôn xưng "Em" hoặc "Shop", gọi khách là "Anh/Chị" hoặc "Quý khách".
2. CHỈ gợi ý các dòng smartphone có thật trong danh sách trên (iPhone, Samsung Galaxy, Xiaomi, OPPO, Vivo, Realme), nêu rõ giá bán chính xác và ưu điểm nổi bật (RAM, bộ nhớ trong, chip xử lý, pin, camera).
3. Hướng dẫn khách bấm nút "Thêm giỏ" hoặc "Xem chi tiết" để đặt mua ngay.
`;
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    // 2. Gọi Google Gemini AI
    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          systemInstruction
        });

        const result = await model.generateContent(
          `Khách hàng hỏi: "${message}". Hãy tư vấn chi tiết về điện thoại phù hợp nhất.`
        );

        return res.status(200).json({
          success: true,
          provider: 'Google Gemini',
          reply: result.response.text()
        });
      } catch (err) {
        console.error('GEMINI ERROR:', err.message);
      }
    }

    // 3. Chế độ Fallback thông minh cho điện thoại
    const lowerMsg = message.toLowerCase();
    const matched = products.filter(p =>
      lowerMsg.includes(p.name.toLowerCase()) ||
      (p.brand && lowerMsg.includes(p.brand.toLowerCase())) ||
      (lowerMsg.includes('rẻ') && p.salePrice < 10000000) ||
      (lowerMsg.includes('cao cấp') && p.salePrice >= 20000000) ||
      (lowerMsg.includes('iphone') && (p.name.toLowerCase().includes('iphone') || (p.brand && p.brand.toLowerCase().includes('apple')))) ||
      (lowerMsg.includes('samsung') && (p.name.toLowerCase().includes('samsung') || (p.brand && p.brand.toLowerCase().includes('samsung')))) ||
      (lowerMsg.includes('xiaomi') && p.name.toLowerCase().includes('xiaomi')) ||
      (lowerMsg.includes('oppo') && p.name.toLowerCase().includes('oppo')) ||
      (lowerMsg.includes('vivo') && p.name.toLowerCase().includes('vivo')) ||
      (lowerMsg.includes('realme') && p.name.toLowerCase().includes('realme'))
    );

    const list = matched.length > 0 ? matched : products.slice(0, 3);
    let reply = 'Chào Quý khách! Em xin gợi ý các mẫu điện thoại di động phù hợp nhất với nhu cầu của mình ạ:\n\n';
    list.forEach(p => {
      reply += `📱 **${p.name}**\n- Giá ưu đãi: **${Number(p.salePrice).toLocaleString('vi-VN')} đ** (Giá gốc: ${Number(p.originalPrice).toLocaleString('vi-VN')} đ)\n- Cấu hình: Chip ${p.cpu || 'Mạnh mẽ'}, RAM ${p.ram || '8GB'}, Bộ nhớ ${p.storage || '128GB'}, Pin ${p.battery || '5000 mAh'}\n- Đặc điểm: ${p.description}\n\n`;
    });
    reply += 'Quý khách có thể bấm vào sản phẩm trên trang chủ để xem thông số chi tiết và đặt mua ngay nhé!';
    res.status(200).json({ success: true, provider: 'Smart Phone Assistant', reply });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
