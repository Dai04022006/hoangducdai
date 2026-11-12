/**
 * CẤU HÌNH KẾT NỐI API BACKEND CHO FRONTEND
 * Hỗ trợ fallback linh hoạt giữa localhost và Cloud
 */
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:'
  ? 'http://localhost:5000/api'
  : 'https://hoangducdai.onrender.com/api';

const API = {
  // 1. Danh mục
  async getCategories() {
    try {
      const res = await fetch(`${API_BASE_URL}/categories`);
      const data = await res.json();
      if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
        return data;
      }
      throw new Error('Dùng fallback src/data/categories.json');
    } catch (err) {
      // Fallback nạp trực tiếp từ file data của project
      try {
        const localRes = await fetch('../src/data/categories.json');
        const localData = await localRes.json();
        return { success: true, data: localData };
      } catch (e) {
        return { success: false, data: [] };
      }
    }
  },

  // 2. Sản phẩm
  async getProducts(params = {}) {
    try {
      const query = new URLSearchParams();
      if (params.category) query.append('category', params.category);
      if (params.search) query.append('search', params.search);
      if (params.sort) query.append('sort', params.sort);

      const url = `${API_BASE_URL}/products${query.toString() ? '?' + query.toString() : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
        return data;
      }
      throw new Error('Dùng fallback src/data/products.json');
    } catch (err) {
      // Fallback nạp trực tiếp từ file data của project
      try {
        const localRes = await fetch('../src/data/products.json');
        const localData = await localRes.json();
        return { success: true, data: localData };
      } catch (e) {
        return { success: false, data: [] };
      }
    }
  },

  async getProductById(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/products/${id}`);
      return await res.json();
    } catch (err) {
      console.error('Lỗi lấy chi tiết sản phẩm:', err);
      return { success: false, message: 'Lỗi kết nối máy chủ' };
    }
  },

  async createProduct(productData, token) {
    try {
      const res = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      });
      return await res.json();
    } catch (err) {
      console.error('Lỗi thêm sản phẩm:', err);
      return { success: false, message: err.message };
    }
  },

  async updateProduct(id, productData, token) {
    try {
      const res = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      });
      return await res.json();
    } catch (err) {
      console.error('Lỗi cập nhật sản phẩm:', err);
      return { success: false, message: err.message };
    }
  },

  async deleteProduct(id, token) {
    try {
      const res = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return await res.json();
    } catch (err) {
      console.error('Lỗi xóa sản phẩm:', err);
      return { success: false, message: err.message };
    }
  },

  // 3. Đăng nhập / Đăng ký
  async register(userData) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      return await res.json();
    } catch (err) {
      console.error('Lỗi đăng ký:', err);
      return { success: false, message: 'Không thể kết nối đến máy chủ API' };
    }
  },

  async login(email, password) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      return await res.json();
    } catch (err) {
      console.error('Lỗi đăng nhập:', err);
      return { success: false, message: 'Không thể kết nối đến máy chủ API' };
    }
  },

  async getMe(token) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await res.json();
    } catch (err) {
      console.error('Lỗi lấy thông tin me:', err);
      return { success: false };
    }
  },

  // 3.1 Quản lý danh mục (Category)
  async createCategory(catData) {
    try {
      const res = await fetch(`${API_BASE_URL}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(catData)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async updateCategory(id, catData) {
    try {
      const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(catData)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async deleteCategory(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
        method: 'DELETE'
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  // 4. Đơn hàng
  async createOrder(orderData) {
    try {
      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      return await res.json();
    } catch (err) {
      console.error('Lỗi đặt hàng:', err);
      return { success: false, message: err.message };
    }
  },

  async getOrders(token) {
    try {
      const res = await fetch(`${API_BASE_URL}/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await res.json();
    } catch (err) {
      console.error('Lỗi lấy đơn hàng:', err);
      return { success: false, data: [] };
    }
  },

  async updateOrderStatus(id, status, token) {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      return await res.json();
    } catch (err) {
      console.error('Lỗi cập nhật đơn hàng:', err);
      return { success: false, message: err.message };
    }
  },

  // 5. Thanh toán QR
  async createPaymentQR(orderId, paymentMethod) {
    try {
      const res = await fetch(`${API_BASE_URL}/payment/create-qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, paymentMethod })
      });
      return await res.json();
    } catch (err) {
      console.error('Lỗi tạo mã thanh toán QR:', err);
      return { success: false, message: err.message };
    }
  },

  // 6. Trợ lý AI Gemini
  async askAI(message) {
    try {
      const res = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      return await res.json();
    } catch (err) {
      console.error('Lỗi gọi AI Chatbot:', err);
      return {
        success: false,
        reply: 'Hệ thống AI đang bận hoặc chưa khởi động máy chủ Backend. Bạn vui lòng thử lại sau nhé!'
      };
    }
  }
};
