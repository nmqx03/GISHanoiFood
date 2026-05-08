import { BASE_URL } from './config.js';

const API_USER_URL = `${BASE_URL}/api/users`;
const API_ITINERARY_URL = `${BASE_URL}/api/itineraries`;



function getUserFromStorage() {
    const userStr = localStorage.getItem("currentUser");
    if (userStr) {
        try {
            return JSON.parse(userStr);
        } catch (e) {
            console.error("Lỗi parse user:", e);
            return null;
        }
    }
    return null;
}

function getCurrentUserId() {
    const user = getUserFromStorage();
    return user ? user.id : null;
}

function getAuthToken() {
    const user = getUserFromStorage();
  
    return (user && user.token) ? user.token : localStorage.getItem("token");
}


function getAvatarUrl(url) {
    if (!url) return "https://via.placeholder.com/100";
    if (url.startsWith("http")) return url;
    return `${BASE_URL}${url}`;
}




window.openProfileModal = async function() {
    const userId = getCurrentUserId();

    if (!userId) {
        alert("Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.");
        window.location.href = "/login.html";
        return;
    }

    const modal = document.getElementById('profileModal');
    if (modal) {
        modal.style.display = 'block';
        
        switchProfileTab('info');
        // Tải dữ liệu user mới nhất từ server
        await loadUserProfile(userId);
    } else {
        console.error("Không tìm thấy element #profileModal trong HTML");
    }
}

// Đóng Modal
window.closeProfileModal = function() {
    const modal = document.getElementById('profileModal');
    if (modal) modal.style.display = 'none';
}

// 2. Chuyển Tab (Info / Password / Itinerary)
window.switchProfileTab = function(tabName) {
    // Ẩn tất cả nội dung tab
    document.querySelectorAll('.profile-section').forEach(el => el.style.display = 'none');

    // Bỏ class active ở tất cả các nút
    document.querySelectorAll('.profile-tab-btn').forEach(el => el.classList.remove('active'));

    // Hiển thị tab được chọn
    const selectedTab = document.getElementById('tab-' + tabName);
    if (selectedTab) selectedTab.style.display = 'block';

    // Active nút tương ứng
    const btns = document.querySelectorAll('.profile-tab-btn');
    btns.forEach(btn => {
        const onclickAttr = btn.getAttribute('onclick');
        if (onclickAttr && onclickAttr.includes(tabName)) {
            btn.classList.add('active');
        }
    });

    // Nếu là tab lịch trình thì tải dữ liệu lịch trình
    if (tabName === 'itinerary') {
        loadSavedItineraries();
    }
}

// 3. Tải thông tin user từ Server để điền vào form
async function loadUserProfile(userId) {
    try {
        const response = await fetch(API_USER_URL);
        if (!response.ok) throw new Error("Lỗi kết nối server");

        const users = await response.json();
        const user = users.find(u => u.id == userId);

        if (user) {
            // --- Fill dữ liệu vào Sidebar ---
            const nameDisplay = document.getElementById('profile-name-display');
            if (nameDisplay) nameDisplay.innerText = user.fullName || "Người dùng";

            const avatarDisplay = document.getElementById('profile-avatar-display');
            if (avatarDisplay) avatarDisplay.src = getAvatarUrl(user.avatarUrl);

            const roleDisplay = document.getElementById('profile-role-display');
            if (roleDisplay) roleDisplay.innerText = user.role;

            // --- Fill dữ liệu vào Form Sửa ---
            const inpName = document.getElementById('inp-fullname');
            if (inpName) inpName.value = user.fullName || "";

            const inpEmail = document.getElementById('inp-email');
            if (inpEmail) inpEmail.value = user.email || "";

            // Preview ảnh hiện tại trong form update (nếu có thẻ img preview)
            const previewAvatar = document.getElementById('preview-avatar-update');
            if (previewAvatar) previewAvatar.src = getAvatarUrl(user.avatarUrl);

            // Reset input file
            const inpFile = document.getElementById('inp-avatar-file');
            if (inpFile) inpFile.value = ''; 
        }
    } catch (error) {
        console.error("Lỗi tải thông tin user:", error);
    }
}

// 4. Xử lý Cập nhật Profile (Upload Avatar + Sửa tin)
window.submitUpdateProfile = async function() {
    const userId = getCurrentUserId();
    const token = getAuthToken();

    if (!userId || !token) {
        alert("Lỗi xác thực. Vui lòng đăng nhập lại.");
        return;
    }

    const fullName = document.getElementById('inp-fullname').value;
    const email = document.getElementById('inp-email').value;
    const fileInput = document.getElementById('inp-avatar-file');


    let newAvatarUrl = null;
    if (fileInput && fileInput.files.length > 0) {
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);

        try {
            const resImg = await fetch(`${BASE_URL}/api/users/${userId}/avatar`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }, // Không set Content-Type
                body: formData
            });

            if (resImg.ok) {
                const dataImg = await resImg.json();
                newAvatarUrl = dataImg.avatarUrl; // Lấy URL ảnh mới từ server
            } else {
                const errText = await resImg.text();
                alert("Lỗi upload ảnh: " + errText);
                return; 
            }
        } catch (e) {
            console.error("Lỗi upload:", e);
            alert("Không thể kết nối để upload ảnh.");
            return;
        }
    }


    const dataProfile = {
        fullName: fullName,
        email: email
    };

    try {
        const res = await fetch(`${API_USER_URL}/${userId}/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(dataProfile)
        });

        if (res.ok) {
            alert("✅ Cập nhật hồ sơ thành công!");

            const currentUser = getUserFromStorage();
            if (currentUser) {
                currentUser.fullName = fullName;
                currentUser.email = email;
      
                if (newAvatarUrl) {
                    currentUser.avatarUrl = newAvatarUrl;
                }
                localStorage.setItem("currentUser", JSON.stringify(currentUser));
            }

            window.location.reload();
        } else {
            const errText = await res.text();
            alert("❌ Lỗi cập nhật thông tin: " + errText);
        }
    } catch (e) {
        alert("Có lỗi xảy ra: " + e.message);
    }
}

// 5. Đổi mật khẩu
window.submitChangePass = async function() {
    const userId = getCurrentUserId();
    const token = getAuthToken();

    const oldPass = document.getElementById('inp-old-pass').value;
    const newPass = document.getElementById('inp-new-pass').value;
    const confirmPass = document.getElementById('inp-confirm-pass').value;

    if (!oldPass || !newPass || !confirmPass) {
        alert("Vui lòng điền đầy đủ thông tin.");
        return;
    }

    if (newPass !== confirmPass) {
        alert("⚠️ Mật khẩu mới và xác nhận không khớp!");
        return;
    }

    const data = {
        currentPassword: oldPass,
        newPassword: newPass
    };

    try {
        const res = await fetch(`${API_USER_URL}/${userId}/password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            alert("✅ Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");
            handleLogout();
        } else {
            const errText = await res.text();
            alert("❌ Lỗi: " + errText);
        }
    } catch (e) {
        alert("Có lỗi kết nối: " + e.message);
    }
}



// Tải danh sách
window.loadSavedItineraries = async function() {
    const userId = getCurrentUserId();
    const container = document.getElementById('saved-itineraries-list');
    if (!container) return;

    container.innerHTML = '<div style="text-align:center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i> Đang tải dữ liệu...</div>';

    try {
        const res = await fetch(`${API_ITINERARY_URL}/user/${userId}`);
        if (!res.ok) throw new Error("Không thể tải lịch trình");

        const list = await res.json();

        if (!list || list.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; color:#999; padding: 30px;">
                    <i class="fas fa-folder-open" style="font-size: 40px; margin-bottom: 10px;"></i>
                    <p>Bạn chưa lưu lịch trình nào.</p>
                </div>`;
            return;
        }

        let html = '';
        list.forEach(item => {
            const dateObj = new Date(item.createdAt);
            const dateStr = dateObj.toLocaleDateString('vi-VN') + ' ' + dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

            html += `
                <div class="itinerary-item" style="display: flex; justify-content: space-between; align-items: center; background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #eee;">
                    <div class="itinerary-info">
                        <h4 style="margin: 0 0 5px 0; color: #2a9d8f;">
                            <i class="fas fa-map-signs"></i> ${item.itineraryName}
                        </h4>
                        <span style="font-size: 12px; color: #666;">
                            <i class="far fa-clock"></i> ${dateStr}
                        </span>
                    </div>
                    <button class="btn-view-itinerary" onclick="viewItineraryDetail(${item.id})" 
                            style="padding: 8px 15px; background: #2a9d8f; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        <i class="fas fa-eye"></i> Xem
                    </button>
                </div>
            `;
        });
        container.innerHTML = html;

    } catch (e) {
        container.innerHTML = `<p style="color:red; text-align:center">Lỗi: ${e.message}</p>`;
    }
}

// Xem chi tiết
window.viewItineraryDetail = async function(id) {
    try {
        const res = await fetch(`${API_ITINERARY_URL}/${id}`);
        const item = await res.json();
        
        const titleEl = document.getElementById('detail-itinerary-title');
        if(titleEl) titleEl.innerHTML = `<i class="fas fa-map-marked-alt"></i> ${item.itineraryName}`;
        
        const contentEl = document.getElementById('detail-itinerary-content');
        if(!contentEl) return;

        let html = '';
        try {
            const scheduleData = JSON.parse(item.content);
            if (scheduleData && scheduleData.days) {
                html += `<div class="itinerary-timeline">`;
                scheduleData.days.forEach(day => {
                    html += `
                        <div class="day-section">
                            <h4 class="day-header"><i class="far fa-calendar-check"></i> ${day.day}</h4>
                            <div class="activities-list">`;
                    if (Array.isArray(day.activities)) {
                        day.activities.forEach(act => {
                            let time = "";
                            let content = act;
                            const timeMatch = act.match(/^(\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}:?)/);
                            if (timeMatch) {
                                time = timeMatch[0].replace(':', '').trim();
                                content = act.substring(timeMatch[0].length).trim();
                            }
                            html += `
                                <div class="timeline-item">
                                    <div class="time-marker">${time}</div>
                                    <div class="event-content">${content}</div>
                                </div>`;
                        });
                    }
                    html += `</div></div>`;
                });
                html += `</div>`;
            } else { throw new Error("Not JSON"); }
        } catch (e) {
            // Fallback nếu không phải JSON
            if (typeof marked !== 'undefined') {
                html = marked.parse(item.content);
            } else {
                html = item.content.replace(/\n/g, '<br>');
            }
        }
        
        contentEl.innerHTML = html;
        const modal = document.getElementById('itineraryDetailModal');
        if(modal) modal.style.display = 'block';

    } catch (e) {
        console.error(e);
        alert("Không tải được chi tiết lịch trình.");
    }
}