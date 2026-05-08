import { BASE_URL } from './config.js';
import { map } from './map.js';

export function initHotPlacesSystem() {
    const btnOpen = document.getElementById('btn-hot-trend');
    const modal = document.getElementById('hotPlacesModal');
    const btnClose = document.getElementById('close-hot-modal');

    // Mở modal
    if (btnOpen) {
        btnOpen.onclick = () => {
            modal.style.display = 'block';
            loadHotPlaces(); // Gọi hàm tải dữ liệu mỗi khi mở
        };
    }

    // Đóng modal
    if (btnClose) {
        btnClose.onclick = () => modal.style.display = 'none';
    }

    // Click ra ngoài thì đóng
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });
}

async function loadHotPlaces() {
    const container = document.getElementById('hot-places-list-container');
    container.innerHTML = '<div style="text-align:center; padding:20px;"><i class="fas fa-spinner fa-spin"></i> Đang cập nhật...</div>';

    try {
     
        const res = await fetch(`${BASE_URL}/api/stats/hot`);
        if (!res.ok) throw new Error("Lỗi tải dữ liệu");
        
        const hotList = await res.json();

        renderHotList(hotList);

    } catch (error) {
        console.error(error);
        container.innerHTML = '<p style="text-align:center; color:red;">Không thể tải bảng xếp hạng lúc này.</p>';
    }
}

function renderHotList(list) {
    const container = document.getElementById('hot-places-list-container');
    
    if (list.length === 0) {
        container.innerHTML = '<p style="text-align:center;">Chưa có dữ liệu thống kê.</p>';
        return;
    }

    let html = '';
    
    list.forEach((item, index) => {
        const place = item.place;
        const score = item.totalScore;
        const rank = index + 1;

        // Xử lý màu sắc cho Top 1, 2, 3
        let badgeColor = '#6c757d'; // Mặc định màu xám
        let rankIcon = '';
        
        if (rank === 1) {
            badgeColor = '#d00000'; // Đỏ đậm
            rankIcon = '👑';
        } else if (rank === 2) {
            badgeColor = '#e85d04'; // Cam đậm
            rankIcon = '🥈';
        } else if (rank === 3) {
            badgeColor = '#ffba08'; // Vàng
            rankIcon = '🥉';
        }

        html += `
            <div class="hot-item" onclick="jumpToPlace(${place.id}, ${place.latitude}, ${place.longitude})" 
                 style="display: flex; gap: 12px; background: white; padding: 12px; margin-bottom: 10px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); cursor: pointer; transition: transform 0.2s;">
                
                <div style="position: relative; width: 80px; height: 60px; flex-shrink: 0;">
                    <img src="${BASE_URL}/${place.imageUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px;" onerror="this.src='./img/placeholder.jpg'">
                    <div style="position: absolute; top: -5px; left: -5px; background: ${badgeColor}; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                        ${rank}
                    </div>
                </div>

                <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
                    <h4 style="margin: 0 0 5px 0; font-size: 16px; color: #333;">${rankIcon} ${place.name}</h4>
                    <div style="font-size: 12px; color: #666; display: flex; gap: 10px;">
                     
                        <span style="color: #e63946; font-weight: bold;"><i class="fas fa-fire"></i> ${score} điểm</span>
                    </div>
                </div>

                <div style="display: flex; align-items: center; color: #2a9d8f;">
                    <i class="fas fa-chevron-right"></i>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;

    // Thêm hiệu ứng hover bằng JS (hoặc CSS)
    document.querySelectorAll('.hot-item').forEach(item => {
        item.onmouseover = () => item.style.transform = "translateX(5px)";
        item.onmouseout = () => item.style.transform = "translateX(0)";
    });
}

// Hàm nhảy đến địa điểm trên bản đồ khi click vào list
window.jumpToPlace = function(id, lat, lng) {
    // 1. Đóng modal
    document.getElementById('hotPlacesModal').style.display = 'none';

    // 2. Zoom bản đồ đến đó
    map.setView([lat, lng], 16, { animate: true });

    // 3. Mở popup chi tiết (Hàm này đã có sẵn ở global từ các file trước)
    if (window.showLocationDetails) {
        setTimeout(() => {
            window.showLocationDetails(id);
        }, 800); // Đợi zoom xong mới mở
    }
};/**
 * 
 */