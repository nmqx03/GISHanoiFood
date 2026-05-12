import { BASE_URL, getImageUrl, PLACEHOLDER_IMG } from './config.js';
window.__ph = PLACEHOLDER_IMG;

export function initHotPlacesSystem() {
  loadHotPlaces();
}

async function loadHotPlaces() {
  const container = document.getElementById('hot-list');
  if (!container) return;
  container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted)"><i class="fas fa-spinner fa-spin"></i> Đang tải...</div>';
  try {
    const res = await fetch(`${BASE_URL}/api/stats/hot`);
    if (!res.ok) throw new Error();
    const list = await res.json();
    const badge = document.getElementById('hot-badge');
    if (badge) badge.textContent = list.length;
    renderHotList(list);
  } catch {
    container.innerHTML = '<p style="text-align:center;color:var(--muted);padding:20px">Không thể tải dữ liệu.</p>';
  }
}

function renderHotList(list) {
  const container = document.getElementById('hot-list');
  if (!list.length) { container.innerHTML = '<p style="text-align:center;color:var(--muted);padding:20px">Chưa có dữ liệu.</p>'; return; }

  const rankColors = ['#d00000','#e85d04','#ffba08'];
  container.innerHTML = list.map((item, i) => {
    const p     = item.place;
    const rank  = i + 1;
    const color = rankColors[i] || '#6c757d';
    const icons = ['👑','🥈','🥉'];
    return `
      <div class="hot-item" onclick="window.jumpToHot(${p.id},${p.latitude},${p.longitude})">
        <div class="hi-img">
          <img src="${getImageUrl(p.imageUrl)}" onerror="this.src=window.__ph"/>
          <div class="hi-rank" style="background:${color}">${rank}</div>
        </div>
        <div class="hi-info">
          <h5>${icons[i] || ''} ${p.name}</h5>
          <div class="hi-score"><i class="fas fa-fire"></i> ${item.totalScore} điểm</div>
          <div style="font-size:11px;color:var(--muted);margin-top:2px">${p.location || 'Hà Nội'}</div>
        </div>
        <div style="margin-left:auto;color:var(--muted);display:flex;align-items:center"><i class="fas fa-chevron-right"></i></div>
      </div>`;
  }).join('');
}

window.jumpToHot = function (id, lat, lng) {
  document.getElementById('hot-modal')?.classList.remove('open');
  if (window.showLocationDetails) setTimeout(() => window.showLocationDetails(id), 300);
};