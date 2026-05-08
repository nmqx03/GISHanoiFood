// Xử lý hiển thị quán hot/nổi bật
async function loadHotPlaces() {
    try {
        const res  = await fetch(`${API_BASE}/places/heatmap`);
        const data = await res.json();
        // Sắp xếp theo lượt xem + rating
        const sorted = data
            .filter(p => p.latitude && p.longitude)
            .sort((a, b) => {
                const scoreA = (a.viewCount || 0) + (a.avgRating || 0) * 10;
                const scoreB = (b.viewCount || 0) + (b.avgRating || 0) * 10;
                return scoreB - scoreA;
            })
            .slice(0, 10);

        renderHotPlaces(sorted);
    } catch (err) {
        console.error('Lỗi load hot places:', err);
    }
}

function renderHotPlaces(places) {
    const container = document.getElementById('hotPlaceList');
    if (!container) return;

    container.innerHTML = places.map((p, i) => `
        <div class="d-flex align-items-center gap-2 p-2 border-bottom"
             style="cursor:pointer" onclick="showPlaceDetail(${p.id})">
            <div style="width:28px;height:28px;border-radius:50%;
                        background:${i < 3 ? '#e74c3c' : '#ddd'};
                        color:${i < 3 ? '#fff' : '#666'};
                        display:flex;align-items:center;justify-content:center;
                        font-weight:700;font-size:13px;flex-shrink:0">
                ${i + 1}
            </div>
            <div class="flex-grow-1">
                <div style="font-size:13px;font-weight:600">${p.name}</div>
                <div style="font-size:11px;color:#888">
                    <i class="fas fa-eye me-1"></i>${p.viewCount || 0}
                    ${p.avgRating ? `<i class="fas fa-star text-warning ms-2 me-1"></i>${p.avgRating.toFixed(1)}` : ''}
                </div>
            </div>
        </div>`).join('');
}

document.addEventListener('DOMContentLoaded', loadHotPlaces);
