// Xử lý lịch trình food tour (Saved Itinerary)
let itineraryPlaces = [];

// Load lịch trình đã lưu
async function loadItineraries() {
    if (!requireLogin()) return;
    try {
        const res  = await fetch(`${API_BASE}/itineraries`, { headers: authHeader() });
        const data = await res.json();
        renderItineraries(data);
    } catch (err) {
        console.error('Lỗi load itineraries:', err);
    }
}

// Render danh sách lịch trình
function renderItineraries(itineraries) {
    const container = document.getElementById('itineraryList');
    if (!container) return;
    if (itineraries.length === 0) {
        container.innerHTML = `<div class="text-center text-muted py-4">
            <i class="fas fa-route fa-2x mb-2"></i><br>Chưa có lịch trình nào
        </div>`;
        return;
    }
    container.innerHTML = itineraries.map(it => `
        <div class="card mb-2">
            <div class="card-body d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="mb-0 fw-bold">${it.title || 'Lịch trình'}</h6>
                    <small class="text-muted">${new Date(it.createdAt).toLocaleDateString('vi-VN')}</small>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-outline-primary" onclick="viewItinerary(${it.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteItinerary(${it.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>`).join('');
}

// Thêm quán vào lịch trình
function addToItinerary(place) {
    if (itineraryPlaces.find(p => p.id === place.id)) {
        showToast('Quán này đã có trong lịch trình', 'error');
        return;
    }
    itineraryPlaces.push(place);
    renderCurrentItinerary();
    showToast(`Đã thêm ${place.name} vào lịch trình`, 'success');
}

// Render lịch trình đang tạo
function renderCurrentItinerary() {
    const container = document.getElementById('currentItinerary');
    if (!container) return;
    if (itineraryPlaces.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">Chưa có quán nào</p>';
        return;
    }
    container.innerHTML = itineraryPlaces.map((p, i) => `
        <div class="d-flex align-items-center gap-2 mb-2">
            <span class="badge bg-danger">${i + 1}</span>
            <span style="font-size:13px;flex-grow:1">${p.name}</span>
            <button class="btn btn-sm btn-outline-danger" onclick="removeFromItinerary(${p.id})">
                <i class="fas fa-times"></i>
            </button>
        </div>`).join('');
}

// Xóa khỏi lịch trình
function removeFromItinerary(placeId) {
    itineraryPlaces = itineraryPlaces.filter(p => p.id !== placeId);
    renderCurrentItinerary();
}

// Lưu lịch trình
async function saveItinerary() {
    if (!requireLogin()) return;
    if (itineraryPlaces.length === 0) {
        showToast('Thêm ít nhất 1 quán vào lịch trình', 'error');
        return;
    }
    const title = document.getElementById('itineraryTitle')?.value || 'Food Tour Hà Nội';
    const data  = JSON.stringify(itineraryPlaces.map(p => ({ id: p.id, name: p.name, address: p.address })));

    try {
        const res = await fetch(`${API_BASE}/itineraries`, {
            method: 'POST',
            headers: jsonAuthHeader(),
            body: JSON.stringify({ title, data })
        });
        if (res.ok) {
            showToast('Đã lưu lịch trình!', 'success');
            itineraryPlaces = [];
            renderCurrentItinerary();
            loadItineraries();
        }
    } catch (err) {
        showToast('Lỗi lưu lịch trình', 'error');
    }
}

// Xem lịch trình
async function viewItinerary(id) {
    try {
        const res = await fetch(`${API_BASE}/itineraries/${id}`, { headers: authHeader() });
        const it  = await res.json();
        const places = JSON.parse(it.data || '[]');
        // Hiển thị trên bản đồ
        showMarkers(places);
        if (places.length > 0) fitBounds(places);
        showToast(`Đang xem lịch trình: ${it.title}`, 'success');
    } catch (err) {
        console.error('Lỗi view itinerary:', err);
    }
}

// Xóa lịch trình
async function deleteItinerary(id) {
    if (!confirm('Xóa lịch trình này?')) return;
    try {
        await fetch(`${API_BASE}/itineraries/${id}`, { method: 'DELETE', headers: authHeader() });
        showToast('Đã xóa lịch trình', 'success');
        loadItineraries();
    } catch (err) {
        showToast('Lỗi xóa lịch trình', 'error');
    }
}

document.addEventListener('DOMContentLoaded', loadItineraries);
