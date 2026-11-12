/**
 * MODULE GIAO DIỆN CHUNG: MEGA MENU THƯƠNG HIỆU & DANH MỤC ĐIỆN THOẠI
 * Hỗ trợ rê chuột (hover) để xem hãng điện thoại cấp 1 và flyout cấp 2 chi tiết
 */

let globalCategories = [];

// Khởi tạo Mega Menu
async function initMegaMenu() {
  const catListContainer = document.getElementById('megaCatList');
  const catPanelContainer = document.getElementById('megaCatPanel');
  const triggerBtn = document.getElementById('megaMenuTrigger');
  const dropdownWrap = document.getElementById('megaDropdown');
  const quickIconsGrid = document.getElementById('quickIconsGrid');

  if (!catListContainer || !catPanelContainer) return;

  // Luôn nạp dữ liệu danh mục chuẩn từ categories.json
  let localCategories = [];
  try {
    const localRes = await fetch('../src/data/categories.json');
    localCategories = await localRes.json();
  } catch (e) {
    console.warn('Không đọc được file categories.json trực tiếp');
  }

  try {
    const res = await API.getCategories();
    if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
      globalCategories = res.data.map(apiCat => {
        const localMatch = localCategories.find(l => l.slug === apiCat.slug || l.name === apiCat.name);
        return {
          ...apiCat,
          icon: apiCat.icon || (localMatch ? localMatch.icon : '📱'),
          subcategories: apiCat.subcategories || (localMatch ? localMatch.subcategories : {})
        };
      });
    } else {
      globalCategories = localCategories;
    }
  } catch (e) {
    globalCategories = localCategories;
  }

  if (globalCategories.length === 0) return;

  // 1. Render Dãy Icon Thương Hiệu Điện Thoại Nổi Bật (Apple, Samsung, Xiaomi, OPPO, Vivo, Realme)
  if (quickIconsGrid) {
    quickIconsGrid.innerHTML = globalCategories.map(c => `
      <a href="category.html?slug=${c.slug}" class="quick-cat-btn">
        <div class="quick-icon-box">${c.icon || '📱'}</div>
        <span class="quick-cat-name">${c.name}</span>
      </a>
    `).join('');
  }

  // 2. Render Cột trái danh mục Mega Menu
  catListContainer.innerHTML = globalCategories.map((c, idx) => `
    <div class="mega-cat-item ${idx === 0 ? 'active' : ''}" data-index="${idx}" onmouseenter="renderMegaPanel(${idx})">
      <div class="cat-icon-name">
        <span>${c.icon || '📱'}</span>
        <span>${c.name}</span>
      </div>
      <span class="cat-arrow">›</span>
    </div>
  `).join('');

  // 3. Render Panel chi tiết ban đầu (mặc định tab đầu tiên - Apple iPhone)
  renderMegaPanel(0);

  // 4. Sự kiện click / hover cho nút "DANH MỤC"
  if (triggerBtn && dropdownWrap) {
    let hideTimer = null;

    triggerBtn.addEventListener('mouseenter', () => {
      clearTimeout(hideTimer);
      dropdownWrap.classList.remove('hidden');
      triggerBtn.classList.add('active');
    });

    triggerBtn.addEventListener('mouseleave', () => {
      hideTimer = setTimeout(() => {
        dropdownWrap.classList.add('hidden');
        triggerBtn.classList.remove('active');
      }, 250);
    });

    dropdownWrap.addEventListener('mouseenter', () => {
      clearTimeout(hideTimer);
    });

    dropdownWrap.addEventListener('mouseleave', () => {
      hideTimer = setTimeout(() => {
        dropdownWrap.classList.add('hidden');
        triggerBtn.classList.remove('active');
      }, 200);
    });

    triggerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownWrap.classList.toggle('hidden');
      triggerBtn.classList.toggle('active');
    });
  }
}

// Render Panel bên phải theo hover
function renderMegaPanel(index) {
  const cat = globalCategories[index];
  const catPanelContainer = document.getElementById('megaCatPanel');
  if (!cat || !catPanelContainer) return;

  // Cập nhật active class cột trái
  document.querySelectorAll('.mega-cat-item').forEach((item, idx) => {
    if (idx === index) item.classList.add('active');
    else item.classList.remove('active');
  });

  const subcats = cat.subcategories || {};
  const subcatKeys = Object.keys(subcats);

  let gridColsHTML = '';
  subcatKeys.forEach(title => {
    const items = subcats[title] || [];
    gridColsHTML += `
      <div class="subcat-col">
        <a href="category.html?slug=${cat.slug}&filterGroup=${encodeURIComponent(title)}" class="subcat-col-title-link">
          <h4 class="subcat-col-title">${title} ›</h4>
        </a>
        <ul class="subcat-links-list">
          ${items.map(item => `<li><a href="category.html?slug=${cat.slug}&filter=${encodeURIComponent(item)}">${item}</a></li>`).join('')}
        </ul>
      </div>
    `;
  });

  catPanelContainer.innerHTML = `
    <div class="mega-panel-header">
      <h3 class="mega-panel-title">${cat.name}</h3>
      <a href="category.html?slug=${cat.slug}" class="mega-panel-link-all">
        Xem tất cả điện thoại ${cat.name} ›
      </a>
    </div>
    <div class="mega-subcat-grid">
      ${gridColsHTML || '<p style="color:#64748b; font-size:13px;">Đang cập nhật các dòng điện thoại...</p>'}
    </div>
  `;
}

if (typeof window !== 'undefined') {
  window.initMegaMenu = initMegaMenu;
  window.renderMegaPanel = renderMegaPanel;
}
