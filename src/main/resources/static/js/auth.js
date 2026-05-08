// Xử lý đăng nhập
async function login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error('Email hoặc mật khẩu không đúng');
    const data = await res.json();
    saveUserSession(data);
    return data;
}

// Xử lý đăng ký
async function register(fullName, email, password) {
    const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password })
    });
    if (!res.ok) throw new Error('Email đã tồn tại hoặc lỗi server');
    const data = await res.json();
    saveUserSession(data);
    return data;
}

// Lưu thông tin đăng nhập
function saveUserSession(data) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('userName', data.fullName || data.email);
    localStorage.setItem('userRole', data.role);
    localStorage.setItem('userEmail', data.email);
}

// Đăng xuất
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    window.location.href = '/';
}

// Cập nhật giao diện navbar theo trạng thái đăng nhập
function updateNavbar() {
    const token    = getToken();
    const userName = localStorage.getItem('userName');
    const role     = getUserRole();

    const loginBtn    = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const userMenu    = document.getElementById('userMenu');
    const userNameEl  = document.getElementById('userName');
    const adminMenu   = document.getElementById('adminMenu');

    if (token && userName) {
        if (loginBtn)    loginBtn.classList.add('d-none');
        if (registerBtn) registerBtn.classList.add('d-none');
        if (userMenu)    userMenu.classList.remove('d-none');
        if (userNameEl)  userNameEl.textContent = userName;
        if (adminMenu && role === 'ADMIN') adminMenu.classList.remove('d-none');
    } else {
        if (loginBtn)    loginBtn.classList.remove('d-none');
        if (registerBtn) registerBtn.classList.remove('d-none');
        if (userMenu)    userMenu.classList.add('d-none');
    }
}

// Gọi khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', updateNavbar);
