// Xử lý upload file ảnh
async function uploadImage(file) {
    if (!file) return null;
    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await fetch(`${API_BASE}/files/upload`, {
            method: 'POST',
            headers: authHeader(),
            body: formData
        });
        if (!res.ok) throw new Error('Upload thất bại');
        const data = await res.json();
        return data.url;
    } catch (err) {
        showToast('Lỗi upload ảnh: ' + err.message, 'error');
        return null;
    }
}

// Preview ảnh trước khi upload
function previewImage(inputId, previewId) {
    const input   = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    if (!input || !preview) return;

    input.addEventListener('change', () => {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.src     = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    });
}

// Kiểm tra kích thước file
function validateImageFile(file, maxSizeMB = 5) {
    if (!file) return false;
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
        showToast('Chỉ chấp nhận file ảnh (JPG, PNG, WEBP)', 'error');
        return false;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
        showToast(`Ảnh không được vượt quá ${maxSizeMB}MB`, 'error');
        return false;
    }
    return true;
}
