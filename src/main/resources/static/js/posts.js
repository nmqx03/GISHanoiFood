// Xử lý bài viết ẩm thực
async function loadPosts() {
    try {
        const res  = await fetch(`${API_BASE}/posts`);
        const data = await res.json();
        renderPosts(data);
    } catch (err) {
        console.error('Lỗi load posts:', err);
    }
}

async function loadOfficialPosts() {
    try {
        const res  = await fetch(`${API_BASE}/posts/official`);
        const data = await res.json();
        renderPosts(data);
    } catch (err) {
        console.error('Lỗi load official posts:', err);
    }
}

function renderPosts(posts) {
    const container = document.getElementById('postList');
    if (!container) return;
    if (posts.length === 0) {
        container.innerHTML = `<div class="text-center text-muted py-5">
            <i class="fas fa-newspaper fa-3x mb-2"></i><br>Chưa có bài viết nào
        </div>`;
        return;
    }
    container.innerHTML = posts.map(post => `
        <div class="col-md-4 mb-4">
            <div class="post-card card h-100" onclick="showPostDetail(${post.id})" style="cursor:pointer">
                <img src="${post.imageUrl || 'https://via.placeholder.com/400x200'}"
                     class="card-img-top" alt="${post.title}">
                <div class="card-body">
                    <div class="mb-2">
                        ${post.isOfficial ? '<span class="post-badge-official">Chính thức</span>' : ''}
                        <span class="text-muted" style="font-size:12px">
                            ${new Date(post.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                    </div>
                    <h6 class="card-title fw-bold">${post.title}</h6>
                    <p class="card-text text-muted" style="font-size:13px">
                        ${post.content.substring(0, 100)}...
                    </p>
                </div>
            </div>
        </div>`).join('');
}

async function showPostDetail(id) {
    try {
        const res  = await fetch(`${API_BASE}/posts/${id}`);
        const post = await res.json();
        document.getElementById('postModalTitle').textContent = post.title;
        document.getElementById('postModalBody').innerHTML = `
            ${post.imageUrl ? `<img src="${post.imageUrl}" class="img-fluid rounded mb-3 w-100" style="max-height:300px;object-fit:cover">` : ''}
            <div class="text-muted mb-3" style="font-size:13px">
                <i class="fas fa-user me-1"></i>${post.user?.fullName || 'Admin'}
                <i class="fas fa-calendar ms-3 me-1"></i>${new Date(post.createdAt).toLocaleDateString('vi-VN')}
            </div>
            <div style="font-size:15px;line-height:1.8">${post.content}</div>
            ${post.places && post.places.length > 0 ? `
                <hr>
                <h6>Quán ăn liên quan:</h6>
                <div class="d-flex flex-wrap gap-2">
                    ${post.places.map(p => `
                        <span class="badge bg-light text-dark border" style="cursor:pointer"
                              onclick="showPlaceDetail(${p.id})">${p.name}</span>`).join('')}
                </div>` : ''}`;
        new bootstrap.Modal(document.getElementById('postModal')).show();
    } catch (err) {
        console.error('Lỗi load post detail:', err);
    }
}

async function createPost(title, content, imageUrl, restaurantIds = []) {
    if (!requireLogin()) return;
    try {
        const res = await fetch(`${API_BASE}/posts`, {
            method: 'POST',
            headers: jsonAuthHeader(),
            body: JSON.stringify({ title, content, imageUrl, restaurantIds })
        });
        if (res.ok) {
            showToast('Bài viết đã gửi, chờ duyệt!', 'success');
            loadPosts();
        }
    } catch (err) {
        showToast('Lỗi tạo bài viết', 'error');
    }
}

async function deletePost(id) {
    if (!confirm('Xóa bài viết này?')) return;
    try {
        await fetch(`${API_BASE}/posts/${id}`, { method: 'DELETE', headers: authHeader() });
        showToast('Đã xóa bài viết', 'success');
        loadPosts();
    } catch (err) {
        showToast('Lỗi xóa bài viết', 'error');
    }
}
