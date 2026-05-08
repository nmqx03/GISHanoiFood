// Xử lý chatbot AI Gemini
let chatHistory = [];

// Gửi tin nhắn
async function sendChat() {
    const input   = document.getElementById('chatInput');
    const message = input ? input.value.trim() : '';
    if (!message) return;

    if (!isLoggedIn()) {
        appendChatMessage('ai', 'Vui lòng đăng nhập để sử dụng tư vấn AI!');
        return;
    }

    appendChatMessage('user', message);
    input.value = '';

    // Hiện loading
    const loadingId = 'loading-' + Date.now();
    appendChatMessage('ai', '<i class="fas fa-spinner fa-spin"></i> Đang trả lời...', loadingId);

    try {
        const res = await fetch(`${API_BASE}/chat`, {
            method: 'POST',
            headers: jsonAuthHeader(),
            body: JSON.stringify({ message })
        });
        const data = await res.json();

        // Xóa loading và hiện kết quả
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.remove();
        appendChatMessage('ai', data.reply);
    } catch (err) {
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.remove();
        appendChatMessage('ai', 'Lỗi kết nối AI. Vui lòng thử lại!');
    }
}

// Thêm tin nhắn vào khung chat
function appendChatMessage(role, text, id = null) {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    const div = document.createElement('div');
    div.className = role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai';
    if (id) div.id = id;
    div.innerHTML = `<span>${text}</span>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

// Load lịch sử chat
async function loadChatHistory() {
    if (!isLoggedIn()) return;
    try {
        const res  = await fetch(`${API_BASE}/chat/history`, { headers: authHeader() });
        const data = await res.json();
        const container = document.getElementById('chatMessages');
        if (container && data.length > 0) {
            container.innerHTML = '';
            data.slice(-20).forEach(chat => appendChatMessage(chat.role, chat.message));
        }
    } catch (err) {
        console.error('Lỗi load chat history:', err);
    }
}

// Xóa lịch sử chat
async function clearChatHistory() {
    if (!isLoggedIn()) return;
    try {
        await fetch(`${API_BASE}/chat/history`, { method: 'DELETE', headers: authHeader() });
        const container = document.getElementById('chatMessages');
        if (container) {
            container.innerHTML = `<div class="text-muted text-center" style="font-size:13px">
                Hỏi tôi về ẩm thực Hà Nội!
            </div>`;
        }
        showToast('Đã xóa lịch sử chat', 'success');
    } catch (err) {
        console.error('Lỗi xóa lịch sử:', err);
    }
}

// Gợi ý câu hỏi nhanh
function quickChat(message) {
    const input = document.getElementById('chatInput');
    if (input) {
        input.value = message;
        sendChat();
    }
}

// Enter để gửi
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('chatInput');
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendChat();
        });
    }
    loadChatHistory();
});
