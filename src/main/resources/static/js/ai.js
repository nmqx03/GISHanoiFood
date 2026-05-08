// js/ai.js
import { BASE_URL } from './config.js';

const API_ENDPOINT = `${BASE_URL}/api`; 
let isChatOpen = false;

export function initChatSystem() {
    console.log("Initializing AI Chat System with History...");


    const sidebar = document.getElementById('chat-sidebar');
    const toggleBtn = document.getElementById('chatbox-toggle');
    const closeBtn = document.getElementById('close-chat-sidebar');
    const sendBtn = document.getElementById('btn-send');
    const inputField = document.getElementById('chat-input');
    const messagesContainer = document.getElementById('messages-container');

    // History Elements
    const btnHistory = document.getElementById('btn-show-history');
    const btnBackChat = document.getElementById('btn-back-chat');
    const panelChat = document.getElementById('panel-chat');
    const panelHistory = document.getElementById('panel-history');
    // Tìm hoặc tạo container chứa list history (nếu trong HTML chưa có thì dùng class .history-list)
    const historyListContainer = panelHistory.querySelector('.history-list') || createHistoryContainer(panelHistory);


    if(btnHistory) {
        btnHistory.addEventListener('click', () => {
            panelChat.style.display = 'none';
            panelHistory.style.display = 'flex';
            loadChatHistory(); 
        });
    }

    if(btnBackChat) {
        btnBackChat.addEventListener('click', () => {
            panelHistory.style.display = 'none';
            panelChat.style.display = 'flex';
        });
    }

    // Toggle Sidebar
    toggleBtn.addEventListener('click', () => {
        isChatOpen = !isChatOpen;
        if (isChatOpen) {
            sidebar.classList.add('active');
            inputField.focus();
        } else {
            sidebar.classList.remove('active');
        }
    });

    closeBtn.addEventListener('click', () => {
        isChatOpen = false;
        sidebar.classList.remove('active');
    });

    // Chat Logic
    const handleSend = () => {
        const text = inputField.value.trim();
        if (!text) return;
        addMessageToUI(text, 'user');
        inputField.value = '';
        sendToAI(text);
    };

    sendBtn.addEventListener('click', handleSend);
    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });

  // history

    async function loadChatHistory() {
        const user = getCurrentUser();
        if (!user) {
            historyListContainer.innerHTML = `<p style="text-align:center; margin-top:20px; color:#666">Vui lòng <a href="#" onclick="document.getElementById('login-modal').style.display='flex'">đăng nhập</a> để xem lịch sử.</p>`;
            return;
        }

        historyListContainer.innerHTML = `<p style="text-align:center; margin-top:20px;"><i class="fas fa-spinner fa-spin"></i> Đang tải...</p>`;

        try {
            const response = await fetch(`${API_ENDPOINT}/chat/history/${user.id}`);
            if (!response.ok) throw new Error("Lỗi tải lịch sử");
            
            const historyData = await response.json();
            renderHistoryList(historyData);

        } catch (e) {
            console.error(e);
            historyListContainer.innerHTML = `<p style="text-align:center; color:red">Không thể tải lịch sử.</p>`;
        }
    }

    function renderHistoryList(data) {
        if (!data || data.length === 0) {
            historyListContainer.innerHTML = `<p style="text-align:center; color:#999; margin-top:20px">Chưa có cuộc trò chuyện nào.</p>`;
            return;
        }

        historyListContainer.innerHTML = ''; // Clear cũ

        data.forEach(item => {
            // Format thời gian
            const date = new Date(item.createdAt);
            const timeStr = date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'});
            
            // Check xem có phải lịch trình không để hiện nhãn
            const isItinerary = item.messageType === 'ITINERARY';
            const tagHtml = isItinerary ? `<span class="tag-itinerary"><i class="fas fa-map-signs"></i> Lịch trình</span>` : '';

            const el = document.createElement('div');
            el.className = 'history-item';
            el.innerHTML = `
                <div class="history-time">
                    <i class="far fa-clock"></i> ${timeStr}
                    ${tagHtml}
                </div>
                <div class="history-question">${item.question}</div>
                <div class="history-preview">${isItinerary ? 'Xem chi tiết lịch trình...' : item.answer}</div>
            `;

            // Sự kiện click vào item -> Xem lại nội dung
            el.addEventListener('click', () => {
                viewHistoryItem(item);
            });

            historyListContainer.appendChild(el);
        });
    }

    function viewHistoryItem(item) {
        // 1. Chuyển về tab chat
        panelHistory.style.display = 'none';
        panelChat.style.display = 'flex';

        // 2. Xóa trắng chat cũ (hoặc giữ lại tùy bạn, ở đây tôi xóa cho sạch để hiển thị cái vừa chọn)
        messagesContainer.innerHTML = ''; 
        
        // 3. Render lại cặp câu hỏi - trả lời cũ
        addMessageToUI(item.question, 'user');
        
        // Render câu trả lời của AI
        // Lưu ý: Nếu là lịch trình, ta lấy structuredData để render thẻ đẹp
        addMessageToUI(item.answer, 'ai', item.messageType === 'ITINERARY' ? item.structuredData : null);
    }

    function createHistoryContainer(parent) {
        // Helper tạo div nếu HTML lỡ quên
        const div = document.createElement('div');
        div.className = 'history-list';
        parent.appendChild(div);
        // Xóa nút back cũ nếu nó nằm sai chỗ, chỉ giữ lại list
        const existingList = parent.querySelector('.history-list');
        return existingList || div;
    }


    

    function getCurrentUser() {
        const userStr = localStorage.getItem('currentUser');
        return userStr ? JSON.parse(userStr) : null;
    }

	function addMessageToUI(content, sender, structuredData = null) {
	    const msgDiv = document.createElement('div');
	    msgDiv.classList.add('message', sender);

	    let innerHTML = '';

	    if (sender === 'ai' && content === '...loading...') {
	        innerHTML = `<div class="msg-bubble"><i class="fas fa-circle-notch fa-spin"></i> Đang suy nghĩ...</div>`;
	        msgDiv.id = 'ai-loading';
	    } else {

	        
	        let bubbleContent = '';

	        if (sender === 'ai') {
	            // Nếu là AI: Dùng marked để chuyển Markdown -> HTML

	            bubbleContent = marked.parse(content);
	        } else {
	            // Nếu là User: Giữ nguyên text để tránh lỗi hiển thị HTML lạ
	            bubbleContent = content;
	        }
	        
	       

	        let cardHTML = '';
	        if (structuredData) {
	            cardHTML = renderItineraryCard(structuredData);
	        }

	        innerHTML = `
	            <div class="msg-bubble">
	                <div class="markdown-content">${bubbleContent}</div> ${cardHTML} 
	            </div>`;
	    }

	    msgDiv.innerHTML = innerHTML;
	    messagesContainer.appendChild(msgDiv);
	    
	    // Scroll xuống cuối
	    messagesContainer.scrollTop = messagesContainer.scrollHeight;

	    // Gắn sự kiện nút Lưu (như cũ)
	    if (structuredData) {
	        const saveBtn = msgDiv.querySelector('.btn-save-itinerary');
	        if (saveBtn) {
	            saveBtn.addEventListener('click', () => handleSaveItinerary(structuredData));
	        }
	    }
	}

    function renderItineraryCard(dataString) {
        try {
            const data = (typeof dataString === 'string') ? JSON.parse(dataString) : dataString;
            if (!data || !data.title) return '';
            
            let daysHtml = '';
            if (data.days && Array.isArray(data.days)) {
                data.days.forEach(d => {
                    const acts = d.activities.join('<br>• ');
                    daysHtml += `<div class="timeline-item"><span class="day-title">${d.day}</span><div class="act-list">• ${acts}</div></div>`;
                });
            }
            return `<div class="itinerary-card"><div class="it-header"><i class="fas fa-map-marked-alt"></i> ${data.title}</div><div class="it-content">${daysHtml}</div><button class="btn-save-itinerary"><i class="fas fa-save"></i> Lưu lịch trình</button></div>`;
        } catch (e) { return ''; }
    }

    async function sendToAI(question) {
        addMessageToUI('...loading...', 'ai');
        const user = getCurrentUser();
        
        try {
            const response = await fetch(`${API_ENDPOINT}/chat/send`, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user ? user.id : null, question: question })
            });
            const data = await response.json();
            const loadingDiv = document.getElementById('ai-loading');
            if (loadingDiv) loadingDiv.remove();

            if (data.answer) {
                const isItinerary = data.messageType === 'ITINERARY';
                addMessageToUI(data.answer, 'ai', isItinerary ? data.structuredData : null);
            }
        } catch (error) {
            const loadingDiv = document.getElementById('ai-loading');
            if (loadingDiv) loadingDiv.remove();
            addMessageToUI("Lỗi kết nối.", 'ai');
        }
    }

	async function handleSaveItinerary(structuredData) {
	        const user = getCurrentUser();
	        if (!user) { alert("Vui lòng đăng nhập!"); return; }
	        
	 
	        const token = localStorage.getItem('token'); 

	        if (!token) {
	            alert("Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại!");
	            return;
	        }

	        try {
	            const dataJson = (typeof structuredData === 'string') ? JSON.parse(structuredData) : structuredData;
	            const response = await fetch(`${API_ENDPOINT}/itineraries/save`, {
	                method: 'POST',
	                headers: { 
	                    'Content-Type': 'application/json',
	                    'Authorization': `Bearer ${token}` 
	                },
	           
	                body: JSON.stringify({ 
	                    itinerary_name: dataJson.title, 
	                    content: (typeof structuredData === 'string') ? structuredData : JSON.stringify(structuredData) 
	                })
	            });

	            if (response.ok) {
	                alert("Đã lưu thành công!");
	            } else if (response.status === 401) {
	                alert("Lỗi xác thực: Yêu cầu đăng nhập để lưu lịch trình.");
	            } else {
	                alert("Lỗi lưu lịch trình.");
	            }
	        } catch(e) { 
	            console.error("Lỗi khi gọi API save:", e);
	            alert("Lỗi kết nối."); 
	        }
	    }
}