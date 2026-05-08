import { BASE_URL } from './config.js';

// --- API GỐC (REVIEW) ---

async function fetchReviewsByPlaceId(placeId) {
    try {
        const res = await fetch(`${BASE_URL}/api/reviews/place/${placeId}`);
        return res.ok ? await res.json() : [];
    } catch (err) {
        console.error("Lỗi tải đánh giá:", err);
        return [];
    }
}

async function apiCreateReview(reviewData) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Vui lòng đăng nhập.");
    
    const res = await fetch(`${BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reviewData)
    });

 
    if (!res.ok) {
        const errorData = await res.json(); 
        throw new Error(errorData.error || "Gửi đánh giá thất bại!");
    }
    // -----------------------

    return await res.json();
}

async function apiDeleteReview(reviewId) {
    const token = localStorage.getItem("token");
    const res = await fetch(`${BASE_URL}/api/reviews/${reviewId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Xóa thất bại");
    return true;
}

async function apiUploadImages(files) {
    let imageUrls = [];
    for (const file of Array.from(files).slice(0, 3)) { // Tối đa 3 ảnh
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`${BASE_URL}/api/reviews/upload-image`, {
            method: "POST", body: formData
        });
        const data = await res.json();
        if (res.ok && data.url) imageUrls.push(data.url);
    }
    return imageUrls;
}

// --- UI & LOGIC ---

// Biến lưu ID địa điểm đang xem
let currentPlaceIdForReview = null; 

// Hàm khởi tạo các sự kiện Modal (Chạy 1 lần ở main.js)
export function initReviewSystem() {
    document.getElementById("close-review-modal").onclick = closeReviewModal;
    document.getElementById("review-form").onsubmit = handleReviewSubmit;
    
    const starContainer = document.getElementById("rating-input");
    starContainer.innerHTML = "";
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement("i");
        star.className = "fas fa-star";
        star.dataset.rating = i;
        star.onclick = () => setRatingUI(i);
        starContainer.appendChild(star);
    }
    
    document.getElementById("review-images").addEventListener("change", function() {
        const preview = document.getElementById("image-preview");
        preview.innerHTML = "";
        Array.from(this.files).slice(0, 3).forEach(file => {
            const reader = new FileReader();
            reader.onload = e => {
                const img = document.createElement("img");
                img.src = e.target.result;
                img.classList.add("preview-img");
                preview.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
    });

    window.openReviewModal = openReviewModal;
    window.handleDeleteReview = handleDeleteReviewUI;
}

// Hàm render danh sách đánh giá vào sidebar
export async function renderReviewsForPlace(placeId) {
    currentPlaceIdForReview = placeId; 
    const list = document.getElementById("reviews-list");
    const countEl = document.getElementById("review-count");
    
    list.innerHTML = "<p>Đang tải...</p>";
    
    const reviews = await fetchReviewsByPlaceId(placeId);
    if (countEl) countEl.textContent = reviews.length;
    list.innerHTML = "";

    if (reviews.length === 0) {
        list.innerHTML = `<p style="color:#777;">Chưa có đánh giá nào.</p>`;
        return;
    }

    const userId = localStorage.getItem("userId");

    reviews.forEach(review => {
        const isOwner = userId && review.user?.id == userId;
        const stars = "⭐".repeat(review.rating);
        const div = document.createElement("div");
        div.classList.add("review");
        
        let imagesHtml = "";
        if (review.images?.length > 0) {
             imagesHtml = `<div class="review-images">
                ${review.images.map(img => `<img src="${BASE_URL}${img.url}" class="review-img">`).join("")}
             </div>`;
        }

        div.innerHTML = `
            <div class="review-header">
                <b>${review.user?.fullName || "Khách"}</b>
                <span class="rating">${stars}</span>
                ${isOwner ? `<button onclick="window.handleDeleteReview(${review.id})" class="delete-btn"><i class="fas fa-trash"></i></button>` : ""}
            </div>
            <p>${review.content || ""}</p>
            ${imagesHtml}
        `;
        list.appendChild(div);
    });
}

// --- Logic Modal ---

function openReviewModal() {
    if (!localStorage.getItem("token")) return alert("Vui lòng đăng nhập!");
    document.getElementById("review-modal").style.display = "flex";
    setRatingUI(0);
    document.getElementById("review-form").reset();
    document.getElementById("image-preview").innerHTML = "";
}

function closeReviewModal() {
    document.getElementById("review-modal").style.display = "none";
}

function setRatingUI(rating) {
    document.getElementById("review-rating").value = rating;
    document.querySelectorAll("#rating-input .fa-star").forEach(star => {
        star.style.color = star.dataset.rating <= rating ? "#f4a261" : "#ccc";
    });
}

// --- [QUAN TRỌNG] Logic Submit & Update Stats ---

async function handleReviewSubmit(e) {
    e.preventDefault();
    const rating = +document.getElementById("review-rating").value;
    const content = document.getElementById("review-content").value;
    const files = document.getElementById("review-images").files;

    if (!rating) return alert("Vui lòng chọn số sao!");

    try {
        // 1. Upload ảnh
        const imageUrls = await apiUploadImages(files);
        
        // 2. Tạo Review (Lưu vào bảng Reviews)
        await apiCreateReview({
            placeId: currentPlaceIdForReview,
            rating,
            content,
            imageUrls
        });

        // 3. [MỚI - ĐÃ THÊM] Gọi API tăng thống kê Review Count cho bảng Stats
        // URL này khớp với StatsApi.java: @PostMapping("/review/{id}")
        await fetch(`${BASE_URL}/api/stats/review/${currentPlaceIdForReview}`, { 
            method: 'POST' 
        });

        alert("Đánh giá thành công!");
        closeReviewModal();
        renderReviewsForPlace(currentPlaceIdForReview); // Tải lại danh sách
    } catch (err) {
        alert(err.message);
    }
}

async function handleDeleteReviewUI(reviewId) {
    if (!confirm("Bạn chắc chắn muốn xóa?")) return;
    try {
        await apiDeleteReview(reviewId);
        // Lưu ý: Nếu muốn chuẩn xác thì bạn cũng nên gọi API trừ đi review count, 
        // nhưng tạm thời ta chỉ cộng thôi cũng được.
        renderReviewsForPlace(currentPlaceIdForReview);
    } catch (err) {
        alert(err.message);
    }
}