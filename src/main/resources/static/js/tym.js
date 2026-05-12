import { BASE_URL, getImageUrl, PLACEHOLDER_IMG } from './config.js';
window.__ph = PLACEHOLDER_IMG;
import { getCurrentUser } from './auth.js';

let placesData = [];

export function initFavoriteSystem(allPlaces) {
  placesData = allPlaces;
  window.handleToggleFavorite = handleToggleFavorite;
  window.openFavoriteModal    = openFavoriteModal;
  window.removeFavorite       = removeFavorite;

  // Auto-load when modal opens
  const favBtn = document.querySelector('[data-action="favorites"]');
  if (favBtn) favBtn.addEventListener('click', () => openFavoriteModal());
}

export async function getFavoriteStatus(placeId) {
  const user = getCurrentUser();
  if (!user?.id) return false;
  try {
    const res = await fetch(`${BASE_URL}/api/favorites/check?userId=${user.id}&placeId=${placeId}`);
    const data = await res.json();
    return data.isFavorite;
  } catch { return false; }
}

export async function handleToggleFavorite(placeId, btnElement) {
  const user = getCurrentUser();
  if (!user?.id) {
    if (confirm('Bạn cần đăng nhập. Đến trang đăng nhập?')) window.location.href = '/login';
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/api/favorites/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, placeId })
    });
    const data = await res.json();

    if (btnElement?.querySelector) {
      const icon = btnElement.querySelector('i');
      if (icon) {
        if (data.status === 'added') {
          icon.className = 'fas fa-heart';
          icon.style.color = 'var(--accent)';
          btnElement.classList?.add?.('fav');
        } else {
          icon.className = 'far fa-heart';
          icon.style.color = '';
          btnElement.classList?.remove?.('fav');
        }
      }
    }

    // Refresh fav modal if open
    const m = document.getElementById('fav-modal');
    if (m && m.classList.contains('open')) openFavoriteModal();
  } catch (e) {
    console.error(e);
    alert('Lỗi kết nối');
  }
}

async function openFavoriteModal() {
  const user = getCurrentUser();
  if (!user?.id) { alert('Vui lòng đăng nhập!'); return; }

  const modal = document.getElementById('fav-modal');
  const list  = document.getElementById('fav-list');
  if (!modal) return;
  modal.classList.add('open');
  list.innerHTML = '<div style="text-align:center;padding:30px;color:var(--muted)"><i class="fas fa-spinner fa-spin"></i> Đang tải...</div>';

  try {
    const res = await fetch(`${BASE_URL}/api/favorites/user/${user.id}`);
    const favs = await res.json();
    if (!favs.length) {
      list.innerHTML = '<p style="text-align:center;color:var(--muted);padding:30px">Bạn chưa có địa điểm yêu thích nào.</p>';
      return;
    }
    const items = placesData.filter(p => favs.some(f => f.placeId === p.id));
    list.innerHTML = items.map(p => `
      <div class="fav-item" onclick="window.showLocationDetails(${p.id});document.getElementById('fav-modal').classList.remove('open')">
        <img src="${getImageUrl(p.imageUrl)}" onerror="this.src=window.__ph"/>
        <div class="fi-info">
          <h5>${p.name}</h5>
          <span>${p.category?.name || 'Địa điểm'}</span>
        </div>
        <button class="fi-remove" onclick="event.stopPropagation();window.removeFavorite(${p.id})" title="Xóa"><i class="fas fa-times"></i></button>
      </div>`).join('');
  } catch {
    list.innerHTML = '<p style="text-align:center;color:#e63946;padding:30px">Không tải được dữ liệu.</p>';
  }
}

async function removeFavorite(placeId) {
  if (!confirm('Xóa khỏi danh sách?')) return;
  await handleToggleFavorite(placeId, null);
  openFavoriteModal();
}