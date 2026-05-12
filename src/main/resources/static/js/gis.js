import { BASE_URL, getImageUrl, PLACEHOLDER_IMG } from './config.js';
window.__ph = PLACEHOLDER_IMG;
import * as Places from './places.js';  // dùng namespace để lazy-access map

const HANOI_CENTER = { lat: 21.0285, lng: 105.8542 };
let currentCircle = null;
let centerMarker  = null;
let userMarker    = null;
let allPlacesCache = [];

export function switchGisTab(tabName) {
  const tabs = document.querySelectorAll('.gis-tab-btn');
  tabs.forEach(b => b.classList.remove('active'));
  const nearPanel   = document.getElementById('gis-near');
  const bufferPanel = document.getElementById('gis-buffer');

  if (tabName === 'near') {
    tabs[0]?.classList.add('active');
    if (nearPanel)   nearPanel.style.display   = 'block';
    if (bufferPanel) bufferPanel.style.display = 'none';
  } else {
    tabs[1]?.classList.add('active');
    if (nearPanel)   nearPanel.style.display   = 'none';
    if (bufferPanel) bufferPanel.style.display = 'block';
  }
}

export async function handleBufferAnalysis() {
  const targetId   = document.getElementById('buffer-target').value;
  const categoryId = document.getElementById('buffer-category').value;
  const radiusKm   = parseFloat(document.getElementById('buffer-radius').value);

  if (!targetId)   return alert('Vui lòng chọn Tâm điểm');
  if (!categoryId) return alert('Vui lòng chọn Loại hình');

  try {
    const radiusM = radiusKm * 1000;
    const res = await fetch(`${BASE_URL}/api/places/analysis?targetId=${targetId}&radius=${radiusM}&categoryId=${categoryId}`);
    const places = await res.json();

    clearGisLayers(false);
    Places.renderMarkers(places);

    const targetPlace = allPlacesCache.find(p => p.id == targetId);
    if (targetPlace && Places.map) {
      drawBufferCircle(targetPlace.latitude, targetPlace.longitude, radiusKm);
      drawCenterMarker(targetPlace.latitude, targetPlace.longitude, targetPlace.name);
      if (currentCircle) Places.map.fitBounds(currentCircle.getBounds(), { padding: [50, 50] });
    }

    document.getElementById('gis-modal')?.classList.remove('open');
    if (!places.length) alert('Không tìm thấy địa điểm trong bán kính này.');
  } catch (err) {
    console.error(err);
    alert('Lỗi phân tích.');
  }
}

export async function handleNearMe() {
  const radiusKm   = parseFloat(document.getElementById('near-radius').value);
  const categoryId = document.getElementById('near-category').value;

  if (!categoryId) return alert('Vui lòng chọn loại hình');
  if (!navigator.geolocation) return alert('Trình duyệt không hỗ trợ GPS');

  navigator.geolocation.getCurrentPosition(async (pos) => {
    let lat = pos.coords.latitude, lng = pos.coords.longitude;
    const dist = calcDistance(lat, lng, HANOI_CENTER.lat, HANOI_CENTER.lng);
    if (dist > 80) {
      if (confirm(`Bạn đang ở xa Hà Nội (${dist.toFixed(0)}km). Giả lập về trung tâm Hà Nội?`)) {
        lat = HANOI_CENTER.lat; lng = HANOI_CENTER.lng;
      }
    }
    await doNearMeSearch(lat, lng, radiusKm, categoryId);
  }, err => {
    if (err.code === err.PERMISSION_DENIED) {
      if (confirm('GPS bị từ chối. Dùng vị trí trung tâm Hà Nội thay thế?')) {
        doNearMeSearch(HANOI_CENTER.lat, HANOI_CENTER.lng, radiusKm, categoryId);
      }
    } else alert('Lỗi GPS');
  });
}

async function doNearMeSearch(lat, lng, radiusKm, categoryId) {
  try {
    const radiusM = radiusKm * 1000;
    const res = await fetch(`${BASE_URL}/api/places/nearby?lat=${lat}&lng=${lng}&radius=${radiusM}&categoryId=${categoryId}`);
    const places = await res.json();
    clearGisLayers(false);
    Places.renderMarkers(places);
    if (Places.map) {
      drawBufferCircle(lat, lng, radiusKm);
      drawUserMarker(lat, lng);
      if (currentCircle) Places.map.fitBounds(currentCircle.getBounds(), { padding: [50, 50] });
    }
    document.getElementById('gis-modal')?.classList.remove('open');
    if (!places.length) alert('Không tìm thấy địa điểm phù hợp.');
  } catch (err) {
    alert('Lỗi server');
  }
}

function clearGisLayers(resetMarkers = true) {
  if (!Places.map) return;
  if (currentCircle) { Places.map.removeLayer(currentCircle); currentCircle = null; }
  if (centerMarker)  { Places.map.removeLayer(centerMarker);  centerMarker  = null; }
  if (userMarker)    { Places.map.removeLayer(userMarker);    userMarker    = null; }
  if (resetMarkers && allPlacesCache.length) Places.renderMarkers(allPlacesCache);
}

function drawBufferCircle(lat, lng, radiusKm) {
  currentCircle = L.circle([lat, lng], {
    color: '#e76f51', fillColor: '#e76f51', fillOpacity: 0.1,
    weight: 1, dashArray: '5, 5', radius: radiusKm * 1000
  }).addTo(Places.map);
}

function drawCenterMarker(lat, lng, name) {
  const icon = L.divIcon({
    className: 'gis-center', iconSize: [24, 24], iconAnchor: [12, 12],
    html: `<div style="background:#1a1612;width:24px;height:24px;border-radius:50%;border:2px solid white;display:grid;place-items:center;color:white"><i class="fas fa-star" style="font-size:10px"></i></div>`
  });
  centerMarker = L.marker([lat, lng], { icon, zIndexOffset: 900 }).addTo(Places.map).bindPopup(`<b>TÂM</b><br>${name}`);
}

function drawUserMarker(lat, lng) {
  const icon = L.divIcon({
    className: 'user-mk', iconSize: [35, 35], iconAnchor: [17, 35],
    html: `<div style="color:#1a1612;font-size:32px"><i class="fas fa-street-view"></i></div>`
  });
  userMarker = L.marker([lat, lng], { icon, zIndexOffset: 999 }).addTo(Places.map).bindPopup('<b>Vị trí của bạn</b>');
}

export function initGisInputs(places, categories) {
  allPlacesCache = places;

  const targetSel = document.getElementById('buffer-target');
  const bufCat    = document.getElementById('buffer-category');
  const nearCat   = document.getElementById('near-category');

  if (targetSel) {
    targetSel.innerHTML = '<option value="">-- Chọn tâm điểm --</option>';
    [...places].sort((a, b) => a.name.localeCompare(b.name))
      .forEach(p => targetSel.innerHTML += `<option value="${p.id}">${p.name}</option>`);
  }

  const catOpts = '<option value="">-- Chọn loại hình --</option>' +
    categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  if (bufCat)  bufCat.innerHTML  = catOpts;
  if (nearCat) nearCat.innerHTML = catOpts;
}

function calcDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

window.handleBufferAnalysis = handleBufferAnalysis;
window.handleNearMe         = handleNearMe;
window.switchGisTab         = switchGisTab;