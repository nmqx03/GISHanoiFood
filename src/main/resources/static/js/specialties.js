import { BASE_URL } from './config.js';

export function initSpecialtiesSystem() {
    const btn = document.getElementById('btn-specialties');
    if (btn) {
        btn.addEventListener('click', () => {
            openSpecialtiesModal();
        });
    }
}

async function openSpecialtiesModal() {
    const modal = document.getElementById('specialtiesModal');
    modal.style.display = 'flex';
    
    // Gọi API lấy dữ liệu
    try {
        const listContainer = document.getElementById('specialties-list');
        listContainer.innerHTML = '<p style="text-align:center; width:100%;">Đang tải đặc sản...</p>';

        const response = await fetch(`${BASE_URL}/api/specialties`);
        const specialties = await response.json();

        renderSpecialties(specialties);
    } catch (error) {
        console.error("Lỗi khi tải đặc sản:", error);
    }
}

function renderSpecialties(data) {
    const listContainer = document.getElementById('specialties-list');
    if (!data || data.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; color: #777; width: 100%; grid-column: 1 / -1;">Chưa có thông tin đặc sản.</p>';
        return;
    }

    let html = '';
    data.forEach(item => {
        // Xử lý đường dẫn ảnh: Nếu có ảnh thì ghép với BASE_URL, nếu không có thì dùng ảnh mặc định
        // Lưu ý: Nếu backend trả về đường dẫn bắt đầu bằng / thì không cần gạch chéo ở giữa nữa
        let imgUrl = './img/no-food.jpg'; // Đường dẫn ảnh mặc định dự phòng
        if (item.imageUrl) {
            imgUrl = item.imageUrl.startsWith('http') ? item.imageUrl : `${BASE_URL}/${item.imageUrl}`;
        }

        html += `
            <div class="specialty-card">
                <div class="specialty-img-container">
                    <img src="${imgUrl}" alt="${item.name}" class="specialty-image" 
                         onerror="this.src='https://via.placeholder.com/300x200?text=Ha+Noi+Food'">
                </div>
                <div class="specialty-content">
                    <h4 class="specialty-title">${item.name}</h4>
                    <div class="specialty-origin">
                        <i class="fas fa-map-marker-alt text-red"></i> ${item.origin || 'Đặc sản Hà Nội'}
                    </div>
                    <p class="specialty-desc">${item.description || 'Đang cập nhật mô tả chi tiết...'}</p>
                    <div class="specialty-footer">
                        <span class="specialty-price">
                            <i class="fas fa-tag"></i> ${item.priceRange || 'Liên hệ nhà hàng'}
                        </span>
                    </div>
                </div>
            </div>
        `;
    });
    listContainer.innerHTML = html;
}

// Hàm đóng modal
window.closeSpecialtiesModal = function() {
    document.getElementById('specialtiesModal').style.display = 'none';
}