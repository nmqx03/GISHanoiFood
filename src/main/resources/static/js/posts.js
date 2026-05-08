import { BASE_URL } from './config.js';

let allPostsCache = [];
let quillInstance = null; // Biến lưu trữ bộ soạn thảo Quill

export function initPostSystem() {
    console.log("Initializing Post System (Full Features + Business Logic)...");

    // Sự kiện nút "Tour/Tin tức" ở thanh công cụ
    const tourBtn = document.getElementById('tour-btn');
    if (tourBtn) {
        tourBtn.addEventListener('click', openPostModal);
    }

    // Modal
    const overlay = document.querySelector('.post-modal-overlay');
    const closeBtn = document.querySelector('.post-header .close-btn');
    if (overlay) overlay.addEventListener('click', closePostModal);
    if (closeBtn) closeBtn.addEventListener('click', closePostModal);

    // Tab
    const tabs = document.querySelectorAll('.post-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            // UI Active
            tabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            
            // Tắt chế độ viết bài nếu đang mở
            toggleWriteMode(false);

            // Logic lọc dữ liệu
            const type = e.target.dataset.tab;
            const title = e.target.innerText;
            filterAndRenderPosts(type, title);
        });
    });

    // Nút mở form viết bài
    const btnWrite = document.getElementById('btnOpenWrite');
    if (btnWrite) {
        btnWrite.addEventListener('click', () => {
            const token = localStorage.getItem('token');
            if (!token) {
                alert("Bạn cần đăng nhập để viết bài!");
                return;
            }
   
            toggleWriteMode(true);
            initQuillEditor();
            
            // TÍNH NĂNG NGHIỆP VỤ: Load danh sách địa điểm để gắn thẻ
            loadPlacesForSelect();
        });
    }

    // Sự kiện input file ẩn (Dùng để upload ảnh trong Editor)
    const hiddenEditorInput = document.getElementById('hiddenEditorImageInput');
    if (hiddenEditorInput) {
        hiddenEditorInput.addEventListener('change', uploadImageToEditor);
    }

    // Expose các hàm ra Global để gọi từ HTML (onclick="...")
    window.previewUserImage = previewUserImage;
    window.cancelCreatePost = cancelCreatePost;
    window.submitUserPost = submitUserPost;
    window.viewPostDetail = viewPostDetail;
    window.closePostModal = closePostModal;
}

// ==========================================
// 1. CẤU HÌNH QUILL EDITOR & UPLOAD ẢNH
// ==========================================
function initQuillEditor() {
    if (quillInstance) {
        quillInstance.setContents([]);
        return;
    }

    const toolbarOptions = [
        ['bold', 'italic', 'underline', 'strike'],        
        [{ 'header': 1 }, { 'header': 2 }],               
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],     
        [{ 'align': [] }],                                
        ['link', 'image'],                                
        ['clean']                                         
    ];

    quillInstance = new Quill('#quillEditorContainer', {
        theme: 'snow',
        placeholder: 'Chia sẻ trải nghiệm chi tiết của bạn tại đây...',
        modules: {
            toolbar: {
                container: toolbarOptions,
                handlers: {
                    image: imageHandler
                }
            }
        }
    });
}

function imageHandler() {
    const input = document.getElementById('hiddenEditorImageInput');
    if (input) input.click();
}

async function uploadImageToEditor() {
    const input = document.getElementById('hiddenEditorImageInput');
    const file = input.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${BASE_URL}/api/posts/upload-editor-image`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            let url = data.url;
            if (!url.startsWith('http')) {
                url = `${BASE_URL}/uploads/${url}`;
            }
            const range = quillInstance.getSelection();
            quillInstance.insertEmbed(range.index, 'image', url);
            quillInstance.setSelection(range.index + 1);
        } else {
            alert("Lỗi upload ảnh! Vui lòng thử lại.");
        }
    } catch (error) {
        console.error("Upload error:", error);
        alert("Lỗi kết nối server khi upload ảnh.");
    } finally {
        input.value = ''; 
    }
}

// ==========================================
// 2. NGHIỆP VỤ: GẮN THẺ ĐỊA ĐIỂM (TAGGING)
// ==========================================
// Khai báo biến toàn cục ở đầu file (ngay dưới let quillInstance = null;)
let placesChoicesInstance = null; 

// Thay thế hàm cũ bằng hàm này
async function loadPlacesForSelect() {
    const select = document.getElementById('userPostPlaces');
    if (!select) return;

    try {
        const response = await fetch(`${BASE_URL}/api/places`); 
        if (response.ok) {
            const places = await response.json();
            
            // 1. Nếu đã có thư viện Choices rồi thì dọn dẹp cái cũ đi
            if (placesChoicesInstance) {
                placesChoicesInstance.destroy();
            }

            // 2. Chuyển đổi dữ liệu API thành định dạng của thư viện
            const choicesData = places.map(p => ({
                value: p.id,
                label: p.name
            }));

            // 3. Khởi tạo giao diện siêu xịn
            placesChoicesInstance = new Choices(select, {
                removeItemButton: true, // Hiện dấu X để xóa
                searchPlaceholderValue: 'Gõ để tìm kiếm địa điểm...',
                placeholder: true,
                placeholderValue: 'Chọn địa điểm liên quan',
                noResultsText: 'Không tìm thấy địa điểm nào',
                itemSelectText: 'Nhấn để chọn', // Chữ hiện ra khi hover
            });

            // 4. Đổ dữ liệu vào
            placesChoicesInstance.setChoices(choicesData, 'value', 'label', true);

            // Ẩn cái dòng text hướng dẫn "giữ Ctrl" đi vì giờ không cần nữa
            const helpText = select.parentElement.querySelector('small');
            if (helpText) helpText.style.display = 'none';

        } else {
            console.error('Không có dữ liệu địa điểm');
        }
    } catch (error) {
        console.error("Lỗi tải địa điểm:", error);
    }
}

// ==========================================
// 3. UI/UX & QUẢN LÝ FORM VIẾT BÀI
// ==========================================
function toggleWriteMode(isWriting) {
    const postBody = document.getElementById('postBody');
    const createView = document.getElementById('createPostView');
    const titleHeader = document.getElementById('postTitle');

    if (isWriting) {
        postBody.style.display = 'none';
        createView.style.display = 'block';
        titleHeader.innerText = '✍️ Viết bài mới';
        document.querySelectorAll('.post-tab').forEach(t => t.classList.remove('active'));
    } else {
        postBody.style.display = 'block';
        createView.style.display = 'none';
    }
}

function previewUserImage(input) {
    const preview = document.getElementById('userImgPreview');
    const placeholder = document.querySelector('.upload-placeholder');
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
            placeholder.style.display = 'none';
        }
        reader.readAsDataURL(input.files[0]);
    } else {
        preview.src = "";
        preview.style.display = 'none';
        placeholder.style.display = 'block';
    }
}

function cancelCreatePost() {
    document.getElementById('userPostTitle').value = '';
    document.getElementById('userPostImage').value = '';
    
    // Reset selection địa điểm
    const placeSelect = document.getElementById('userPostPlaces');
    if (placeSelect) placeSelect.selectedIndex = -1; 

    previewUserImage({files: []}); 
    if (quillInstance) quillInstance.setContents([]); 

    const communityTab = document.querySelector('.post-tab[data-tab="community"]');
    if (communityTab) communityTab.click();
}

async function submitUserPost() {
    const title = document.getElementById('userPostTitle').value.trim();
    const content = quillInstance.root.innerHTML;
    const textCheck = quillInstance.getText().trim();
    const imageInput = document.getElementById('userPostImage');

    // Lấy danh sách ID địa điểm đã chọn
    const placeSelect = document.getElementById('userPostPlaces');
    const selectedPlaceIds = Array.from(placeSelect.selectedOptions).map(opt => opt.value);

    if (!title || textCheck.length === 0) {
        alert("Vui lòng nhập tiêu đề và nội dung bài viết!");
        return;
    }

    const btnSubmit = document.querySelector('.btn-submit');
    const originalText = btnSubmit.innerText;
    btnSubmit.innerText = "Đang gửi...";
    btnSubmit.disabled = true;

    try {
        const token = localStorage.getItem('token');
        const formData = new FormData();

        const postPayload = {
            title: title,
            content: content
        };
        formData.append('post', new Blob([JSON.stringify(postPayload)], { type: 'application/json' }));

        if (imageInput.files[0]) {
            formData.append('imageFile', imageInput.files[0]);
        }

        // Gửi placeIds cho Spring Boot
        if (selectedPlaceIds.length > 0) {
            selectedPlaceIds.forEach(id => {
                formData.append('placeIds', id);
            });
        }

        const response = await fetch(`${BASE_URL}/api/posts`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (response.ok) {
            alert("🎉 Đăng bài thành công! Bài viết đang chờ duyệt.");
            cancelCreatePost(); 
            const myPostTab = document.querySelector('.post-tab[data-tab="myposts"]');
            if(myPostTab) {
                setTimeout(() => myPostTab.click(), 500);
            }
        } else {
            const errData = await response.json();
            alert("Lỗi: " + (errData.error || "Không thể đăng bài"));
        }

    } catch (error) {
        console.error("Submit error:", error);
        alert("Lỗi kết nối server!");
    } finally {
        btnSubmit.innerText = originalText;
        btnSubmit.disabled = false;
    }
}

// ==========================================
// 4. HIỂN THỊ DANH SÁCH & LỌC DỮ LIỆU
// ==========================================
export function openPostModal() {
    const modal = document.getElementById('postModal');
    if (modal) {
        modal.classList.add('active');
        fetchAllPostsAndLoad('news', '📰 Tin tức');
        toggleWriteMode(false); 
    }
}

function closePostModal() {
    const modal = document.getElementById('postModal');
    if (modal) modal.classList.remove('active');
}

async function fetchAllPostsAndLoad(defaultTab, defaultTitle) {
    const postBody = document.getElementById('postBody');
    postBody.innerHTML = '<div style="text-align:center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i> Đang tải dữ liệu...</div>';

    try {
        const response = await fetch(`${BASE_URL}/api/posts`);
        if (!response.ok) throw new Error("Không kết nối được server");

        allPostsCache = await response.json();

        document.querySelectorAll('.post-tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`.post-tab[data-tab="${defaultTab}"]`).classList.add('active');

        filterAndRenderPosts(defaultTab, defaultTitle);

    } catch (error) {
        console.error(error);
        postBody.innerHTML = '<div style="text-align:center; color:red; margin-top:20px;">Lỗi tải dữ liệu bài viết.</div>';
    }
}

function filterAndRenderPosts(type, title) {
    document.getElementById('postTitle').innerText = title;
    const postBody = document.getElementById('postBody');
    const currentUserId = getUserIdFromToken();

    let filtered = [];

    switch (type) {
        case 'news':
            filtered = allPostsCache.filter(p => p.official === true && p.status === 'APPROVED');
            renderHtml(filtered, postBody);
            break;
        case 'community':
            filtered = allPostsCache.filter(p => p.official === false && p.status === 'APPROVED');
            renderHtml(filtered, postBody);
            break;
        case 'myposts':
            if (!currentUserId) {
                postBody.innerHTML = `
                    <div style="text-align:center; padding:40px; color:#666;">
                        <i class="fas fa-lock" style="font-size:3rem; margin-bottom:15px;"></i>
                        <p>Vui lòng đăng nhập để xem bài viết của bạn.</p>
                    </div>`;
                return;
            }
            
            // TÍNH NĂNG MỚI: Gọi thẳng API bảo mật để lấy CẢ BÀI CHỜ DUYỆT
            fetchMyPostsAndRender(postBody);
            return; // Dừng luôn hàm ở đây, không gọi renderHtml(filtered) ở dưới nữa
    }
}

function renderHtml(posts, container) {
    if (!posts || posts.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:30px; color:#999;">Chưa có bài viết nào.</div>';
        return;
    }

    let html = '';
    posts.forEach(post => {
        let imgUrl = 'https://via.placeholder.com/300x200?text=No+Image';
        if (post.image_url) {
            imgUrl = post.image_url.startsWith('http') ? post.image_url : `${BASE_URL}/uploads/${post.image_url}`;
        } else if (post.imageUrl) {
            imgUrl = post.imageUrl.startsWith('http') ? post.imageUrl : `${BASE_URL}/uploads/${post.imageUrl}`;
        }

        const plainText = stripHtml(post.content);
        const summary = plainText.length > 120 ? plainText.substring(0, 120) + "..." : plainText;
        
        let badge = '';
        if (post.status === 'PENDING') badge = '<span style="color:#e67e22; border:1px solid #e67e22; font-size:11px; padding:1px 4px; border-radius:4px; margin-left:5px;">Chờ duyệt</span>';
        if (post.status === 'REJECTED') badge = '<span style="color:#e74c3c; border:1px solid #e74c3c; font-size:11px; padding:1px 4px; border-radius:4px; margin-left:5px;">Bị từ chối</span>';

        const author = post.user ? post.user.fullName : 'Admin';
        const date = new Date(post.created_at || post.createdAt).toLocaleDateString('vi-VN');

        html += `
            <div class="post-card" onclick="viewPostDetail(${post.id})">
                <img src="${imgUrl}" loading="lazy" alt="Thumb">
                <div class="post-info">
                    <h4>${post.title} ${badge}</h4>
                    <p>${summary}</p>
                    <div class="post-meta">
                        <span><i class="fas fa-user"></i> ${author}</span>
                        <span style="margin-left:10px;"><i class="fas fa-clock"></i> ${date}</span>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// ==========================================
// 5. NGHIỆP VỤ: XEM CHI TIẾT & TÍNH ĐIỂM VIEW
// ==========================================
function viewPostDetail(id) {
    const post = allPostsCache.find(p => p.id === id);
    if (!post) return;

    const postBody = document.getElementById('postBody');
    const activeTab = document.querySelector('.post-tab.active');
    const tabName = activeTab ? activeTab.innerText : 'Quay lại';

    let bigImg = '';
    const rawImg = post.image_url || post.imageUrl;
    if (rawImg) {
        const url = rawImg.startsWith('http') ? rawImg : `${BASE_URL}/uploads/${rawImg}`;
        bigImg = `<img src="${url}" style="width:100%; border-radius:8px; margin-bottom:20px; max-height:400px; object-fit:cover;">`;
    }

    // Xử lý hiển thị thẻ địa điểm (Nếu backend trả về list places trong post)
    let placesHtml = '';
    if (post.places && post.places.length > 0) {
        placesHtml = `<div style="margin-bottom: 20px;">
            <strong style="color: #264653;">📍 Nhắc đến: </strong> 
            ${post.places.map(p => `<span style="background: #e9ecef; padding: 4px 10px; border-radius: 15px; font-size: 13px; margin-right: 5px; color: #2a9d8f; display: inline-block; margin-bottom: 5px;"><i class="fas fa-map-marker-alt"></i> ${p.name}</span>`).join('')}
        </div>`;
    }

    postBody.innerHTML = `
        <button onclick="document.querySelector('.post-tab.active').click()" style="border:none; background:none; color:#2a9d8f; font-weight:bold; cursor:pointer; margin-bottom:15px; font-size:1rem;">
            <i class="fas fa-arrow-left"></i> ${tabName}
        </button>
        
        <div style="background:white; padding:30px; border-radius:8px;">
            <h1 style="color:#264653; font-size:1.8rem; margin-bottom:10px;">${post.title}</h1>
            
            <div style="color:#666; font-size:0.9rem; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:15px;">
                Đăng bởi <strong>${post.user ? post.user.fullName : 'Admin'}</strong> 
                vào ngày ${new Date(post.created_at || post.createdAt).toLocaleDateString('vi-VN')}
            </div>

            ${placesHtml}
            ${bigImg}

            <div class="post-detail-content" style="line-height:1.8; color:#333; font-size:1rem;">
                ${post.content}
            </div>
        </div>
    `;
    
    postBody.scrollTop = 0;

    // GỌI API NGHIỆP VỤ: Tăng View cho thuật toán "Địa điểm Hot"
    // Gửi ngầm không ảnh hưởng UI
    fetch(`${BASE_URL}/api/stats/post/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }).catch(err => console.warn("Lỗi tracking view:", err));
}


async function fetchMyPostsAndRender(container) {
    container.innerHTML = '<div style="text-align:center; padding: 30px;"><i class="fas fa-spinner fa-spin"></i> Đang tải bài viết của bạn...</div>';
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/api/posts/my`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` } // Phải gửi token đi
        });
        
        if (response.ok) {
            const myPosts = await response.json();
            renderHtml(myPosts, container); // Tái sử dụng hàm renderHtml có sẵn
        } else {
            container.innerHTML = '<p style="text-align:center; color:#e74c3c;">Lỗi tải dữ liệu. Vui lòng thử lại.</p>';
        }
    } catch (error) {
        console.error("Lỗi lấy bài viết cá nhân:", error);
        container.innerHTML = '<p style="text-align:center; color:#e74c3c;">Lỗi kết nối server.</p>';
    }
}
// ==========================================
// 6. CÁC HÀM TIỆN ÍCH (HELPERS)
// ==========================================
function stripHtml(html) {
    if (!html) return "";
    let tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}

function getUserIdFromToken() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const payload = JSON.parse(jsonPayload);
        return payload.userId || payload.sub;
    } catch (e) {
        return null;
    }
}