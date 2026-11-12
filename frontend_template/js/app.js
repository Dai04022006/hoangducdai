/**
 * LOGIC GIAO DIỆN TRANG CHỦ & TƯƠNG TÁC NGƯỜI DÙNG
 * Hỗ trợ:
 * - Gian sản phẩm Đang Sale (auto đẩy 3s)
 * - Gian sản phẩm Nổi Bật (1 hàng 5 sp, rating cao 4.6 - 5.0*, auto đẩy 3s)
 * - Banner widget công nghệ (VGA, CPU, Mainboard)
 * - 2 Gian sản phẩm phổ biến (VGA & CPU, mỗi gian 2 hàng x 5 sp)
 * - Quản lý giỏ hàng, đặt hàng, mã QR VietQR / MoMo
 * - Đăng nhập / Đăng ký tài khoản thành viên / Admin
 */

let allProducts = [];
let currentUser = JSON.parse(localStorage.getItem('LHU_USER') || 'null');
let cart = JSON.parse(localStorage.getItem('LHU_CART') || '[]');

let saleAutoTimer = null;
let saleCurrentIndex = 0;
let featuredAutoTimer = null;
let featuredCurrentIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
  initAuthUI();
  initHomeData();
  updateCartUI();
  setupEventListeners();
});

// 1. Quản lý Đăng Nhập / Thành Viên / Admin
function initAuthUI() {
  const authContainer = document.getElementById('userAuthArea');
  const adminLink = document.getElementById('adminPortalLink');

  // Kiểm tra vai trò của người dùng hiện tại
  if (currentUser) {
    const isAdmin = currentUser.role === 'admin';

    // 1. Kiểm soát nút Quản Trị trên header: Chỉ Admin mới thấy nút Quản Trị
    if (adminLink) {
      if (isAdmin) {
        adminLink.classList.remove('hidden');
      } else {
        adminLink.classList.add('hidden');
      }
    }

    // 2. Render thông tin tài khoản
    const roleBadge = isAdmin
      ? '<span style="background:#fee2e2; color:#b91c1c; font-size:11px; padding:2px 7px; border-radius:4px; margin-left:4px; font-weight:700;">Quản Trị Viên</span>' 
      : '<span style="background:#e0f2fe; color:#0369a1; font-size:11px; padding:2px 7px; border-radius:4px; margin-left:4px; font-weight:600;">Thành viên</span>';
    
    if (authContainer) {
      authContainer.innerHTML = `
        <div class="user-pill">
          <span>👤 ${escapeQuotes(currentUser.name || 'Người dùng')}</span>
          ${roleBadge}
        </div>
        <button class="btn-auth" onclick="handleLogout()" title="Đăng xuất">Đăng xuất</button>
      `;
    }
  } else {
    // Khách vãng lai: Tuyệt đối ẩn nút Quản Trị
    if (adminLink) {
      adminLink.classList.add('hidden');
    }

    if (authContainer) {
      authContainer.innerHTML = `
        <button class="btn-auth" onclick="openAuthModal('login')">Đăng nhập</button>
        <button class="btn-auth primary" onclick="openAuthModal('register')">Đăng ký</button>
      `;
    }
  }
}

function handleLogout() {
  localStorage.removeItem('LHU_USER');
  localStorage.removeItem('LHU_TOKEN');
  currentUser = null;
  alert('Đã đăng xuất tài khoản!');
  initAuthUI();
}

// 2. Tải dữ liệu trang chủ
async function initHomeData() {
  let localProducts = [];
  try {
    const localRes = await fetch('../src/data/products.json');
    localProducts = await localRes.json();
  } catch (e) {
    console.warn('Không đọc được file products.json trực tiếp');
  }

  try {
    const res = await API.getProducts();
    if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
      // Hợp nhất dữ liệu API với specs & images phong phú từ localProducts nếu API thiếu
      allProducts = res.data.map(apiProd => {
        const localMatch = localProducts.find(lp => lp.name === apiProd.name || lp._id === apiProd._id);
        return {
          ...apiProd,
          specs: apiProd.specs || (localMatch ? localMatch.specs : {}),
          cpu: apiProd.cpu || (localMatch ? localMatch.cpu : ''),
          gpu: apiProd.gpu || (localMatch ? localMatch.gpu : ''),
          ram: apiProd.ram || (localMatch ? localMatch.ram : ''),
          ssd: apiProd.ssd || (localMatch ? localMatch.ssd : ''),
          images: (apiProd.images && apiProd.images.length > 0) ? apiProd.images : (localMatch ? localMatch.images : [apiProd.image])
        };
      });
    } else {
      allProducts = localProducts;
    }
  } catch (e) {
    allProducts = localProducts;
  }

  // Khởi tạo các phân khu theo yêu cầu
  renderSaleSection();
  renderFeaturedSection();
  renderPopularSections();
  setupFilterAndSearch();
}

// Trích xuất cấu hình tóm tắt thông minh cho thẻ sản phẩm (theo phong cách GearVN)
function extractProductSpecsSummary(p) {
  const chips = [];
  const s = p.specs || {};

  // Chip RAM
  const ramVal = p.ram || s['RAM'] || s['Dung lượng RAM'];
  if (ramVal) {
    chips.push({ icon: '⚡', text: 'RAM ' + ramVal.replace('RAM', '').trim() });
  }

  // Chip Bộ nhớ trong (Storage)
  const storageVal = p.storage || s['Bộ nhớ trong'] || s['Dung lượng'];
  if (storageVal) {
    chips.push({ icon: '💾', text: storageVal });
  }

  // Chip Màn hình (Screen)
  const screenVal = p.screen || s['Màn hình'] || s['Màn hình chính'];
  if (screenVal) {
    const m = screenVal.match(/(\d+(?:\.\d+)?\s*inch)/i);
    chips.push({ icon: '📱', text: m ? m[0] : screenVal.split(' ')[0] });
  }

  // Chip Chipset (CPU)
  const cpuVal = p.cpu || s['Chip xử lý (CPU)'] || s['Chip xử lý'];
  if (cpuVal) {
    const shortCpu = cpuVal.replace('Apple ', '').replace('MediaTek ', '').replace('Snapdragon ', 'Snap ').trim();
    chips.push({ icon: '⚙️', text: shortCpu.split('(')[0].trim() });
  }

  // Chip Pin (Battery)
  const batteryVal = p.battery || s['Pin'];
  if (batteryVal) {
    const m = batteryVal.match(/(\d{4,5}\s*mAh)/i);
    if (m) chips.push({ icon: '🔋', text: m[0] });
  }

  return chips.slice(0, 4);
}
function createProductCardHTML(p, options = {}) {
  const origPrice = Number(p.originalPrice) || 0;
  const salePrice = Number(p.salePrice) || origPrice;
  const discount = origPrice > salePrice ? Math.round(((origPrice - salePrice) / origPrice) * 100) : 0;
  const imgUrl = (p.images && p.images[0]) || p.image || 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=500';
  const widthStyle = options.cardWidth ? `style="width: ${options.cardWidth}; flex-shrink: 0;"` : '';

  // Danh sách chip cấu hình tóm tắt
  const specChips = extractProductSpecsSummary(p);
  let specsBoxHTML = '';
  if (specChips.length > 0) {
    specsBoxHTML = `
      <div class="product-specs-box">
        ${specChips.map(s => `
          <div class="spec-row-item">
            <span class="spec-icon">${s.icon}</span>
            <span class="spec-text">${s.text}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Giá mua kèm ưu đãi (tính 10% - 15% tượng trưng)
  const bundleDiscountVal = Math.round(Math.min(2250000, Math.max(250000, salePrice * 0.12) / 10000) * 10000);

  return `
    <div class="product-card" ${widthStyle}>
      <div class="product-thumb-wrap">
        <a href="productdetail.html?id=${p._id}">
          <img src="${imgUrl}" alt="${escapeQuotes(p.name)}" class="product-thumb" onerror="this.src='https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=500'">
        </a>
      </div>
      <div class="product-details">
        <a href="productdetail.html?id=${p._id}" class="product-name" title="${escapeQuotes(p.name)}">${escapeQuotes(p.name)}</a>
        
        ${specsBoxHTML}

        <div class="price-container">
          ${origPrice > salePrice ? `
            <div class="orig-price-row">
              <span class="original-price">${Number(origPrice).toLocaleString('vi-VN')}đ</span>
              <span class="discount-badge">-${discount}%</span>
            </div>
          ` : `
            <div class="orig-price-row" style="visibility:hidden;">
              <span class="original-price">0đ</span>
            </div>
          `}
          <div class="sale-price">${Number(salePrice).toLocaleString('vi-VN')}đ</div>
        </div>

        <!-- Khung mua kèm giá ưu đãi (Ảnh mẫu) -->
        <div class="bundle-deal-box">
          <div class="bundle-deal-content">
            <span class="bundle-label">Mua kèm giá ưu đãi:</span>
            <span class="bundle-price">${bundleDiscountVal.toLocaleString('vi-VN')}đ</span>
          </div>
          <span class="bundle-badge">+20</span>
        </div>

        <div class="card-actions">
          <button class="btn-add-cart" onclick="addToCart('${p._id || Math.random()}', '${escapeQuotes(p.name)}', ${salePrice}, '${imgUrl}')">
            🛒 Thêm giỏ
          </button>
          <a href="productdetail.html?id=${p._id}" class="btn-view-quick" title="Xem chi tiết">
            👁️
          </a>
        </div>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// GIAN 1: SẢN PHẨM ĐANG SALE (Giảm 15% - 35% so với giá bán website, auto đẩy 3s)
// -------------------------------------------------------------
function renderSaleSection() {
  const track = document.getElementById('saleSliderTrack');
  if (!track) return;

  // Lọc sản phẩm có mức giảm giá từ 15% đến 35% (hoặc có giá sale tốt)
  const saleProducts = allProducts.filter(p => {
    const orig = Number(p.originalPrice) || 0;
    const sale = Number(p.salePrice) || orig;
    if (orig <= sale) return false;
    const pct = ((orig - sale) / orig) * 100;
    return pct >= 15 && pct <= 36;
  });

  const displayList = saleProducts.length >= 5 ? saleProducts : allProducts.slice(0, 10);
  
  // Mỗi card chiếm ~230px
  track.innerHTML = displayList.map(p => createProductCardHTML(p, { cardWidth: '240px', isHot: true })).join('');

  // Tự động đẩy qua lại sau mỗi 3 giây
  startSaleSliderAuto(displayList.length);
}

function startSaleSliderAuto(totalCount) {
  if (saleAutoTimer) clearInterval(saleAutoTimer);
  const track = document.getElementById('saleSliderTrack');
  if (!track || totalCount <= 4) return;

  const cardWidth = 240 + 18; // width + gap
  const maxShift = Math.max(0, totalCount - 4);

  saleAutoTimer = setInterval(() => {
    saleCurrentIndex++;
    if (saleCurrentIndex > maxShift) {
      saleCurrentIndex = 0;
    }
    track.style.transform = `translateX(-${saleCurrentIndex * cardWidth}px)`;
  }, 3000);
}

function slideSale(direction) {
  const track = document.getElementById('saleSliderTrack');
  if (!track) return;
  const cards = track.querySelectorAll('.product-card');
  const totalCount = cards.length;
  const cardWidth = 240 + 18;
  const maxShift = Math.max(0, totalCount - 4);

  if (direction === 'next') {
    saleCurrentIndex = (saleCurrentIndex >= maxShift) ? 0 : saleCurrentIndex + 1;
  } else {
    saleCurrentIndex = (saleCurrentIndex <= 0) ? maxShift : saleCurrentIndex - 1;
  }
  track.style.transform = `translateX(-${saleCurrentIndex * cardWidth}px)`;
}

// -------------------------------------------------------------
// GIAN 2: SẢN PHẨM NỔI BẬT (Rating cao: 4.6, 4.7, 4.9, 5.0*, 1 hàng gồm 5 sp, auto đẩy 3s)
// -------------------------------------------------------------
function renderFeaturedSection() {
  const track = document.getElementById('featuredSliderTrack');
  if (!track) return;

  // Lọc sản phẩm có đánh giá cao (>= 4.6 sao)
  const highRated = allProducts.filter(p => Number(p.rating) >= 4.6);
  highRated.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));

  const displayList = highRated.length >= 5 ? highRated : allProducts.slice(0, 10);

  // Hiển thị dạng trượt, mỗi card vừa 1/5 container (~232px)
  track.innerHTML = displayList.map(p => createProductCardHTML(p, { cardWidth: '232px' })).join('');

  startFeaturedSliderAuto(displayList.length);
}

function startFeaturedSliderAuto(totalCount) {
  if (featuredAutoTimer) clearInterval(featuredAutoTimer);
  const track = document.getElementById('featuredSliderTrack');
  if (!track || totalCount <= 5) return;

  const cardWidth = 232 + 18; // width + gap
  const maxShift = Math.max(0, totalCount - 5);

  featuredAutoTimer = setInterval(() => {
    featuredCurrentIndex++;
    if (featuredCurrentIndex > maxShift) {
      featuredCurrentIndex = 0;
    }
    track.style.transform = `translateX(-${featuredCurrentIndex * cardWidth}px)`;
  }, 3000);
}

function slideFeatured(direction) {
  const track = document.getElementById('featuredSliderTrack');
  if (!track) return;
  const cards = track.querySelectorAll('.product-card');
  const totalCount = cards.length;
  const cardWidth = 232 + 18;
  const maxShift = Math.max(0, totalCount - 5);

  if (direction === 'next') {
    featuredCurrentIndex = (featuredCurrentIndex >= maxShift) ? 0 : featuredCurrentIndex + 1;
  } else {
    featuredCurrentIndex = (featuredCurrentIndex <= 0) ? maxShift : featuredCurrentIndex - 1;
  }
  track.style.transform = `translateX(-${featuredCurrentIndex * cardWidth}px)`;
}

// -------------------------------------------------------------
// GIAN 3 & 4: 2 GIAN SẢN PHẨM ĐANG PHỔ BIẾN (VGA & CPU: mỗi gian 2 hàng x 5 sản phẩm = 10 sản phẩm)
// -------------------------------------------------------------
function renderPopularSections() {
  // Gian Phổ Biến 1: Apple iPhone Chính Hãng
  const iphoneGrid = document.getElementById('popularIphoneGrid') || document.getElementById('popularVgaGrid');
  if (iphoneGrid) {
    const iphones = allProducts.filter(p => {
      const name = (p.name || '').toLowerCase();
      const brand = (p.brand || '').toLowerCase();
      const rawCat = p.category ? (p.category.slug || p.category._id || p.category.name || p.category) : '';
      const cat = String(rawCat).toLowerCase();
      return cat.includes('iphone') || brand.includes('apple') || name.includes('iphone');
    });
    iphoneGrid.innerHTML = iphones.slice(0, 10).map(p => createProductCardHTML(p)).join('');
  }

  // Gian Phổ Biến 2: Samsung Galaxy Cao Cấp & Đột Phá
  const samsungGrid = document.getElementById('popularSamsungGrid') || document.getElementById('popularCpuGrid');
  if (samsungGrid) {
    const samsungs = allProducts.filter(p => {
      const name = (p.name || '').toLowerCase();
      const brand = (p.brand || '').toLowerCase();
      const rawCat = p.category ? (p.category.slug || p.category._id || p.category.name || p.category) : '';
      const cat = String(rawCat).toLowerCase();
      return cat.includes('samsung') || brand.includes('samsung') || name.includes('samsung') || name.includes('galaxy');
    });
    samsungGrid.innerHTML = samsungs.slice(0, 10).map(p => createProductCardHTML(p)).join('');
  }
}
// -------------------------------------------------------------
// TÌM KIẾM SẢN PHẨM
// -------------------------------------------------------------
function setupFilterAndSearch() {
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const val = e.target.value.trim().toLowerCase();
    const searchModal = document.getElementById('searchResultsArea');
    const searchGrid = document.getElementById('searchGrid');

    if (!val) {
      if (searchModal) searchModal.classList.add('hidden');
      return;
    }

    const matched = allProducts.filter(p => 
      (p.name || '').toLowerCase().includes(val) ||
      (p.description || '').toLowerCase().includes(val)
    );

    if (searchModal && searchGrid) {
      searchModal.classList.remove('hidden');
      if (matched.length === 0) {
        searchGrid.innerHTML = `<div class="state-box"><h3>🔍 Không tìm thấy linh kiện phù hợp với "${escapeQuotes(val)}"!</h3></div>`;
      } else {
        searchGrid.innerHTML = matched.map(p => createProductCardHTML(p)).join('');
      }
    }
  });
}

function closeSearchArea() {
  const searchModal = document.getElementById('searchResultsArea');
  if (searchModal) searchModal.classList.add('hidden');
}

// -------------------------------------------------------------
// GIỎ HÀNG (CART LOGIC)
// -------------------------------------------------------------
function addToCart(id, name, price, image, maxStock = null) {
  const existing = cart.find(item => item.productId === id || item.name === name);
  const targetStock = maxStock || 999;

  if (existing) {
    if (existing.quantity >= targetStock) {
      alert(`⚠️ Rất tiếc, kho chỉ còn tối đa ${targetStock} sản phẩm cho món hàng này!`);
      return;
    }
    existing.quantity += 1;
  } else {
    cart.push({
      productId: id,
      name: name,
      price: price,
      image: image,
      quantity: 1,
      maxStock: targetStock
    });
  }
  saveCart();
  updateCartUI();
  showToast(`✅ Đã thêm "${name}" vào giỏ hàng!`);
}

function updateCartQty(index, delta) {
  if (cart[index]) {
    const item = cart[index];
    const newQty = item.quantity + delta;

    if (newQty <= 0) {
      if (confirm(`Bạn có chắc chắn muốn xóa "${item.name}" khỏi giỏ hàng?`)) {
        cart.splice(index, 1);
      }
    } else {
      if (item.maxStock && newQty > item.maxStock) {
        alert(`⚠️ Số lượng tối đa trong kho chỉ còn ${item.maxStock} sản phẩm!`);
        item.quantity = item.maxStock;
      } else {
        item.quantity = newQty;
      }
    }
    saveCart();
    updateCartUI();
  }
}

function handleCartInputQty(index, val) {
  if (cart[index]) {
    const item = cart[index];
    let num = parseInt(val, 10);
    if (isNaN(num) || num < 1) num = 1;
    if (item.maxStock && num > item.maxStock) {
      alert(`⚠️ Số lượng tối đa trong kho chỉ còn ${item.maxStock} sản phẩm!`);
      num = item.maxStock;
    }
    item.quantity = num;
    saveCart();
    updateCartUI();
  }
}

function removeCartItem(index) {
  cart.splice(index, 1);
  saveCart();
  updateCartUI();
}

function saveCart() {
  localStorage.setItem('LHU_CART', JSON.stringify(cart));
}

function updateCartUI() {
  const badge = document.getElementById('cartBadge');
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (badge) badge.innerText = count;

  const body = document.getElementById('cartItemsBody');
  const subtotalEl = document.getElementById('cartSubtotal');
  if (!body) return;

  if (cart.length === 0) {
    body.innerHTML = `
      <div style="text-align: center; padding: 40px 10px; color: #64748b;">
        <span style="font-size: 40px;">🛒</span>
        <p style="margin-top: 10px; font-weight: 500;">Giỏ hàng của bạn đang trống</p>
      </div>
    `;
    if (subtotalEl) subtotalEl.innerText = '0 đ';
    return;
  }

  let total = 0;
  body.innerHTML = cart.map((item, idx) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    return `
      <div class="cart-item">
        <img src="${item.image || 'https://via.placeholder.com/60'}" class="cart-item-img" alt="">
        <div class="cart-item-info">
          <div class="cart-item-name" title="${item.name}">${item.name}</div>
          <div class="cart-item-price">${Number(item.price).toLocaleString('vi-VN')} đ</div>
          <div class="qty-control">
            <button class="qty-btn" onclick="updateCartQty(${idx}, -1)" title="Giảm">-</button>
            <input type="number" class="qty-input" value="${item.quantity}" min="1" max="${item.maxStock || 999}" onchange="handleCartInputQty(${idx}, this.value)">
            <button class="qty-btn" onclick="updateCartQty(${idx}, 1)" title="Tăng">+</button>
          </div>
        </div>
        <button class="btn-item-del" onclick="removeCartItem(${idx})" title="Xóa khỏi giỏ">✕</button>
      </div>
    `;
  }).join('');

  if (subtotalEl) subtotalEl.innerText = `${total.toLocaleString('vi-VN')} đ`;
}

function openCartDrawer() {
  const drawer = document.getElementById('cartDrawer');
  const backdrop = document.getElementById('cartBackdrop');
  if (drawer && backdrop) {
    drawer.classList.add('open');
    backdrop.style.display = 'block';
  }
}

function closeCartDrawer() {
  const drawer = document.getElementById('cartDrawer');
  const backdrop = document.getElementById('cartBackdrop');
  if (drawer && backdrop) {
    drawer.classList.remove('open');
    backdrop.style.display = 'none';
  }
}

// -------------------------------------------------------------
// ĐẶT HÀNG & THANH TOÁN
// -------------------------------------------------------------
function openCheckoutModal() {
  if (cart.length === 0) {
    alert('Giỏ hàng của bạn đang trống!');
    return;
  }
  closeCartDrawer();
  const modal = document.getElementById('checkoutModal');
  if (modal) {
    modal.classList.remove('hidden');
    // Tự động điền thông tin nếu thành viên đã đăng nhập
    if (currentUser) {
      const nameInput = document.querySelector('input[name="customerName"]');
      const emailInput = document.querySelector('input[name="customerEmail"]');
      const phoneInput = document.querySelector('input[name="customerPhone"]');
      if (nameInput && currentUser.name) nameInput.value = currentUser.name;
      if (emailInput && currentUser.email) emailInput.value = currentUser.email;
      if (phoneInput && currentUser.phone) phoneInput.value = currentUser.phone;
    }
  }
}

function closeCheckoutModal() {
  const modal = document.getElementById('checkoutModal');
  if (modal) modal.classList.add('hidden');
}

async function handleCheckoutSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const btn = document.getElementById('btnSubmitOrder');
  if (btn) btn.innerText = 'Đang xử lý đơn hàng...';

  const orderData = {
    customerName: form.customerName.value.trim(),
    customerPhone: form.customerPhone.value.trim(),
    customerEmail: form.customerEmail.value.trim(),
    shippingAddress: form.shippingAddress.value.trim(),
    paymentMethod: form.paymentMethod.value,
    note: form.note.value.trim(),
    items: cart.map(i => ({
      productId: (i.productId && i.productId.length === 24) ? i.productId : "670f5e123456789012345678", // MongoDB ObjectId fallback
      quantity: i.quantity
    }))
  };

  try {
    const res = await API.createOrder(orderData);
    if (res && res.success) {
      const order = res.data;
      cart = [];
      saveCart();
      updateCartUI();
      closeCheckoutModal();

      if (order.paymentMethod === 'VIETQR' || order.paymentMethod === 'MOMO_QR') {
        openQRModal(order);
      } else {
        alert(`🎉 Đặt hàng thành công! Mã đơn: #${order.orderCode}\nCảm ơn bạn đã mua sắm tại NovaPhone Store!`);
      }
    } else {
      // Demo đặt hàng offline nếu Backend chưa đồng bộ MongoDB
      const fallbackCode = 'DH' + Date.now().toString().slice(-8);
      const totalAmount = cart.reduce((s, i) => s + i.price * i.quantity, 0) + 25000;
      const fakeOrder = {
        _id: 'order_demo',
        orderCode: fallbackCode,
        totalAmount: totalAmount,
        paymentMethod: orderData.paymentMethod
      };
      cart = [];
      saveCart();
      updateCartUI();
      closeCheckoutModal();

      if (fakeOrder.paymentMethod === 'VIETQR' || fakeOrder.paymentMethod === 'MOMO_QR') {
        openQRModal(fakeOrder);
      } else {
        alert(`🎉 Đặt hàng thành công! Mã đơn: #${fakeOrder.orderCode}\nCảm ơn bạn đã mua sắm tại NovaPhone Store!`);
      }
    }
  } catch (err) {
    alert('Đặt hàng hoàn tất! Chúng tôi sẽ liên hệ giao hàng sớm.');
    closeCheckoutModal();
  } finally {
    if (btn) btn.innerText = 'Xác Nhận Đặt Hàng';
  }
}

function openQRModal(order) {
  const modal = document.getElementById('qrModal');
  const qrImg = document.getElementById('qrImage');
  const codeEl = document.getElementById('qrOrderCode');
  const amtEl = document.getElementById('qrTotalAmount');
  const noteEl = document.getElementById('qrNoteInfo');

  if (!modal) return;
  const total = order.totalAmount || 0;
  const code = order.orderCode || 'DH123456';

  if (codeEl) codeEl.innerText = `#${code}`;
  if (amtEl) amtEl.innerText = `${total.toLocaleString('vi-VN')} đ`;
  if (noteEl) noteEl.innerText = `Nội dung CK: DH ${code}`;

  if (qrImg) {
    if (order.paymentMethod === 'MOMO_QR') {
      const momoData = encodeURIComponent(`2|99|0966106874|1ST STORE||0|0|${total}|DH${code}|transfer_myqr`);
      qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${momoData}`;
    } else {
      qrImg.src = `https://img.vietqr.io/image/MB-0966106874-compact2.png?amount=${total}&addInfo=DH%20${code}&accountName=1ST%20STORE`;
    }
  }
  modal.classList.remove('hidden');
}

function closeQRModal() {
  const modal = document.getElementById('qrModal');
  if (modal) modal.classList.add('hidden');
}

// -------------------------------------------------------------
// CHI TIẾT SẢN PHẨM MODAL
// -------------------------------------------------------------
function viewProductDetail(id) {
  const p = allProducts.find(item => item._id === id);
  if (!p) return;

  const modal = document.getElementById('productDetailModal');
  const content = document.getElementById('productDetailContent');
  if (!modal || !content) return;

  const origPrice = Number(p.originalPrice) || 0;
  const salePrice = Number(p.salePrice) || origPrice;
  const catName = p.category ? (p.category.name || p.category) : 'Linh Kiện Máy Tính';
  const imgUrl = p.image || 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=500';

  content.innerHTML = `
    <div style="display: flex; gap: 20px; flex-wrap: wrap;">
      <div style="flex: 1; min-width: 240px; text-align: center; background:#f8fafc; padding:16px; border-radius:12px; border:1px solid #e2e8f0;">
        <img src="${imgUrl}" alt="${p.name}" style="max-width: 100%; max-height: 250px; object-fit: contain;">
      </div>
      <div style="flex: 1.4; min-width: 260px;">
        <span style="font-size: 12px; color: var(--primary); font-weight: 700; text-transform: uppercase;">${catName}</span>
        <h3 style="font-size: 18px; margin: 6px 0 10px; font-weight: 700; color: #0f172a;">${p.name}</h3>
        <div style="color: #10b981; font-size: 13px; font-weight: 600; margin-bottom: 12px;">
          🟢 Tình trạng: Còn hàng (Sẵn sàng giao) | Bảo hành chính hãng 36 tháng
        </div>
        <div style="margin-bottom: 16px;">
          <span style="font-size: 22px; font-weight: 800; color: #dc2626;">${Number(salePrice).toLocaleString('vi-VN')} đ</span>
          ${origPrice > salePrice ? `<span style="font-size: 14px; color: #94a3b8; text-decoration: line-through; margin-left: 10px;">${Number(origPrice).toLocaleString('vi-VN')} đ</span>` : ''}
        </div>
        <p style="font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 20px;">
          ${p.description || 'Sản phẩm chính hãng, đầy đủ bảo hành 36 tháng từ nhà sản xuất.'}
        </p>
        <button class="btn-checkout-start" onclick="addToCart('${p._id}', '${escapeQuotes(p.name)}', ${salePrice}, '${imgUrl}'); closeProductDetailModal();">
          🛒 Thêm Vào Giỏ Hàng Ngay
        </button>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
}

function closeProductDetailModal() {
  const modal = document.getElementById('productDetailModal');
  if (modal) modal.classList.add('hidden');
}

// -------------------------------------------------------------
// MODAL ĐĂNG NHẬP / ĐĂNG KÝ
// -------------------------------------------------------------
function ensureAuthModal() {
  let modal = document.getElementById('authModal');
  if (modal) return modal;

  // Tự động tạo Auth Modal nếu trang chưa có sẵn
  const modalHTML = `
    <div class="modal-overlay hidden" id="authModal">
      <div class="modal-content" style="max-width: 440px; position:relative;">
        <div class="modal-header" style="padding-bottom: 0; border-bottom: none;">
          <div style="display: flex; gap: 10px; width: 100%; border-bottom: 1px solid var(--border); padding-bottom: 12px;">
            <button id="tabAuthLogin" class="btn-auth active" onclick="switchAuthTab('login')" style="flex:1;">Đăng Nhập</button>
            <button id="tabAuthRegister" class="btn-auth" onclick="switchAuthTab('register')" style="flex:1;">Đăng Ký Thành Viên</button>
          </div>
          <button class="btn-close" style="position:absolute; right:16px; top:16px;" onclick="closeAuthModal()">✕</button>
        </div>
        <div class="modal-body">
          <form id="loginForm" onsubmit="handleLoginSubmit(event)">
            <div class="form-group">
              <label class="form-label">Email tài khoản (*)</label>
              <input type="email" name="email" class="form-input" placeholder="admin@novaphone.vn hoặc email của bạn" required>
            </div>
            <div class="form-group">
              <label class="form-label">Mật khẩu (*)</label>
              <input type="password" name="password" class="form-input" placeholder="Nhập mật khẩu..." required>
            </div>
            <button type="submit" class="btn-checkout-start" style="margin-top: 10px;">
              Đăng Nhập Hệ Thống
            </button>
            <div style="margin-top: 12px; font-size: 12px; color: #64748b; text-align: center;">
              Tài khoản Admin: <strong>admin@novaphone.vn</strong> / <strong>AdminPassword123@</strong>
            </div>
          </form>

          <form id="registerForm" class="hidden" onsubmit="handleRegisterSubmit(event)">
            <div class="form-group">
              <label class="form-label">Họ và Tên (*)</label>
              <input type="text" name="name" class="form-input" placeholder="Nguyễn Văn A" required>
            </div>
            <div class="form-group">
              <label class="form-label">Email (*)</label>
              <input type="email" name="email" class="form-input" placeholder="email@gmail.com" required>
            </div>
            <div class="form-group">
              <label class="form-label">Số điện thoại (*)</label>
              <input type="tel" name="phone" class="form-input" placeholder="09xxxxxxxx" required>
            </div>
            <div class="form-group">
              <label class="form-label">Mật khẩu (*)</label>
              <input type="password" name="password" class="form-input" placeholder="Mật khẩu tối thiểu 6 ký tự..." required>
            </div>
            <button type="submit" class="btn-checkout-start" style="margin-top: 10px;">
              Đăng Ký Tài Khoản Khách Hàng
            </button>
          </form>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  return document.getElementById('authModal');
}

function openAuthModal(mode = 'login') {
  const modal = ensureAuthModal();
  if (!modal) return;
  modal.classList.remove('hidden');
  switchAuthTab(mode);
}

function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.add('hidden');
}

function switchAuthTab(mode) {
  const loginForm = document.getElementById('loginForm');
  const regForm = document.getElementById('registerForm');
  const btnLoginTab = document.getElementById('tabAuthLogin');
  const btnRegTab = document.getElementById('tabAuthRegister');

  if (mode === 'login') {
    loginForm.classList.remove('hidden');
    regForm.classList.add('hidden');
    btnLoginTab.classList.add('active');
    btnRegTab.classList.remove('active');
  } else {
    loginForm.classList.add('hidden');
    regForm.classList.remove('hidden');
    btnLoginTab.classList.remove('active');
    btnRegTab.classList.add('active');
  }
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const email = form.email.value.trim();
  const password = form.password.value;

  try {
    const res = await API.login(email, password);
    if (res && res.success) {
      localStorage.setItem('LHU_TOKEN', res.token);
      localStorage.setItem('LHU_USER', JSON.stringify(res.user));
      currentUser = res.user;
      alert(`Xin chào ${res.user.name}! Đăng nhập thành công.`);
      closeAuthModal();
      initAuthUI();
      if (res.user.role === 'admin') {
        if (confirm('Tài khoản của bạn là Admin. Bạn có muốn chuyển sang Trang Quản Trị không?')) {
          window.location.href = 'admin.html';
        }
      }
    } else {
      // Demo login nếu tài khoản mẫu
      if (email === 'admin@novaphone.vn') {
        const adminUser = { name: 'Quản Trị Viên NovaPhone', email: 'admin@novaphone.vn', role: 'admin' };
        localStorage.setItem('LHU_USER', JSON.stringify(adminUser));
        currentUser = adminUser;
        alert('Đăng nhập Quản Trị Viên thành công!');
        closeAuthModal();
        initAuthUI();
      } else {
        alert('❌ Lỗi: ' + (res.message || 'Email hoặc mật khẩu không chính xác'));
      }
    }
  } catch (err) {
    alert('Không thể kết nối đến server đăng nhập.');
  }
}

async function handleRegisterSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const userData = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    phone: form.phone.value.trim(),
    password: form.password.value
  };

  try {
    const res = await API.register(userData);
    if (res && res.success) {
      localStorage.setItem('LHU_TOKEN', res.token);
      localStorage.setItem('LHU_USER', JSON.stringify(res.user));
      currentUser = res.user;
      alert('🎉 Chúc mừng bạn đã đăng ký tài khoản thành viên thành công!');
      closeAuthModal();
      initAuthUI();
    } else {
      alert('❌ Đăng ký thất bại: ' + (res.message || 'Lỗi server'));
    }
  } catch (err) {
    alert('Lỗi đăng ký tài khoản.');
  }
}

// Helpers
function escapeQuotes(str) {
  if (!str) return '';
  return String(str).replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function showToast(msg) {
  const toast = document.createElement('div');
  toast.innerText = msg;
  toast.style.position = 'fixed';
  toast.style.bottom = '95px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.background = '#0f172a';
  toast.style.color = '#fff';
  toast.style.padding = '10px 22px';
  toast.style.borderRadius = '25px';
  toast.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
  toast.style.fontSize = '14px';
  toast.style.zIndex = '9999';
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 2500);
}

function setupEventListeners() {
  // ESC to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCartDrawer();
      closeCheckoutModal();
      closeQRModal();
      closeProductDetailModal();
      closeAuthModal();
      closeSearchArea();
    }
  });
}
