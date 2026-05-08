// js/auth.js
import { BASE_URL } from './config.js';

export function getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) return null;
    try {
        return JSON.parse(userStr);
    } catch (e) {
        return null;
    }
}

export function checkLoginStatus() {
    const user = getCurrentUser();
    const actionsContainer = document.getElementById('user-actions');
    if (!actionsContainer) return;

    if (user && user.token) {
        // Đã đăng nhập
        const avatarUrl = user.avatarUrl
            ? (user.avatarUrl.startsWith('http') ? user.avatarUrl : `${BASE_URL}${user.avatarUrl}`)
            : 'https://via.placeholder.com/36';

        actionsContainer.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <img src="${avatarUrl}" 
                     alt="Avatar"
                     onerror="this.src='https://via.placeholder.com/36'"
                     style="width:36px; height:36px; border-radius:50%; object-fit:cover; 
                            border:2px solid rgba(255,255,255,0.5); cursor:pointer;"
                     onclick="window.openProfileModal()"
                     title="Hồ sơ của bạn">
                <span style="color:white; font-size:14px; font-weight:500; 
                             max-width:120px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                    ${user.fullName || user.email || 'Người dùng'}
                </span>
                <button onclick="handleLogout()" 
                        style="background:rgba(255,255,255,0.15); border:1px solid rgba(255,255,255,0.3);
                               color:white; padding:6px 14px; border-radius:6px; cursor:pointer;
                               font-size:13px; transition:background 0.2s;"
                        onmouseover="this.style.background='rgba(255,255,255,0.25)'"
                        onmouseout="this.style.background='rgba(255,255,255,0.15)'">
                    <i class="fas fa-sign-out-alt"></i> Đăng xuất
                </button>
            </div>
        `;
    } else {
        // Chưa đăng nhập
        actionsContainer.innerHTML = `
            <button onclick="window.location.href='/login'" 
                    style="background:rgba(255,255,255,0.15); border:1px solid rgba(255,255,255,0.3);
                           color:white; padding:8px 16px; border-radius:6px; cursor:pointer;
                           font-size:14px; margin-right:8px; transition:background 0.2s;"
                    onmouseover="this.style.background='rgba(255,255,255,0.25)'"
                    onmouseout="this.style.background='rgba(255,255,255,0.15)'">
                <i class="fas fa-sign-in-alt"></i> Đăng nhập
            </button>
            <button onclick="window.location.href='/register'"
                    style="background:white; border:none; color:var(--primary);
                           padding:8px 16px; border-radius:6px; cursor:pointer;
                           font-size:14px; font-weight:600; transition:opacity 0.2s;"
                    onmouseover="this.style.opacity='0.85'"
                    onmouseout="this.style.opacity='1'">
                Đăng ký
            </button>
        `;
    }
}

// Đăng xuất
window.handleLogout = function() {
    if (!confirm('Bạn có chắc muốn đăng xuất?')) return;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    window.location.href = '/login';
}
