// Xử lý các chức năng GIS: Nearby, Buffer, Heatmap, Routing
let heatmapVisible = false;

// Nearby Search - Tìm quán trong bán kính
async function findNearby() {
    try {
        showLoading(true);
        const loc    = await getCurrentLocation();
        const radius = getRadius();

        const res  = await fetch(`${API_BASE}/places/nearby?lat=${loc.lat}&lng=${loc.lng}&radius=${radius}`);
        const data = await res.json();

        showMarkers(data, '#e74c3c');
        drawCircle(loc.lat, loc.lng, radius, '#e74c3c');
        map.setView([loc.lat, loc.lng], 15);

        showToast(`Tìm thấy ${data.length} quán trong bán kính ${radius/1000}km`, 'success');
        if (typeof renderPlaceList === 'function') renderPlaceList(data);
    } catch (err) {
        showToast('Không thể lấy vị trí GPS: ' + err.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Buffer Zone - Vùng ảnh hưởng
async function showBuffer() {
    try {
        showLoading(true);
        const loc    = await getCurrentLocation();
        const radius = getRadius();

        const res  = await fetch(`${API_BASE}/places/buffer?lat=${loc.lat}&lng=${loc.lng}&radius=${radius}`);
        const data = await res.json();

        showMarkers(data, '#f39c12');
        drawCircle(loc.lat, loc.lng, radius, '#f39c12');
        map.setView([loc.lat, loc.lng], 14);

        showToast(`Buffer zone ${radius/1000}km: ${data.length} quán`, 'success');
        if (typeof renderPlaceList === 'function') renderPlaceList(data);
    } catch (err) {
        showToast('Lỗi Buffer: ' + err.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Heatmap - Bản đồ nhiệt
async function toggleHeatmap() {
    if (heatmapVisible && heatmapLayer) {
        map.removeLayer(heatmapLayer);
        heatmapLayer   = null;
        heatmapVisible = false;
        showToast('Đã tắt Heatmap', 'success');
        return;
    }
    try {
        showLoading(true);
        const res  = await fetch(`${API_BASE}/places/heatmap`);
        const data = await res.json();
        showHeatmap(data);
        heatmapVisible = true;
        showToast('Đã bật Heatmap', 'success');
    } catch (err) {
        showToast('Lỗi Heatmap: ' + err.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Xóa tất cả lớp GIS
function clearGIS() {
    clearAllLayers();
    heatmapVisible = false;
    showToast('Đã xóa các lớp GIS', 'success');
    if (typeof loadAllPlaces === 'function') loadAllPlaces();
}

// Lấy bán kính từ slider
function getRadius() {
    const slider = document.getElementById('radiusSlider');
    return slider ? parseFloat(slider.value) * 1000 : 2000;
}

// Cập nhật hiển thị bán kính
function updateRadiusDisplay(val) {
    const el = document.getElementById('radiusValue');
    if (el) el.textContent = val;
}

// Đo khoảng cách giữa 2 điểm (Haversine)
function haversineDistance(lat1, lng1, lat2, lng2) {
    const R   = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a   = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Chỉ đường đến quán (dùng OSRM)
async function getRoute(toLat, toLng) {
    try {
        const loc = await getCurrentLocation();
        const url = `https://router.project-osrm.org/route/v1/driving/${loc.lng},${loc.lat};${toLng},${toLat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            L.geoJSON(route.geometry, { style: { color: '#3498db', weight: 4 } }).addTo(map);
            const dist = (route.distance / 1000).toFixed(1);
            const time = Math.round(route.duration / 60);
            showToast(`Khoảng cách: ${dist}km | Thời gian: ${time} phút`, 'success');
        }
    } catch (err) {
        showToast('Không thể lấy đường đi', 'error');
    }
}
