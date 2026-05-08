import { BASE_URL } from './config.js';
import { getCurrentUser } from './auth.js';


let placesData = [];


export function initFavoriteSystem(allPlaces) {
    placesData = allPlaces; 

    window.handleToggleFavorite = handleToggleFavorite;
    window.openFavoriteModal = openFavoriteModal;
    window.closeFavoriteModal = closeFavoriteModal;
    window.removeFavorite = removeFavorite;
    window.goToFavoriteLocation = goToFavoriteLocation;
	
	const btnFavControl = document.getElementById("btn-favorites");
	    if (btnFavControl) {
	     
	        btnFavControl.onclick = function() {
	            openFavoriteModal();
	        };
	    }
}


export async function getFavoriteStatus(placeId) {
    const user = getCurrentUser();
    if (!user || !user.id) return false;

    try {
        const res = await fetch(`${BASE_URL}/api/favorites/check?userId=${user.id}&placeId=${placeId}`);
        const data = await res.json();
        return data.isFavorite;
    } catch (e) {
        return false;
    }
}


async function handleToggleFavorite(placeId, btnElement) {
    const user = getCurrentUser();

    if (!user || !user.id) {
        if(confirm("Bạn cần đăng nhập để lưu địa điểm yêu thích. Đến trang đăng nhập ngay?")) {
             window.location.href = "./login"; 
        }
        return;
    }

    const icon = btnElement.querySelector('i');
    
  
    btnElement.style.transform = "scale(1.2)";
    setTimeout(() => btnElement.style.transform = "scale(1)", 200);

    try {
        const res = await fetch(`${BASE_URL}/api/favorites/toggle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, placeId: placeId })
        });
        
        const data = await res.json();

        // Cập nhật giao diện
        if (data.status === 'added') {
            icon.className = 'fas fa-heart'; 
            icon.style.color = '#e63946';
        } else {
            icon.className = 'far fa-heart';
            icon.style.color = '#555';
        }
        
        const modal = document.getElementById("favorite-modal");
        if (modal && modal.style.display === "flex") {
            openFavoriteModal(); 
        }

    } catch (e) {
        console.error(e);
        alert("Lỗi kết nối server!");
    }
}


async function openFavoriteModal() {
    const user = getCurrentUser();
    if (!user || !user.id) {
        alert("Vui lòng đăng nhập!");
        return;
    }

    const modal = document.getElementById("favorite-modal");
    const container = document.getElementById("favorite-list-container");
    
    if(!modal) return;
    
    modal.style.display = "flex";
    container.innerHTML = `<div style="text-align:center; padding:20px; color:#2a9d8f;"><i class="fas fa-spinner fa-spin"></i> Đang tải...</div>`;

    try {
        // Gọi API lấy danh sách ID
        const res = await fetch(`${BASE_URL}/api/favorites/user/${user.id}`);
        if (!res.ok) throw new Error("Lỗi tải");
        
        const favList = await res.json(); // 

        if (favList.length === 0) {
            container.innerHTML = `<p style="text-align:center; color:#888; padding:20px;">Bạn chưa có địa điểm yêu thích nào.</p>`;
            return;
        }

        // Lọc thông tin chi tiết từ biến placesData
        const myFavPlaces = placesData.filter(p => favList.some(f => f.placeId === p.id));
        
        renderFavoriteListHTML(myFavPlaces);

    } catch (e) {
        console.error(e);
        container.innerHTML = `<p style="text-align:center; color:red;">Không tải được dữ liệu.</p>`;
    }
}


function renderFavoriteListHTML(places) {
    const container = document.getElementById("favorite-list-container");
    let html = '';

    places.forEach(p => {
        html += `
            <div class="fav-item" onclick="window.goToFavoriteLocation(${p.id})" 
                 style="display:flex; align-items:center; padding:10px; border-bottom:1px solid #eee; cursor:pointer; transition:0.2s;">
                
                <img src="${BASE_URL}/${p.imageUrl}" 
                     style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px; margin-right: 15px;" 
                     onerror="this.src='./img/placeholder.jpg'">
                
                <div style="flex-grow: 1;">
                    <h4 style="margin: 0; color: #333; font-size:1em;">${p.name}</h4>
                    <span style="font-size: 0.85em; color: #666;">${p.category ? p.category.name : 'Địa điểm'}</span>
                </div>
                
                <button onclick="event.stopPropagation(); window.removeFavorite(${p.id})" 
                        title="Xóa"
                        style="background: #fff0f0; border: none; width: 32px; height: 32px; border-radius: 50%; color: #e63946; cursor: pointer;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    });

    container.innerHTML = html;
}



function closeFavoriteModal() {
    document.getElementById("favorite-modal").style.display = "none";
}

function goToFavoriteLocation(placeId) {
    closeFavoriteModal();
    // Gọi hàm showLocationDetails bên places.js (đã được gán vào window)
    if (typeof window.showLocationDetails === 'function') {
        window.showLocationDetails(placeId);
    }
}

async function removeFavorite(placeId) {
    if(!confirm("Xóa địa điểm này khỏi danh sách?")) return;
    

    const dummyBtn = document.createElement('div');
    dummyBtn.innerHTML = '<i></i>'; 
    
    await handleToggleFavorite(placeId, dummyBtn);
    
    // Nếu đang xem chi tiết địa điểm đó thì cập nhật icon tim về màu xám
    const currentDetailBtn = document.querySelector(`button[onclick*="handleToggleFavorite(${placeId}"]`);
    if(currentDetailBtn) {
        const icon = currentDetailBtn.querySelector('i');
        if(icon) {
            icon.className = 'far fa-heart';
            icon.style.color = '#555';
        }
    }
}


window.addEventListener('click', (e) => {
    const modal = document.getElementById("favorite-modal");
    if (e.target === modal) closeFavoriteModal();
});