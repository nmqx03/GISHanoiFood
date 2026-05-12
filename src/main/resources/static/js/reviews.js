import { BASE_URL, getImageUrl, PLACEHOLDER_IMG } from './config.js';
window.__ph = PLACEHOLDER_IMG;

let currentPlaceIdForReview = null;

// API helpers
async function apiCreateReview(reviewData) {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Vui lòng đăng nhập.');
  const res = await fetch(`${BASE_URL}/api/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(reviewData)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Gửi đánh giá thất bại!');
  }
  return await res.json();
}

async function apiUploadImages(files) {
  const imageUrls = [];
  for (const file of Array.from(files).slice(0, 3)) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE_URL}/api/reviews/upload-image`, {
      method: 'POST', body: formData
    });
    const data = await res.json();
    if (res.ok && data.url) imageUrls.push(data.url);
  }
  return imageUrls;
}

export function initReviewSystem() {
  // Star rating input
  const starContainer = document.getElementById('rating-input');
  if (starContainer) {
    starContainer.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
      const star = document.createElement('i');
      star.className = 'fas fa-star';
      star.dataset.rating = i;
      star.onclick = () => setRatingUI(i);
      starContainer.appendChild(star);
    }
  }

  // Image preview
  const imageInput = document.getElementById('review-images');
  if (imageInput) {
    imageInput.addEventListener('change', function() {
      const preview = document.getElementById('image-preview');
      if (!preview) return;
      preview.innerHTML = '';
      Array.from(this.files).slice(0, 3).forEach(file => {
        const reader = new FileReader();
        reader.onload = e => {
          const img = document.createElement('img');
          img.src = e.target.result;
          preview.appendChild(img);
        };
        reader.readAsDataURL(file);
      });
    });
  }

  // Form submit
  const form = document.getElementById('review-form');
  if (form) form.onsubmit = handleReviewSubmit;

  // Set current place ID hook for places.js
  window.__setCurrentPlaceId = (id) => { currentPlaceIdForReview = id; };
}

function setRatingUI(rating) {
  const ratingInput = document.getElementById('review-rating');
  if (ratingInput) ratingInput.value = rating;
  document.querySelectorAll('#rating-input .fa-star').forEach(star => {
    if (+star.dataset.rating <= rating) star.classList.add('active');
    else star.classList.remove('active');
  });
}

async function handleReviewSubmit(e) {
  e.preventDefault();

  // Lấy placeId từ d-name (đang hiện trên detail)
  if (!currentPlaceIdForReview) {
    // fallback: tìm từ window
    const detailEl = document.getElementById('detail');
    if (detailEl && detailEl.style.display !== 'none' && window.__currentPlaceId) {
      currentPlaceIdForReview = window.__currentPlaceId;
    }
  }

  const rating  = +document.getElementById('review-rating').value;
  const content = document.getElementById('review-content').value;
  const files   = document.getElementById('review-images').files;

  if (!rating) return alert('Vui lòng chọn số sao!');
  if (!currentPlaceIdForReview) return alert('Vui lòng chọn địa điểm trước!');

  try {
    const imageUrls = await apiUploadImages(files);
    await apiCreateReview({
      placeId: currentPlaceIdForReview,
      rating, content, imageUrls
    });

    // Tăng review count
    await fetch(`${BASE_URL}/api/stats/review/${currentPlaceIdForReview}`, { method: 'POST' });

    alert('Đánh giá thành công!');
    document.getElementById('review-modal')?.classList.remove('open');
    document.getElementById('review-form')?.reset();
    document.getElementById('image-preview').innerHTML = '';
    setRatingUI(0);

    // Reload reviews trong detail nếu đang mở
    if (window.showLocationDetails) window.showLocationDetails(currentPlaceIdForReview);
  } catch (err) {
    alert(err.message);
  }
}

// Để places.js gọi (tương thích với code cũ)
export async function renderReviewsForPlace(placeId) {
  currentPlaceIdForReview = placeId;
  window.__currentPlaceId = placeId;
}