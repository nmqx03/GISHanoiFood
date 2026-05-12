import { BASE_URL, getImageUrl, PLACEHOLDER_IMG } from './config.js';
window.__ph = PLACEHOLDER_IMG;
import { getCurrentUser } from './auth.js';
import { initFavoriteSystem, getFavoriteStatus, handleToggleFavorite } from './tym.js';

const CAT_COLORS = ['#d76a3a','#c08a2a','#7a8a3a','#7d4a8a','#3a6a8a','#3a8a6a','#8a3a6a','#6a8a3a'];

let allPlaces = [];
let allCategories = [];
let currentPlaceId = null;
let mapMarkers = {};
let routingControl = null;
let userPosition = null;
export let map = null;  // sẽ được khởi tạo trong initPlacesSystem()

function initMap() {
  if (map) return map;  // nếu đã init thì return luôn
  const mapEl = document.getElementById('map');
  if (!mapEl) {
    console.error('Map container #map not found');
    return null;
  }

  map = L.map('map', { zoomControl: false, attributionControl: true })
    .setView([21.0285, 105.8542], 13);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    maxZoom: 19, subdomains: 'abcd'
  }).addTo(map);

  // Zoom controls
  document.getElementById('z-in')?.addEventListener('click',  () => map.zoomIn());
  document.getElementById('z-out')?.addEventListener('click', () => map.zoomOut());
  document.getElementById('z-c')?.addEventListener('click',   () => map.flyTo([21.0285, 105.8542], 13, { duration: .7 }));

  // Locate button
  document.getElementById('locate-btn')?.addEventListener('click', () => {
    if (!navigator.geolocation) return alert('Trình duyệt không hỗ trợ GPS');
    navigator.geolocation.getCurrentPosition(pos => {
      userPosition = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      map.flyTo([pos.coords.latitude, pos.coords.longitude], 16, { duration: 1 });
      renderPanelList(allPlaces);
    }, () => alert('Không lấy được vị trí'));
  });

  return map;
}

function makePin(color, active = false) {
  const html = `<div class="pin ${active ? 'active' : ''}">
    <div class="pulse" style="background:${color}"></div>
    <div class="pbody" style="background:${color}"><i class="fas fa-utensils"></i></div>
  </div>`;
  return L.divIcon({ className: 'pin-wrap', html, iconSize: [34, 42], iconAnchor: [17, 42] });
}

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function fetchCategories() { try { return await (await fetch(`${BASE_URL}/api/categories`)).json(); } catch { return []; } }
async function fetchPlaces()     { try { return await (await fetch(`${BASE_URL}/api/places`)).json();     } catch { return []; } }
async function fetchEvents(id)   { try { const r = await fetch(`${BASE_URL}/api/events/place/${id}`);  return r.ok ? await r.json() : []; } catch { return []; } }
async function fetchReviews(id)  { try { const r = await fetch(`${BASE_URL}/api/reviews/place/${id}`); return r.ok ? await r.json() : []; } catch { return []; } }
async function incrementView(id) { try { await fetch(`${BASE_URL}/api/stats/view/${id}`, { method: 'POST' }); } catch {} }

export async function initPlacesSystem() {
  console.log('initPlacesSystem starting...');

  // 1. Init map FIRST (cần DOM sẵn)
  if (!initMap()) {
    console.error('Map init failed');
    return null;
  }

  // 2. Load data
  try {
    [allCategories, allPlaces] = await Promise.all([fetchCategories(), fetchPlaces()]);
    console.log('Loaded', allCategories.length, 'categories,', allPlaces.length, 'places');
  } catch (e) {
    console.error('Load data failed:', e);
    return null;
  }

  // 3. Build UI
  buildCategoryNav();
  buildChips();
  buildLegend();
  renderPanelList(allPlaces);
  renderAllMarkers(allPlaces);
  initFavoriteSystem(allPlaces);
  setupSearch();

  window.showLocationDetails = showDetail;
  window.closeDetail = closeDetail;
  window.showRouteTo = showRoute;

  return { places: allPlaces, categories: allCategories };
}

function buildCategoryNav() {
  const nav = document.getElementById('category-nav');
  if (!nav) return;
  nav.innerHTML = '';
  allCategories.forEach((cat, i) => {
    const color = CAT_COLORS[i % CAT_COLORS.length];
    const count = allPlaces.filter(p => p.category?.id === cat.id).length;
    const btn = document.createElement('button');
    btn.className = 'sb-item';
    btn.innerHTML = `<span class="ic"><span class="cat-dot" style="background:${color}"></span></span><span>${cat.name}</span><span class="badge">${count}</span>`;
    btn.addEventListener('click', () => {
      document.querySelectorAll('#category-nav .sb-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filtered = allPlaces.filter(p => p.category?.id === cat.id);
      renderPanelList(filtered);
      renderAllMarkers(filtered);
    });
    nav.appendChild(btn);
  });
}

function buildChips() {
  const chips = document.getElementById('chips');
  if (!chips) return;
  chips.innerHTML = `<button class="chip on" data-cat=""><i class="fas fa-circle-check"></i>Tất cả</button>`;
  allCategories.slice(0, 5).forEach(cat => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.dataset.cat = cat.id;
    chip.textContent = cat.name;
    chips.appendChild(chip);
  });
  chips.addEventListener('click', e => {
    const btn = e.target.closest('.chip');
    if (!btn) return;
    chips.querySelectorAll('.chip').forEach(c => c.classList.remove('on'));
    btn.classList.add('on');
    const catId = btn.dataset.cat;
    const filtered = catId ? allPlaces.filter(p => p.category?.id == catId) : allPlaces;
    renderPanelList(filtered);
    renderAllMarkers(filtered);
  });
}

function buildLegend() {
  const leg = document.getElementById('map-legend');
  if (!leg) return;
  leg.innerHTML = allCategories.slice(0, 4).map((cat, i) =>
    `<div class="it"><span class="sw" style="background:${CAT_COLORS[i % CAT_COLORS.length]}"></span>${cat.name}</div>`
  ).join('') + `<div class="it" style="color:var(--muted)"><i class="fas fa-circle-notch"></i> 5 km</div>`;
}

function renderPanelList(places) {
  const results = document.getElementById('panel-results');
  const countEl = document.getElementById('res-count');
  const subEl   = document.getElementById('panel-sub');
  if (countEl) countEl.textContent = String(places.length).padStart(2, '0');
  if (subEl)   subEl.textContent   = `${String(places.length).padStart(2,'0')} địa điểm · sắp xếp theo độ nổi bật`;
  if (!results) return;

  results.innerHTML = '';
  if (places.length === 0) {
    results.innerHTML = '<p style="text-align:center;color:var(--muted);padding:20px">Không tìm thấy địa điểm nào.</p>';
    return;
  }

  places.forEach((p, i) => {
    const catIdx   = allCategories.findIndex(c => c.id === p.category?.id);
    const catColor = CAT_COLORS[catIdx >= 0 ? catIdx % CAT_COLORS.length : 0];
    const img      = getImageUrl(p.imageUrl);
    const rating   = p.averageRating > 0 ? p.averageRating.toFixed(1) : '—';
    const dist     = userPosition && p.latitude && p.longitude
      ? getDistance(userPosition.lat, userPosition.lng, p.latitude, p.longitude).toFixed(1) + ' km'
      : '';
    const district = p.location ? p.location.split(',').slice(-2, -1)[0]?.trim() || 'Hà Nội' : 'Hà Nội';

    const el = document.createElement('div');
    el.className = 'pc';
    el.style.animationDelay = (i * 40) + 'ms';
    el.dataset.id = p.id;
    el.innerHTML = `
      <img src="${img}" alt="${p.name}" onerror="this.src=window.__ph"/>
      <div class="body">
        <div class="row1">
          <div class="name">${p.name}</div>
          <div class="num">#${String(i + 1).padStart(2, '0')}</div>
        </div>
        <div class="meta">
          <span class="star"><i class="fas fa-star"></i> ${rating}</span>
          ${dist ? `<span class="sep"></span><span>${dist}</span>` : ''}
          <span class="sep"></span>
          <span>${district}</span>
        </div>
        <div class="tags">
          <span class="tag ${i < 2 ? 'hot' : ''}">${p.category?.name || 'Khác'}</span>
        </div>
      </div>
      <button class="heart" aria-label="Yêu thích"><i class="far fa-heart"></i></button>`;
    el.addEventListener('click', e => {
      if (e.target.closest('.heart')) {
        e.stopPropagation();
        handleToggleFavorite(p.id, el.querySelector('.heart'));
        return;
      }
      showDetail(p.id);
    });
    results.appendChild(el);
  });
}

export function renderAllMarkers(places) {
  if (!map) return;
  Object.values(mapMarkers).forEach(m => map.removeLayer(m));
  mapMarkers = {};
  if (!places?.length) return;
  places.forEach(p => {
    if (!p.latitude || !p.longitude) return;
    const catIdx = allCategories.findIndex(c => c.id === p.category?.id);
    const color  = CAT_COLORS[catIdx >= 0 ? catIdx % CAT_COLORS.length : 0];
    const m = L.marker([p.latitude, p.longitude], { icon: makePin(color, false) }).addTo(map);
    m.on('click', () => showDetail(p.id));
    mapMarkers[p.id] = m;
  });
}

async function showDetail(placeId) {
  const p = allPlaces.find(x => x.id === placeId);
  if (!p) return;
  currentPlaceId = placeId;
  window.__currentPlaceId = placeId;
  incrementView(placeId);

  Object.entries(mapMarkers).forEach(([id, m]) => {
    const pl = allPlaces.find(x => x.id == id);
    if (!pl) return;
    const catIdx = allCategories.findIndex(c => c.id === pl.category?.id);
    const color  = CAT_COLORS[catIdx >= 0 ? catIdx % CAT_COLORS.length : 0];
    m.setIcon(makePin(color, +id === placeId));
  });

  if (map) map.flyTo([p.latitude, p.longitude], 16, { duration: .8 });

  const detail = document.getElementById('detail');
  detail.style.display = 'flex';
  detail.style.animation = 'none'; void detail.offsetWidth; detail.style.animation = 'detailIn .4s var(--ease) both';

  const imgUrl = getImageUrl(p.imageUrl);
  document.getElementById('detail-hero').style.backgroundImage =
    `linear-gradient(180deg,rgba(0,0,0,0) 30%,rgba(0,0,0,.58)), url(${imgUrl})`;

  document.getElementById('d-name').textContent = p.name;
  document.getElementById('d-addr').textContent = p.location || 'Hà Nội';
  document.getElementById('d-badge').textContent = p.category?.name || 'Nổi bật';
  document.getElementById('d-rating').innerHTML = p.averageRating > 0 ? `${p.averageRating.toFixed(1)}<small>/5</small>` : `—`;

  const dist = userPosition && p.latitude
    ? getDistance(userPosition.lat, userPosition.lng, p.latitude, p.longitude).toFixed(1)
    : null;
  const viewsEl = document.getElementById('d-views');
  if (viewsEl) viewsEl.innerHTML = dist ? `${dist}<small>km</small>` : `—`;

  const favBtn = document.getElementById('btn-fav-detail');
  const isFav  = await getFavoriteStatus(placeId);
  favBtn.innerHTML = `<i class="${isFav ? 'fas' : 'far'} fa-heart"></i>`;
  favBtn.className = `btn-ghost${isFav ? ' fav-on' : ''}`;
  favBtn.onclick   = async () => {
    await handleToggleFavorite(placeId, favBtn);
    const nowFav = await getFavoriteStatus(placeId);
    favBtn.innerHTML = `<i class="${nowFav ? 'fas' : 'far'} fa-heart"></i>`;
    favBtn.className = `btn-ghost${nowFav ? ' fav-on' : ''}`;
  };

  document.getElementById('btn-route').onclick = () => showRoute(p.latitude, p.longitude);

  loadEvents(placeId);
  loadReviews(placeId);
}

async function loadEvents(placeId) {
  const el = document.getElementById('d-events');
  const events = await fetchEvents(placeId);
  if (!events.length) {
    el.innerHTML = '<p style="font-size:12px;color:var(--muted)">Hiện chưa có sự kiện nào.</p>';
    return;
  }
  el.innerHTML = events.map(ev => `
    <div class="event-card">
      <div class="ev-date">
        <span class="day">${new Date(ev.startDate).getDate()}</span>
        <span class="mon">Th${new Date(ev.startDate).getMonth() + 1}</span>
      </div>
      <div class="ev-info">
        <h5>${ev.eventName}</h5>
        <p>${new Date(ev.startDate).toLocaleDateString('vi-VN')} — ${new Date(ev.endDate).toLocaleDateString('vi-VN')}</p>
        <p>${ev.description || ''}</p>
      </div>
    </div>`).join('');
}

async function loadReviews(placeId) {
  const el = document.getElementById('d-reviews');
  const reviews = await fetchReviews(placeId);

  const avatarsEl = document.getElementById('d-avatars');
  const countEl   = document.getElementById('d-review-count');
  const quoteEl   = document.getElementById('d-quote');
  const rcountEl  = document.getElementById('d-rcount');
  if (rcountEl) rcountEl.innerHTML = `${reviews.length}<small></small>`;
  if (countEl)  countEl.textContent = `${reviews.length} đánh giá`;
  if (avatarsEl) {
    avatarsEl.innerHTML = reviews.slice(0, 3).map(r => {
      const initials = (r.user?.fullName || 'U').split(' ').map(w => w[0]).slice(-2).join('').toUpperCase();
      return `<div class="av">${initials}</div>`;
    }).join('') + (reviews.length > 3 ? `<div class="av">+${reviews.length - 3}</div>` : '');
  }
  if (quoteEl) quoteEl.textContent = reviews[0]?.content || 'Chưa có đánh giá nào.';

  if (!reviews.length) {
    el.innerHTML = `<p style="font-size:12px;color:var(--muted)">Chưa có đánh giá nào.</p>`;
    return;
  }
  const userId = JSON.parse(localStorage.getItem('currentUser') || '{}')?.id;
  el.innerHTML = reviews.slice(0, 3).map(r => {
    const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
    const imgs  = (r.images || []).map(img =>
      `<img src="${BASE_URL}/uploads/${img.url.replace(/^\/uploads\//, '')}" onerror="this.src=window.__ph"/>`
    ).join('');
    const canDel = userId && (r.user?.id == userId);
    return `
      <div class="review-item">
        <div class="rv-head">
          <span class="rv-user">${r.user?.fullName || 'Khách'}</span>
          <span class="rv-stars">${stars}</span>
          ${canDel ? `<button onclick="deleteReview(${r.id})" style="font-size:11px;color:var(--muted)"><i class="fas fa-trash"></i></button>` : ''}
        </div>
        <div class="rv-text">${r.content || ''}</div>
        ${imgs ? `<div class="rv-imgs">${imgs}</div>` : ''}
      </div>`;
  }).join('');
}

window.deleteReview = async function(reviewId) {
  if (!confirm('Xóa đánh giá này?')) return;
  const token = localStorage.getItem('token');
  const r = await fetch(`${BASE_URL}/api/reviews/${reviewId}`, {
    method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
  });
  if (r.ok) loadReviews(currentPlaceId);
  else alert('Xóa thất bại');
};

function closeDetail() {
  document.getElementById('detail').style.display = 'none';
  currentPlaceId = null;
  Object.entries(mapMarkers).forEach(([id, m]) => {
    const pl = allPlaces.find(x => x.id == id);
    if (!pl) return;
    const catIdx = allCategories.findIndex(c => c.id === pl.category?.id);
    const color  = CAT_COLORS[catIdx >= 0 ? catIdx % CAT_COLORS.length : 0];
    m.setIcon(makePin(color, false));
  });
  if (routingControl && map) { map.removeControl(routingControl); routingControl = null; }
}
window.closeDetail = closeDetail;

function showRoute(lat, lng) {
  if (!navigator.geolocation) return alert('Trình duyệt không hỗ trợ GPS');
  navigator.geolocation.getCurrentPosition(pos => {
    if (routingControl) map.removeControl(routingControl);
    routingControl = L.Routing.control({
      waypoints: [L.latLng(pos.coords.latitude, pos.coords.longitude), L.latLng(lat, lng)],
      routeWhileDragging: false, show: false, createMarker: () => null,
      lineOptions: { styles: [{ color: '#1a1612', opacity: 1, weight: 5 }] }
    }).addTo(map);
  }, () => alert('Không lấy được vị trí'));
}

function setupSearch() {
  const mainInput = document.getElementById('main-search');
  const sbInput   = document.getElementById('sb-search-input');
  const doSearch  = (keyword) => {
    const kw = keyword.trim().toLowerCase();
    const filtered = kw ? allPlaces.filter(p => p.name.toLowerCase().includes(kw)) : allPlaces;
    if (kw && !filtered.length) alert(`Không tìm thấy: "${keyword}"`);
    renderPanelList(filtered);
    renderAllMarkers(filtered);
  };
  document.getElementById('btn-search-go')?.addEventListener('click', () => doSearch(mainInput?.value || ''));
  mainInput?.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(mainInput.value); });
  sbInput?.addEventListener('input', e => doSearch(e.target.value));
}

export function getPlaces()     { return allPlaces; }
export function getCategories() { return allCategories; }
export { renderAllMarkers as renderMarkers };