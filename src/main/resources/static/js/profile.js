import { BASE_URL } from './config.js';

const API_USER      = `${BASE_URL}/api/users`;
const API_ITINERARY = `${BASE_URL}/api/itineraries`;

function getUserFromStorage() {
  try { return JSON.parse(localStorage.getItem('currentUser') || 'null'); } catch { return null; }
}
function getCurrentUserId() { return getUserFromStorage()?.id || null; }
function getAuthToken()     { return getUserFromStorage()?.token || localStorage.getItem('token'); }

function getAvatarUrl(url) {
  if (!url) return 'https://via.placeholder.com/100';
  if (url.startsWith('http')) return url;
  return `${BASE_URL}${url}`;
}

window.openProfileModal = async function() {
  const userId = getCurrentUserId();
  if (!userId) {
    alert('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
    window.location.href = '/login';
    return;
  }

  const modal = document.getElementById('profile-modal');
  if (!modal) return;
  modal.classList.add('open');
  window.switchProfileTab?.('info');
  await loadUserProfile(userId);
};

window.switchProfileTab = function(tabName) {
  document.querySelectorAll('.profile-section').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.profile-tab-btn').forEach(el => el.classList.remove('active'));

  const tab = document.getElementById('tab-' + tabName);
  if (tab) tab.style.display = 'block';

  document.querySelectorAll('.profile-tab-btn').forEach(btn => {
    const onclickAttr = btn.getAttribute('onclick') || '';
    if (onclickAttr.includes(`'${tabName}'`)) btn.classList.add('active');
  });

  if (tabName === 'itinerary') loadSavedItineraries();
};

async function loadUserProfile(userId) {
  try {
    const res = await fetch(API_USER);
    if (!res.ok) return;
    const users = await res.json();
    const user  = users.find(u => u.id == userId);
    if (!user) return;

    const inpName  = document.getElementById('inp-fullname');
    const inpEmail = document.getElementById('inp-email');
    if (inpName)  inpName.value  = user.fullName || '';
    if (inpEmail) inpEmail.value = user.email || '';
  } catch (e) {
    console.error('Lỗi tải profile:', e);
  }
}

window.submitUpdateProfile = async function() {
  const userId = getCurrentUserId();
  const token  = getAuthToken();
  if (!userId || !token) { alert('Vui lòng đăng nhập!'); return; }

  const fullName  = document.getElementById('inp-fullname')?.value;
  const email     = document.getElementById('inp-email')?.value;
  const fileInput = document.getElementById('inp-avatar-file');

  let newAvatarUrl = null;
  if (fileInput?.files?.length) {
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    try {
      const resImg = await fetch(`${API_USER}/${userId}/avatar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (resImg.ok) {
        const dataImg = await resImg.json();
        newAvatarUrl = dataImg.avatarUrl;
      } else {
        alert('Lỗi upload ảnh');
        return;
      }
    } catch {
      alert('Không thể upload ảnh');
      return;
    }
  }

  try {
    const res = await fetch(`${API_USER}/${userId}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ fullName, email })
    });

    if (res.ok) {
      alert('Cập nhật hồ sơ thành công!');
      const cu = getUserFromStorage();
      if (cu) {
        cu.fullName = fullName;
        cu.email    = email;
        if (newAvatarUrl) cu.avatarUrl = newAvatarUrl;
        localStorage.setItem('currentUser', JSON.stringify(cu));
      }
      window.location.reload();
    } else {
      const err = await res.text();
      alert('Lỗi: ' + err);
    }
  } catch (e) {
    alert('Lỗi: ' + e.message);
  }
};

window.submitChangePass = async function() {
  const userId = getCurrentUserId();
  const token  = getAuthToken();

  const oldP = document.getElementById('inp-old-pass')?.value;
  const newP = document.getElementById('inp-new-pass')?.value;
  const conP = document.getElementById('inp-confirm-pass')?.value;

  if (!oldP || !newP || !conP) return alert('Điền đầy đủ thông tin.');
  if (newP !== conP)            return alert('Mật khẩu mới không khớp!');

  try {
    const res = await fetch(`${API_USER}/${userId}/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ currentPassword: oldP, newPassword: newP })
    });
    if (res.ok) {
      alert('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
      window.handleLogout?.();
    } else {
      alert('Lỗi: ' + await res.text());
    }
  } catch (e) {
    alert('Lỗi: ' + e.message);
  }
};

window.loadSavedItineraries = async function() {
  const userId    = getCurrentUserId();
  const container = document.getElementById('saved-itineraries-list');
  if (!container) return;

  container.innerHTML = '<div style="text-align:center;padding:20px"><i class="fas fa-spinner fa-spin"></i> Đang tải...</div>';

  try {
    const res = await fetch(`${API_ITINERARY}/user/${userId}`);
    const list = await res.json();

    if (!list?.length) {
      container.innerHTML = `
        <div style="text-align:center;color:var(--muted);padding:30px">
          <i class="fas fa-folder-open" style="font-size:40px;margin-bottom:10px"></i>
          <p style="font-size:13px">Bạn chưa lưu lịch trình nào.</p>
        </div>`;
      return;
    }

    container.innerHTML = list.map(item => {
      const date = new Date(item.createdAt);
      const dateStr = date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      return `
        <div style="display:flex;align-items:center;justify-content:space-between;background:#fff;border:1px solid var(--line);padding:12px;border-radius:10px;margin-bottom:8px">
          <div>
            <h4 style="font-family:'Instrument Serif',serif;font-size:16px;color:var(--accent);margin-bottom:3px">
              <i class="fas fa-map-signs"></i> ${item.itineraryName}
            </h4>
            <span style="font-size:11.5px;color:var(--muted)"><i class="far fa-clock"></i> ${dateStr}</span>
          </div>
          <button onclick="viewItineraryDetail(${item.id})" style="padding:7px 12px;background:var(--ink);color:#fff;border-radius:7px;font-size:12px"><i class="fas fa-eye"></i> Xem</button>
        </div>`;
    }).join('');
  } catch {
    container.innerHTML = '<p style="color:#e63946;text-align:center;padding:20px">Lỗi tải dữ liệu.</p>';
  }
};

window.viewItineraryDetail = async function(id) {
  try {
    const res = await fetch(`${API_ITINERARY}/${id}`);
    const item = await res.json();
    alert(`${item.itineraryName}\n\n${item.content}`);
  } catch {
    alert('Không tải được chi tiết.');
  }
};