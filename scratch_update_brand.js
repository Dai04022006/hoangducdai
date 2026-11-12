const fs = require('fs');

/**
 * Script cập nhật thương hiệu và thông tin website sang NOVAPHONE
 */
function replaceInFile(filePath, replacements) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  for (const [from, to] of replacements) {
    content = content.split(from).join(to);
  }
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated:', filePath);
  } else {
    console.log('No change needed:', filePath);
  }
}

const replacements = [
  ['TECH PHONE — Hệ Thống Smartphone & Điện Thoại Chính Hãng', 'NOVAPHONE — Hệ Thống Flagship & Smartphone Chính Hãng'],
  ['Danh Mục Smartphone Chính Hãng — TECH PHONE', 'Danh Mục Smartphone Chính Hãng — NOVAPHONE'],
  ['Chi Tiết Smartphone — TECH PHONE', 'Chi Tiết Smartphone — NOVAPHONE'],
  ['Bảng Điều Khiển Quản Trị — TECH PHONE ADMIN', 'Bảng Điều Khiển Quản Trị — NOVAPHONE ADMIN'],
  ['TECH PHONE ADMIN', 'NOVAPHONE ADMIN'],
  ['<span>TECH PHONE</span>', '<span>NOVAPHONE</span>'],
  ['TECH PHONE AI Assistant', 'NOVAPHONE AI Assistant'],
  ['Tech Phone Store', 'NovaPhone Store'],
  ['TECH PHONE STORE', 'NOVAPHONE STORE'],
  ['Tech Phone', 'NovaPhone'],
  ['TECH PHONE', 'NOVAPHONE'],
  ['LHU Tech Store', 'NovaPhone Store'],
  ['Quản Trị Viên LHU', 'Quản Trị Viên NovaPhone'],
  ['admin@lhu.edu.vn', 'admin@novaphone.vn']
];

const targetFiles = [
  'frontend_template/index.html',
  'frontend_template/category.html',
  'frontend_template/productdetail.html',
  'frontend_template/admin.html',
  'frontend_template/js/app.js',
  'src/controllers/aiController.js'
];

targetFiles.forEach(f => replaceInFile(f, replacements));
console.log('Done replacement.');
