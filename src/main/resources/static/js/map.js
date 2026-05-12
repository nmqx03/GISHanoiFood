import { BASE_URL } from './config.js';

const HANOI_CENTER = [21.0285, 105.8542];

const streetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap', maxZoom: 19
});
const satelliteMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri', maxZoom: 19
});

export const map = L.map('map', {
    center: HANOI_CENTER, zoom: 13, layers: [streetMap]
});

const baseMaps = { "Bản đồ đường phố": streetMap, "Ảnh vệ tinh": satelliteMap };
const layerControl = L.control.layers(baseMaps, {}, { collapsed: true, position: 'bottomleft' }).addTo(map);

let layerGroups = {};
let routingControl = null;
let userLocationMarker = null;
let userAccuracyCircle = null;

export function clearMarkers() {
    Object.values(layerGroups).forEach(group => group.clearLayers());
}

const PLACE_PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
  <path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 22 14 22S28 24.5 28 14C28 6.3 21.7 0 14 0z"
        fill="#27ae60" stroke="white" stroke-width="2.5"/>
  <circle cx="14" cy="14" r="5.5" fill="white" opacity="0.92"/>
</svg>`;

const PLACE_ICON = L.divIcon({
    className: '',
    html: PLACE_PIN_SVG,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -38]
});

export function renderMarkers(places) {
    clearMarkers();
    if (!places || places.length === 0) return;

    places.forEach(place => {
        const categoryName = place.category?.name || "Địa điểm khác";

        const marker = L.marker([place.latitude, place.longitude], { icon: PLACE_ICON });
        marker.bindPopup(`
            <div style="text-align:center">
                <b>${place.name}</b><br>
                <span style="font-size:12px; color:#666;">${categoryName}</span><br>
                <button onclick="window.showLocationDetails(${place.id})"
                  style="margin-top:5px; padding:6px 12px; background:#e67e22; color:#fff; border:none; border-radius:6px; cursor:pointer;">
                  Xem chi tiết
                </button>
            </div>
        `);

        if (!layerGroups[categoryName]) {
            const newGroup = L.layerGroup();
            layerGroups[categoryName] = newGroup;
            map.addLayer(newGroup);
            layerControl.addOverlay(newGroup, categoryName);
        }
        layerGroups[categoryName].addLayer(marker);
    });
}

export function showRouteTo(lat, lng) {
    if (!navigator.geolocation) return alert("Trình duyệt không hỗ trợ GPS");

    navigator.geolocation.getCurrentPosition(pos => {
        const userLatLng = L.latLng(pos.coords.latitude, pos.coords.longitude);
        if (routingControl) map.removeControl(routingControl);

        routingControl = L.Routing.control({
            waypoints: [userLatLng, L.latLng(lat, lng)],
            routeWhileDragging: false,
            show: false,
            createMarker: () => null,
            lineOptions: {
                styles: [
                    { color: '#1a6bff', opacity: 0.15, weight: 20 },
                    { color: '#2979ff', opacity: 0.40, weight: 12 },
                    { color: '#1565c0', opacity: 1.00, weight:  5 }
                ]
            }
        }).on('routesfound', e => {
            updateRoutingUI(e.routes[0].summary, e.routes[0].instructions);
        }).addTo(map);

        toggleSidebarForRouting(true);
    }, handleGeolocationError, { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 });
}
window.showRouteTo = showRouteTo;

function updateRoutingUI(summary, instructions) {
    const distEl = document.getElementById("route-distance");
    const timeEl = document.getElementById("route-time");
    const listEl = document.getElementById("route-instructions");
    if (distEl) distEl.innerText = `📏 Khoảng cách: ${(summary.totalDistance/1000).toFixed(1)} km`;
    if (timeEl) timeEl.innerText = `⏱ Thời gian: ${Math.round(summary.totalTime/60)} phút`;
    if (listEl) listEl.innerHTML = "<ul style='padding-left:18px;margin-top:8px;'>" + instructions.map(i => `<li style='margin-bottom:4px;font-size:13px;'>${i.text}</li>`).join('') + "</ul>";
}

function toggleSidebarForRouting(isRouting) {
    const ld = document.getElementById("location-details");
    const rd = document.getElementById("routing-details");
    const sb = document.getElementById("sidebar");
    if (ld) ld.style.display = isRouting ? "none" : "block";
    if (rd) rd.style.display = isRouting ? "block" : "none";
    if (sb) sb.classList.add("open");
}

function handleGeolocationError(err) {
    console.error("Geolocation error:", err);
    const messages = {
        1: "❌ Bạn đã từ chối quyền truy cập vị trí.\nMở cài đặt trình duyệt → cho phép website lấy vị trí → refresh.",
        2: "❌ Không xác định được vị trí. Kiểm tra:\n• GPS đã bật?\n• Đang có Internet?",
        3: "⏱ Hết thời gian chờ GPS.\nThử di chuyển ra gần cửa sổ hoặc bật Wi-Fi để định vị nhanh hơn."
    };
    alert(messages[err.code] || `Lỗi định vị: ${err.message}`);
}

// Hiển thị marker vị trí + vòng tròn độ chính xác
function showUserLocation(lat, lng, accuracy, isRefining = false) {
    if (userLocationMarker) map.removeLayer(userLocationMarker);
    if (userAccuracyCircle) map.removeLayer(userAccuracyCircle);

    // Vòng tròn độ chính xác
    userAccuracyCircle = L.circle([lat, lng], {
        radius: accuracy,
        color: '#e67e22',
        fillColor: '#e67e22',
        fillOpacity: 0.12,
        weight: 1
    }).addTo(map);

    // Marker vị trí
    const userIcon = L.divIcon({
        className: 'user-location-icon',
        html: `<div style="background:#e67e22;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 4px rgba(230,126,34,0.4);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });

    userLocationMarker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup(`📍 <b>Vị trí của bạn</b><br><small>Độ chính xác: ${Math.round(accuracy)}m ${isRefining ? '(đang cải thiện...)' : ''}</small>`);

    if (!isRefining) userLocationMarker.openPopup();
}

export function initMapEvents() {
    document.getElementById("clear-route")?.addEventListener('click', () => {
        if (routingControl) {
            map.removeControl(routingControl);
            routingControl = null;
        }
        const rd = document.getElementById("routing-details");
        if (rd) rd.style.display = "none";
    });

    document.getElementById("locate-btn")?.addEventListener('click', () => {
        if (!navigator.geolocation) return alert("Trình duyệt không hỗ trợ GPS");

        const btn = document.getElementById("locate-btn");
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        btn.disabled = true;

        let watchId = null;
        let bestAccuracy = Infinity;
        let fixReceived = false;

        const stopWatch = () => {
            if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
                watchId = null;
            }
        };

        // Stop watching after 30s to save battery
        const batteryTimeout = setTimeout(stopWatch, 30000);

        // Single watchPosition with maximumAge:0 ensures the first callback always
        // delivers a fresh fix — eliminates the stale-cache bug that required two clicks.
        watchId = navigator.geolocation.watchPosition(
            pos => {
                const { latitude, longitude, accuracy } = pos.coords;
                const isFirstFix = !fixReceived;

                if (isFirstFix) {
                    fixReceived = true;
                    btn.innerHTML = originalHtml;
                    btn.disabled = false;
                    map.flyTo([latitude, longitude], 16, { duration: 1.0 });
                }

                // Always show on first fix; refine only when meaningfully more accurate
                if (isFirstFix || accuracy < bestAccuracy * 0.8) {
                    bestAccuracy = accuracy;
                    showUserLocation(latitude, longitude, accuracy, accuracy > 30);
                }

                // Accuracy good enough — stop refining after a brief grace period
                if (accuracy <= 30) {
                    clearTimeout(batteryTimeout);
                    setTimeout(stopWatch, 3000);
                }
            },
            err => {
                clearTimeout(batteryTimeout);
                stopWatch();
                btn.innerHTML = originalHtml;
                btn.disabled = false;
                handleGeolocationError(err);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMapEvents);
} else {
    initMapEvents();
}