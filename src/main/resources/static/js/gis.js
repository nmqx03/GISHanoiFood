import { BASE_URL } from './config.js';
import { map, renderMarkers } from './map.js';

const HANOI_CENTER = { lat: 21.0285, lng: 105.8542 };

let currentCircle = null;
let centerMarker  = null;
let userMarker    = null;

window.openGisModal = function() {
    const modal = document.getElementById('gisModal');
    if (modal) { modal.style.display = 'flex'; setTimeout(() => modal.style.opacity = '1', 50); }
}

window.closeGisModal = function() {
    const modal = document.getElementById('gisModal');
    if (modal) { modal.style.opacity = '0'; setTimeout(() => modal.style.display = 'none', 300); }
}

window.switchGisTab = function(tabName) {
    document.querySelectorAll('.gis-tab-btn').forEach(b => {
        b.classList.remove('active');
        b.style.background = 'transparent';
        b.style.color = '#555';
    });
    document.querySelectorAll('.gis-panel').forEach(p => p.style.display = 'none');

    const activeBtn   = document.getElementById(tabName === 'near-me' ? 'btn-near-me' : 'btn-buffer');
    const activePanel = document.getElementById(tabName === 'near-me' ? 'gis-near-me' : 'gis-buffer');
    if (activeBtn)   { activeBtn.classList.add('active'); activeBtn.style.background = '#2a9d8f'; activeBtn.style.color = 'white'; }
    if (activePanel) activePanel.style.display = 'block';
};

// ============================================================
// 1. BUFFER ANALYSIS
// ============================================================
export async function handleBufferAnalysis() {
    const targetId   = document.getElementById('buffer-target').value;
    const categoryId = document.getElementById('buffer-category').value;
    const radiusKm   = parseFloat(document.getElementById('buffer-radius').value);
    const btn        = document.querySelector("button[onclick='handleBufferAnalysis()']");
    const originalText = btn.innerHTML;

    if (!targetId)   return alert("⚠️ Vui lòng chọn Tâm điểm!");
    if (!categoryId) return alert("⚠️ Vui lòng chọn Loại hình!");

    try {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';

        const radiusM = radiusKm * 1000; // đổi sang mét để truyền API
        const res     = await fetch(`${BASE_URL}/api/places/analysis?targetId=${targetId}&radius=${radiusM}&categoryId=${categoryId}`);
        const places  = await res.json();

        clearGisLayers(false);
        renderMarkers(places);

        const targetPlace = window.allPlaces.find(p => p.id == targetId);
        if (targetPlace) {
            drawBufferCircle(targetPlace.latitude, targetPlace.longitude, radiusKm);
            drawCenterMarker(targetPlace.latitude, targetPlace.longitude, targetPlace.name);
            if (currentCircle) map.fitBounds(currentCircle.getBounds(), { padding: [50, 50] });
        }

        window.closeGisModal();
        places.length > 0 ? renderGisSidebar(places) : (alert("Không tìm thấy địa điểm trong bán kính này."), clearGisLayers());

    } catch (err) {
        console.error(err);
        alert("Lỗi phân tích hệ thống.");
    } finally {
        btn.innerHTML = originalText;
    }
}

// ============================================================
// 2. NEAR ME — ĐÃ FIX LỖI GPS
// ============================================================
export async function handleNearMe() {
    const radiusKm   = parseFloat(document.getElementById('near-radius').value);
    const categoryId = document.getElementById('near-category').value;
    const btn        = document.querySelector("button[onclick='handleNearMe()']");
    const originalText = btn.innerHTML;

    if (!categoryId) return alert("⚠️ Vui lòng chọn loại hình trước!");

    if (!navigator.geolocation) {
        return alert("Trình duyệt không hỗ trợ GPS. Hãy dùng Chrome hoặc Firefox.");
    }

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang định vị...';

    navigator.geolocation.getCurrentPosition(
        // ✅ Thành công
        async (position) => {
            let lat = position.coords.latitude;
            let lng = position.coords.longitude;

            const dist = calculateDistance(lat, lng, HANOI_CENTER.lat, HANOI_CENTER.lng);
            if (dist > 80) {
                if (confirm(`Bạn đang ở xa Hà Nội (${dist.toFixed(0)}km). Giả lập về trung tâm Hà Nội?`)) {
                    lat = HANOI_CENTER.lat;
                    lng = HANOI_CENTER.lng;
                }
            }

            await doNearMeSearch(lat, lng, radiusKm, categoryId, btn, originalText);
        },

        // ❌ Lỗi GPS — xử lý từng loại
        (error) => {
            btn.innerHTML = originalText;

            if (error.code === error.PERMISSION_DENIED) {
                // GPS bị từ chối → hỏi có muốn dùng vị trí Hà Nội không
                if (confirm(
                    "⚠️ GPS bị từ chối quyền truy cập.\n\n" +
                    "Cách bật lại: Nhấn biểu tượng 🔒 trên thanh địa chỉ → Cho phép Vị trí → Tải lại trang.\n\n" +
                    "Hoặc nhấn OK để dùng vị trí trung tâm Hà Nội thay thế?"
                )) {
                    doNearMeSearch(HANOI_CENTER.lat, HANOI_CENTER.lng, radiusKm, categoryId, btn, originalText);
                }
            } else if (error.code === error.POSITION_UNAVAILABLE) {
                alert("❌ Không lấy được vị trí. Tín hiệu GPS yếu hoặc thiết bị không hỗ trợ.");
            } else if (error.code === error.TIMEOUT) {
                alert("⏱️ GPS hết thời gian chờ. Vui lòng thử lại hoặc kiểm tra kết nối mạng.");
            } else {
                alert("❓ Lỗi GPS không xác định. Vui lòng thử lại.");
            }
        },

        // Cấu hình GPS
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
}

// Hàm thực hiện tìm kiếm (dùng chung cho GPS thật và fallback)
async function doNearMeSearch(lat, lng, radiusKm, categoryId, btn, originalText) {
    try {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang quét...';

        const radiusM = radiusKm * 1000;
        const res     = await fetch(`${BASE_URL}/api/places/nearby?lat=${lat}&lng=${lng}&radius=${radiusM}&categoryId=${categoryId}`);
        const places  = await res.json();

        clearGisLayers(false);
        renderMarkers(places);
        drawBufferCircle(lat, lng, radiusKm);
        drawUserMarker(lat, lng);

        if (currentCircle) map.fitBounds(currentCircle.getBounds(), { padding: [50, 50] });
        window.closeGisModal();

        places.length > 0 ? renderGisSidebar(places) : (alert("Không tìm thấy địa điểm phù hợp quanh đây."), clearGisLayers());

    } catch (err) {
        console.error(err);
        alert("Lỗi kết nối Server.");
    } finally {
        btn.innerHTML = originalText;
    }
}

// ============================================================
// HELPERS
// ============================================================
window.clearGisLayers = function(shouldResetMarkers = true) {
    if (currentCircle) { map.removeLayer(currentCircle); currentCircle = null; }
    if (centerMarker)  { map.removeLayer(centerMarker);  centerMarker  = null; }
    if (userMarker)    { map.removeLayer(userMarker);    userMarker    = null; }

    const container = document.getElementById('gis-results-sidebar');
    if (container) container.style.display = 'none';

    if (shouldResetMarkers && window.allPlaces) renderMarkers(window.allPlaces);
}

// ⚠️ FIX: radiusKm nhận vào là km, nhân 1000 để ra mét cho Leaflet
function drawBufferCircle(lat, lng, radiusKm) {
    currentCircle = L.circle([lat, lng], {
        color: '#e76f51',
        fillColor: '#e76f51',
        fillOpacity: 0.1,
        weight: 1,
        dashArray: '5, 5',
        radius: radiusKm * 1000  // mét
    }).addTo(map);
}

function drawCenterMarker(lat, lng, name) {
    const iconHtml = `<div style="background:#2a9d8f;width:24px;height:24px;border-radius:50%;border:2px solid white;display:flex;justify-content:center;align-items:center;color:white;font-size:12px;"><i class="fas fa-star"></i></div>`;
    const icon = L.divIcon({ className: 'gis-center-visual', html: iconHtml, iconSize: [24, 24], iconAnchor: [12, 12] });
    centerMarker = L.marker([lat, lng], { icon, zIndexOffset: 900 }).addTo(map).bindPopup(`<b>TÂM VÙNG</b><br>${name}`);
}

function drawUserMarker(lat, lng) {
    const icon = L.divIcon({
        className: 'user-marker',
        html: `<div style="color:#2a9d8f;font-size:35px;"><i class="fas fa-street-view"></i></div>`,
        iconSize: [35, 35], iconAnchor: [17, 35]
    });
    userMarker = L.marker([lat, lng], { icon, zIndexOffset: 999 }).addTo(map).bindPopup("<b>Vị trí của bạn</b>");
}

function renderGisSidebar(places) {
    const container = document.getElementById('gis-results-sidebar');
    const list  = document.getElementById('gis-result-list');
    const title = document.querySelector('#gis-results-sidebar h4');

    if (container) {
        container.style.display = 'flex';
        title.innerHTML = `<i class="fas fa-list-ul"></i> Kết quả (${places.length})`;
        list.innerHTML = places.map(p => `
            <div class="gis-item" onclick="window.selectGisResult(${p.id}, ${p.latitude}, ${p.longitude})">
                <img src="${p.imageUrl ? BASE_URL + '/' + p.imageUrl : './img/placeholder.jpg'}" onerror="this.src='./img/placeholder.jpg'">
                <div style="flex:1">
                    <h5 style="margin:0 0 5px;font-size:14px;">${p.name}</h5>
                    <p style="margin:0;font-size:12px;color:#666"><i class="fas fa-map-marker-alt"></i> ${p.location || 'Hà Nội'}</p>
                </div>
            </div>`).join('');
    }
}

window.selectGisResult = function(id, lat, lng) {
    map.flyTo([lat, lng], 16, { duration: 1.2 });
    if (window.showLocationDetails) window.showLocationDetails(id);
}

export function initGisInputs(places, categories) {
    window.allPlaces = places;

    const targetSelect    = document.getElementById('buffer-target');
    const bufferCatSelect = document.getElementById('buffer-category');
    const nearCatSelect   = document.getElementById('near-category');

    if (targetSelect) {
        targetSelect.innerHTML = '<option value="">-- Chọn tâm điểm --</option>';
        [...places].sort((a, b) => a.name.localeCompare(b.name))
                   .forEach(p => targetSelect.innerHTML += `<option value="${p.id}">${p.name}</option>`);
    }

    const catOptions = '<option value="">-- Chọn loại hình --</option>' +
        categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

    if (bufferCatSelect) bufferCatSelect.innerHTML = catOptions;
    if (nearCatSelect)   nearCatSelect.innerHTML   = catOptions;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

window.handleBufferAnalysis = handleBufferAnalysis;
window.handleNearMe = handleNearMe;