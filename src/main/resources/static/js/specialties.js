import { BASE_URL, getImageUrl, PLACEHOLDER_IMG } from './config.js';
window.__ph = PLACEHOLDER_IMG;

export function initSpecialtiesSystem() {
  loadSpecialties();
}

async function loadSpecialties() {
  const list = document.getElementById('specialties-list');
  if (!list) return;
  try {
    const res  = await fetch(`${BASE_URL}/api/specialties`);
    const data = await res.json();
    if (!data.length) { list.innerHTML = '<p style="color:var(--muted)">Chưa có dữ liệu.</p>'; return; }
    list.innerHTML = data.map(item => `
      <div class="spec-card">
        <img src="${getImageUrl(item.imageUrl, 'https://via.placeholder.com/300x150?text=No+Image')}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/300x150?text=No+Image'"/>
        <div class="sc-body">
          <h4>${item.name}</h4>
          <div class="sc-origin"><i class="fas fa-map-marker-alt" style="color:var(--accent)"></i> ${item.origin || 'Đặc sản Hà Nội'}</div>
          <div class="sc-desc">${item.description || 'Đang cập nhật mô tả...'}</div>
          ${item.priceRange ? `<span class="sc-price"><i class="fas fa-tag"></i> ${item.priceRange}</span>` : ''}
        </div>
      </div>`).join('');
  } catch {
    list.innerHTML = '<p style="color:var(--muted)">Lỗi tải dữ liệu.</p>';
  }
}