// Xử lý trang hồ sơ người dùng
async function loadProfile() {
    if (!requireLogin()) return;
    try {
        const res  = await fetch(`${API_BASE}/users/me`, { headers: authHeader() });
        const user = await res.json();
        renderProfile(user);
    } catch (err) {
        console.error('Lỗi load profile:', err);
    }
}

function renderProfile(user) {
    const el = document.getElementById('profileInfo');
    if (!el) return;
    el.innerHTML = `
        <div class="text-center mb-3">
            <div class="profile-avatar mx-auto mb-2 d-flex align-items-center justify-content-center"
                 style="width:80px;height:80px;background:#e74c3c;color:#fff;font-size:2rem;border-radius:50%">
                ${(user.fullName || user.email)[0].toUpperCase()}
            </div>
            <h5 class="fw-bold mb-0">${user.fullName || 'Chưa có tên'}</h5>
            <p class="text-muted small">${user.email}</p>
            <span class="badge ${user.role === 'ADMIN' ? 'bg-danger' : 'bg-secondary'}">${user.role}</span>
        </div>`;

    const nameEl  = document.getElementById('profileName');
    const emailEl = document.getElementById('profileEmail');
    if (nameEl)  nameEl.value  = user.fullName || '';
    if (emailEl) emailEl.value = user.email || '';
}

async function updateProfile() {
    if (!requireLogin()) return;
    const fullName = document.getElementById('profileName')?.value.trim();
    try {
        const res = await fetch(`${API_BASE}/users/me`, {
            method: 'PUT',
            headers: jsonAuthHeader(),
            body: JSON.stringify({ fullName })
        });
        if (res.ok) {
            localStorage.setItem('userName', fullName);
            showToast('Cập nhật thành công!', 'success');
        }
    } catch (err) {
        showToast('Lỗi cập nhật', 'error');
    }
}

async function changePassword() {
    const oldPassword = document.getElementById('oldPassword')?.value;
    const newPassword = document.getElementById('newPassword')?.value;
    const confirmPwd  = document.getElementById('confirmNewPassword')?.value;

    if (newPassword !== confirmPwd) {
        showToast('Mật khẩu xác nhận không khớp', 'error');
        return;
    }
    try {
        const res = await fetch(`${API_BASE}/users/me/password`, {
            method: 'PUT',
            headers: jsonAuthHeader(),
            body: JSON.stringify({ oldPassword, newPassword })
        });
        if (res.ok) showToast('Đổi mật khẩu thành công!', 'success');
        else showToast('Mật khẩu cũ không đúng', 'error');
    } catch (err) {
        showToast('Lỗi đổi mật khẩu', 'error');
    }
}

async function loadFavorites() {
    if (!requireLogin()) return;
    try {
        const res  = await fetch(`${API_BASE}/favorites`, { headers: authHeader() });
        const data = await res.json();
        renderFavorites(data);
    } catch (err) {
        console.error('Lỗi load favorites:', err);
    }
}

function renderFavorites(favorites) {
    const container = document.getElementById('favoriteList');
    if (!container) return;
    if (favorites.length === 0) {
        container.innerHTML = `<div class="text-center text-muted py-4">
            <i class="fas fa-heart-broken fa-2x mb-2"></i><br>Chưa có quán yêu thích
        </div>`;
        return;
    }
    container.innerHTML = favorites.map(fav => `
        <div class="d-flex align-items-center gap-3 p-2 border-bottom">
            <img src="${fav.place?.imageUrl || 'https://via.placeholder.com/50x50'}"
                 style="width:50px;height:50px;object-fit:cover;border-radius:8px">
            <div class="flex-grow-1">
                <div style="font-size:14px;font-weight:600">${fav.place?.name || ''}</div>
                <div style="font-size:12px;color:#777">${fav.place?.address || ''}</div>
            </div>
            <button class="btn btn-sm btn-outline-danger" onclick="removeFavorite(${fav.place?.id})">
                <i class="fas fa-trash"></i>
            </button>
        </div>`).join('');
}

async function removeFavorite(placeId) {
    try {
        await fetch(`${API_BASE}/favorites/${placeId}`, { method: 'DELETE', headers: authHeader() });
        showToast('Đã xóa khỏi yêu thích', 'success');
        loadFavorites();
    } catch (err) {
        showToast('Lỗi xóa yêu thích', 'error');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
    loadFavorites();
});
