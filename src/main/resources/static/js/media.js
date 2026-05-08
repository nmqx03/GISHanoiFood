// js/media.js
export function initMediaModal() {
    // Setup sự kiện đóng modal
    const modal = document.getElementById("media-modal");
    document.getElementById("close-media").onclick = hideMediaModal;
    modal.onclick = (e) => { if (e.target === modal) hideMediaModal(); };

    // Expose ra window để HTML gọi được
    window.playVideo = playVideo;
    window.playAudio = playAudio;
}

function showMediaModal() {
    const modal = document.getElementById("media-modal");
    modal.style.display = "flex";
    setTimeout(() => { modal.style.opacity = "1"; }, 10);
}

function hideMediaModal() {
    const modal = document.getElementById("media-modal");
    modal.style.opacity = "0";
    setTimeout(() => {
        modal.style.display = "none";
        document.getElementById("media-container").innerHTML = ""; // Xóa nội dung để dừng phát
    }, 300);
}

function playVideo(url) {
    if (!url) return alert("Không có video.");
    document.getElementById("media-container").innerHTML = `<iframe src="${url}" allowfullscreen style="width:100%; height:300px; border:none;"></iframe>`;
    showMediaModal();
}

function playAudio(url) {
    if (!url) return alert("Không có audio.");
    document.getElementById("media-container").innerHTML = `<audio controls autoplay src="${url}" style="width:100%"></audio>`;
    showMediaModal();
}