// Khởi tạo và quản lý bản đồ LeafletJS
let map, markersLayer, bufferLayer, heatmapLayer;
let currentLocation = null;

function initMap(lat = 21.0285, lng = 105.8542, zoom = 13) {
    map = L.map('map').setView([lat, lng], zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>'
    }).addTo(map);

    markersLayer = L.layerGroup().addTo(map);
    bufferLayer  = L.layerGroup().addTo(map);

    // Click trên bản đồ để xem tọa độ
    map.on('click', (e) => {
        console.log(`Lat: ${e.latlng.lat}, Lng: ${e.latlng.lng}`);
    });
}

// Icon tùy chỉnh
function createIcon(color = '#e74c3c') {
    return L.divIcon({
        html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
        className: ''
    });
}

// Hiển thị danh sách marker
function showMarkers(places, color = '#e74c3c') {
    markersLayer.clearLayers();
    places.forEach(place => {
        if (!place.latitude || !place.longitude) return;
        const marker = L.marker([place.latitude, place.longitude], { icon: createIcon(color) });
        marker.bindPopup(buildPopup(place));
        marker.on('click', () => {
            if (typeof showPlaceDetail === 'function') showPlaceDetail(place.id);
        });
        markersLayer.addLayer(marker);
    });
}

// Nội dung popup
function buildPopup(place) {
    return `
        <div style="min-width:180px">
            <div class="popup-title">${place.name}</div>
            <div class="popup-address"><i class="fas fa-map-marker-alt"></i> ${place.address || 'Chưa có địa chỉ'}</div>
            ${place.priceRange ? `<div style="font-size:12px;color:#f39c12"><i class="fas fa-money-bill"></i> ${place.priceRange}</div>` : ''}
            <button class="popup-btn mt-2" onclick="showPlaceDetail(${place.id})">
                <i class="fas fa-info-circle"></i> Xem chi tiết
            </button>
        </div>`;
}

// Lấy vị trí hiện tại
function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Trình duyệt không hỗ trợ GPS'));
            return;
        }
        navigator.geolocation.getCurrentPosition(
            pos => {
                currentLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                resolve(currentLocation);
            },
            err => reject(err),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    });
}

// Vẽ vòng tròn bán kính
function drawCircle(lat, lng, radius, color = '#e74c3c') {
    bufferLayer.clearLayers();
    L.circle([lat, lng], {
        radius, color, fillColor: color, fillOpacity: 0.1, weight: 2
    }).addTo(bufferLayer);
    L.marker([lat, lng], {
        icon: L.divIcon({
            html: `<div style="background:#3498db;width:16px;height:16px;border-radius:50%;border:2px solid white"></div>`,
            iconSize: [16, 16], iconAnchor: [8, 8], className: ''
        })
    }).addTo(bufferLayer);
}

// Hiển thị heatmap
function showHeatmap(places) {
    if (heatmapLayer) map.removeLayer(heatmapLayer);
    const points = places
        .filter(p => p.latitude && p.longitude)
        .map(p => [p.latitude, p.longitude, (p.viewCount || 1) / 10 + 0.1]);
    heatmapLayer = L.heatLayer(points, {
        radius: 35, blur: 25, maxZoom: 17,
        gradient: { 0.2: 'blue', 0.5: 'yellow', 0.8: 'orange', 1.0: 'red' }
    }).addTo(map);
    return heatmapLayer;
}

// Xóa tất cả lớp
function clearAllLayers() {
    markersLayer.clearLayers();
    bufferLayer.clearLayers();
    if (heatmapLayer) { map.removeLayer(heatmapLayer); heatmapLayer = null; }
}

// Căn giữa bản đồ theo danh sách điểm
function fitBounds(places) {
    const valid = places.filter(p => p.latitude && p.longitude);
    if (valid.length === 0) return;
    const bounds = L.latLngBounds(valid.map(p => [p.latitude, p.longitude]));
    map.fitBounds(bounds, { padding: [30, 30] });
}
