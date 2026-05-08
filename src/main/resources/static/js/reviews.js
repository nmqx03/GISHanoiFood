// Xử lý đánh giá quán ăn
let currentPlaceId = null;

// Load đánh giá của quán
async function loadReviews(placeId) {
    currentPlaceId = placeId;
    try {
        const res     = await fetch(`${API_BASE}/reviews/place/${placeId}`);
        const reviews = await res.json();
        renderReviews(placeId, reviews);
    } catch (err) {
        console.error('Lỗi load reviews:', err);
    }
}

// Render danh sách đánh giá
function renderReviews(placeId, reviews) {
    const container = document.getElementById(`reviewSection-${placeId}`);
    if (!container) return;

    const avgRating = reviews.length > 0
        ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
        : 0;

    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="mb-0"><i class="fas fa-star text-warning me-1"></i>Đánh giá (${reviews.length})</h6>
            <span class="badge bg-warning text-dark">${avgRating} / 5</span>
        </div>
        ${reviews.length === 0
            ? '<p class="text-muted text-center">Chưa có đánh giá nào</p>'
            : reviews.map(r => renderReviewCard(r)).join('')
        }
        ${isLoggedIn() ? renderReviewForm(placeId) : '<p class="text-center"><a href="/login" class="text-danger">Đăng nhập</a> để đánh giá</p>'}`;
}

// Render card đánh giá
function renderReviewCard(review) {
    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    return `
        <div class="review-card">
            <div class="d-flex align-items-center gap-2 mb-2">
                <div class="review-avatar">${(review.user?.fullName || 'U')[0].toUpperCase()}</div>
                <div>
                    <div style="font-size:14px;font-weight:600">${review.user?.fullName || 'Người dùng'}</div>
                    <div class="star-rating" style="font-size:14px">${stars}</div>
                </div>
            </div>
            <p style="font-size:13px;margin:0;color:#555">${review.content || ''}</p>
        </div>`;
}

// Render form đánh giá
function renderReviewForm(placeId) {
    return `
        <div class="mt-3 p-3 bg-light rounded">
            <h6 class="mb-2">Viết đánh giá của bạn</h6>
            <div class="mb-2">
                <label class="form-label small">Điểm đánh giá</label>
                <div id="starSelector-${placeId}" class="d-flex gap-1">
                    ${[1,2,3,4,5].map(i => `
                        <span class="star-btn" data-val="${i}" onclick="selectStar(${placeId}, ${i})"
                              style="font-size:24px;cursor:pointer;color:#ddd">★</span>`).join('')}
                </div>
            </div>
            <textarea id="reviewContent-${placeId}" class="form-control mb-2"
                      rows="2" placeholder="Chia sẻ trải nghiệm của bạn..."></textarea>
            <button class="btn btn-danger btn-sm" onclick="submitReview(${placeId})">
                <i class="fas fa-paper-plane me-1"></i>Gửi đánh giá
            </button>
        </div>`;
}

// Chọn sao
let selectedRating = {};
function selectStar(placeId, rating) {
    selectedRating[placeId] = rating;
    const stars = document.querySelectorAll(`#starSelector-${placeId} .star-btn`);
    stars.forEach(s => {
        s.style.color = parseInt(s.dataset.val) <= rating ? '#f39c12' : '#ddd';
    });
}

// Gửi đánh giá
async function submitReview(placeId) {
    if (!requireLogin()) return;
    const rating  = selectedRating[placeId];
    const content = document.getElementById(`reviewContent-${placeId}`)?.value.trim();

    if (!rating) { showToast('Vui lòng chọn số sao', 'error'); return; }

    try {
        const res = await fetch(`${API_BASE}/reviews`, {
            method: 'POST',
            headers: jsonAuthHeader(),
            body: JSON.stringify({ restaurantId: placeId, rating, content })
        });
        if (res.ok) {
            showToast('Đánh giá thành công!', 'success');
            loadReviews(placeId);
        } else {
            showToast('Bạn đã đánh giá quán này rồi', 'error');
        }
    } catch (err) {
        showToast('Lỗi: ' + err.message, 'error');
    }
}
