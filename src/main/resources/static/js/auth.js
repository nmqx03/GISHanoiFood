import { BASE_URL } from './config.js';

export function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem('currentUser') || 'null'); } catch { return null; }
}

export function checkLoginStatus() {
  const user = getCurrentUser();
  const foot = document.getElementById('sb-foot');
  if (!foot) return;

  if (user && user.token) {
    const avatarUrl = user.avatarUrl
      ? (user.avatarUrl.startsWith('http') ? user.avatarUrl : `${BASE_URL}${user.avatarUrl}`)
      : null;
    const initials = (user.fullName || user.email || 'U').substring(0, 2).toUpperCase();

    foot.innerHTML = `
      <button class="user-card" onclick="window.openProfileModal()">
        <div class="avatar-sb">
          ${avatarUrl
            ? `<img src="${avatarUrl}" onerror="this.style.display='none'" alt="avatar"/>`
            : initials}
        </div>
        <div class="meta">
          <div class="n">${user.fullName || 'Người dùng'}</div>
          <div class="e">${user.email || ''}</div>
        </div>
        <span class="more"><i class="fas fa-ellipsis"></i></span>
      </button>
      <button onclick="handleLogout()" style="margin-top:6px;width:100%;padding:8px;border-radius:8px;background:rgba(255,255,255,.05);border:1px solid var(--sb-line);color:var(--sb-muted);font-size:12px;transition:all .2s" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='var(--sb-muted)'">
        <i class="fas fa-sign-out-alt"></i> Đăng xuất
      </button>`;
  } else {
    foot.innerHTML = `
      <a href="/login" style="display:block;width:100%;padding:10px;border-radius:8px;background:var(--accent);color:#fff;text-align:center;font-size:13.5px;font-weight:600;text-decoration:none;transition:opacity .2s" onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">
        <i class="fas fa-sign-in-alt"></i> Đăng nhập
      </a>
      <a href="/register" style="display:block;width:100%;margin-top:6px;padding:10px;border-radius:8px;border:1px solid var(--sb-line);color:var(--sb-text);text-align:center;font-size:13.5px;text-decoration:none;transition:background .2s" onmouseover="this.style.background='rgba(255,255,255,.06)'" onmouseout="this.style.background='transparent'">
        Đăng ký
      </a>`;
  }
}

window.handleLogout = function () {
  if (!confirm('Bạn có chắc muốn đăng xuất?')) return;
  localStorage.removeItem('currentUser');
  localStorage.removeItem('token');
  window.location.href = '/login';
};