// Xử lý hiển thị và tương tác với danh sách quán ăn
let allPlaces = [];
let selectedCategoryId = null;

// Load tất cả quán
async function loadAllPlaces() {
    try {
        const res = await fetch(`${API_BASE}/places`);
        allPlaces = await res.json();
        showMarkers(allPlaces);
        if (typeof renderPlaceList === 'function') renderPlaceList(allPlaces);
    } catch (err) {
        console.error('Lỗi load places:', err);
    }
}

// Load danh mục
async function loadCategories() {
    try {
        const res  = await fetch(`${API_BASE}/categories`);
        const cats = await res.json();
        renderCategories(cats);
    } catch (err) {
        console.error('Lỗi load categories:', err);
    }
}

// Render danh mục
function renderCategories(cats) {
    const container = document.getElementById('categoryList');
    if (!container) return;
    container.innerHTML = `
        <span class="badge-category active" onclick="filterCategory(null, this)">Tất cả</span>`;
    cats.forEach(cat => {
        container.innerHTML += `
            <span class="badge-category" onclick="filterCategory(${cat.id}, this)">${cat.name}</span>`;
    });
}

// Lọc theo danh mục
async function filterCategory(categoryId, el) {
    selectedCategoryId = categoryId;

    // Cập nhật active badge
    document.querySelectorAll('.badge-category').forEach(b => b.classList.remove('active'));
    if (el) el.classList.add('active');

    try {
        let places;
        if (!categoryId) {
            places = allPlaces;
        } else {
            const res = await fetch(`${API_BASE}/places/category/${categoryId}`);
            places = await res.json();
        }
        showMarkers(places);
        if (typeof renderPlaceList === 'function') renderPlaceList(places);
    } catch (err) {
        console.error('Lỗi filter:', err);
    }
}

// Tìm kiếm quán
async function searchPlaces() {
    const input   = document.getElementById('searchInput');
    const keyword = input ? input.value.trim() : '';
    if (!keyword) { loadAllPlaces(); return; }

    try {
        const res  = await fetch(`${API_BASE}/places/search?keyword=${encodeURIComponent(keyword)}`);
        const data = await res.json();
        showMarkers(data);
        if (typeof renderPlaceList === 'function') renderPlaceList(data);
        if (data.length === 0) showToast('Không tìm thấy quán nào', 'error');
    } catch (err) {
        console.error('Lỗi search:', err);
    }
}

// Render danh sách quán ăn (dạng card)
function renderPlaceList(places) {
    const container = document.getElementById('placeList');
    if (!container) return;

    if (places.length === 0) {
        container.innerHTML = `<div class="text-center text-muted py-4">
            <i class="fas fa-store-slash fa-2x mb-2"></i><br>Không có quán nào
        </div>`;
        return;
    }

    container.innerHTML = places.map(place => `
        <div class="d-flex gap-2 p-2 border-bottom" style="cursor:pointer"
             onclick="showPlaceDetail(${place.id})">
            <img src="${place.imageUrl || 'https://via.placeholder.com/60x60'}"
                 style="width:60px;height:60px;object-fit:cover;border-radius:10px" alt="${place.name}">
            <div class="flex-grow-1">
                <div style="font-size:14px;font-weight:600">${place.name}</div>
                <div style="font-size:12px;color:#777">
                    <i class="fas fa-map-marker-alt text-danger"></i> ${place.address || 'Chưa có địa chỉ'}
                </div>
                <div style="font-size:12px;color:#f39c12">
                    <i class="fas fa-money-bill"></i> ${place.priceRange || 'Chưa có giá'}
                </div>
            </div>
        </div>`).join('');
}

// Hiển thị chi tiết quán
async function showPlaceDetail(id) {
    try {
        const res   = await fetch(`${API_BASE}/places/${id}`);
        const place = await res.json();

        // Cập nhật lượt xem
        fetch(`${API_BASE}/stats/places/${id}/view`, { method: 'PUT' });

        const modal = document.getElementById('placeModal');
        if (!modal) return;

        document.getElementById('placeModalTitle').textContent = place.name;
        document.getElementById('placeModalBody').innerHTML = `
            <img src="${place.imageUrl || 'https://via.placeholder.com/500x200'}"
                 class="place-detail-img" alt="${place.name}">
            <div class="place-info-item">
                <i class="fas fa-tag"></i>
                <span>${place.category ? place.category.name : 'Chưa phân loại'}</span>
            </div>
            <div class="place-info-item">
                <i class="fas fa-map-marker-alt"></i>
                <span>${place.address || 'Chưa có địa chỉ'}</span>
            </div>
            <div class="place-info-item">
                <i class="fas fa-phone"></i>
                <span>${place.phone || 'Chưa có SĐT'}</span>
            </div>
            <div class="place-info-item">
                <i class="fas fa-money-bill-wave"></i>
                <span>${place.priceRange || 'Chưa có thông tin giá'}</span>
            </div>
            ${place.description ? `<p class="text-muted" style="font-size:14px">${place.description}</p>` : ''}
            <div class="d-flex gap-2 mt-3">
                <button class="btn btn-danger btn-sm" onclick="addFavorite(${place.id})">
                    <i class="fas fa-heart me-1"></i>Yêu thích
                </button>
                <button class="btn btn-outline-primary btn-sm" onclick="getRoute(${place.latitude}, ${place.longitude})">
                    <i class="fas fa-route me-1"></i>Chỉ đường
                </button>
            </div>
            <hr>
            <div id="reviewSection-${id}"></div>`;

        new bootstrap.Modal(modal).show();
        if (typeof loadReviews === 'function') loadReviews(id);
    } catch (err) {
        console.error('Lỗi load chi tiết:', err);
    }
}

// Thêm yêu thích
async function addFavorite(placeId) {
    if (!requireLogin()) return;
    try {
        const res = await fetch(`${API_BASE}/favorites/${placeId}`, {
            method: 'POST',
            headers: authHeader()
        });
        if (res.ok) showToast('Đã thêm vào yêu thích!', 'success');
        else showToast('Đã có trong yêu thích rồi', 'error');
    } catch (err) {
        showToast('Lỗi: ' + err.message, 'error');
    }
}
