import { BASE_URL } from './config.js';
import { getCurrentUser } from './auth.js';

const API = `${BASE_URL}/api`;

export function initChatSystem() {
  console.log('Initializing AI Chat System...');

  const sendBtn  = document.getElementById('btn-send');
  const input    = document.getElementById('chat-input');
  const messages = document.getElementById('panel-chat');

  // Guard: nếu không có các element thì bỏ qua
  if (!sendBtn || !input || !messages) {
    console.warn('Chat elements not found, skip init');
    return;
  }

  const handleSend = () => {
    const text = input.value.trim();
    if (!text) return;
    addMessage(text, 'user');
    input.value = '';
    sendToAI(text);
  };

  sendBtn.addEventListener('click', handleSend);
  input.addEventListener('keypress', e => {
    if (e.key === 'Enter') handleSend();
  });
}

function getMessagesContainer() {
  return document.getElementById('panel-chat');
}

function addMessage(content, sender, structuredData = null) {
  const container = getMessagesContainer();
  if (!container) return;

  const msgDiv = document.createElement('div');
  msgDiv.classList.add('message', sender);

  if (sender === 'ai' && content === '...loading...') {
    msgDiv.id = 'ai-loading';
    msgDiv.innerHTML = `<div class="msg-bubble"><i class="fas fa-circle-notch fa-spin"></i> Đang suy nghĩ...</div>`;
  } else {
    let bubbleContent = content;
    if (sender === 'ai' && typeof marked !== 'undefined') {
      try { bubbleContent = marked.parse(content); } catch {}
    }

    let cardHTML = '';
    if (structuredData) cardHTML = renderItineraryCard(structuredData);

    msgDiv.innerHTML = `
      <div class="msg-bubble">
        <div class="markdown-content">${bubbleContent}</div>
        ${cardHTML}
      </div>`;
  }

  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;

  // Gắn sự kiện cho nút lưu lịch trình
  if (structuredData) {
    const saveBtn = msgDiv.querySelector('.btn-save-itinerary');
    if (saveBtn) saveBtn.addEventListener('click', () => handleSaveItinerary(structuredData));
  }
}

function renderItineraryCard(dataString) {
  try {
    const data = (typeof dataString === 'string') ? JSON.parse(dataString) : dataString;
    if (!data || !data.title) return '';

    let daysHtml = '';
    if (data.days && Array.isArray(data.days)) {
      data.days.forEach(d => {
        const acts = (d.activities || []).join('<br>• ');
        daysHtml += `
          <div class="timeline-item" style="margin-bottom:10px">
            <span class="day-title" style="font-weight:600;color:var(--accent)">${d.day}</span>
            <div class="act-list" style="font-size:12.5px;color:var(--ink-2);margin-top:4px">• ${acts}</div>
          </div>`;
      });
    }

    return `
      <div class="itinerary-card" style="margin-top:10px;padding:12px;background:var(--accent-soft);border-radius:10px;border:1px solid rgba(220,100,60,.15)">
        <div class="it-header" style="font-weight:600;color:var(--accent-ink);margin-bottom:8px">
          <i class="fas fa-map-marked-alt"></i> ${data.title}
        </div>
        <div class="it-content">${daysHtml}</div>
        <button class="btn-save-itinerary" style="margin-top:8px;padding:6px 12px;background:var(--ink);color:#fff;border-radius:6px;font-size:12px;width:100%">
          <i class="fas fa-save"></i> Lưu lịch trình
        </button>
      </div>`;
  } catch { return ''; }
}

async function sendToAI(question) {
  addMessage('...loading...', 'ai');
  const user = getCurrentUser();

  try {
    const response = await fetch(`${API}/chat/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user ? user.id : null, question })
    });
    const data = await response.json();

    document.getElementById('ai-loading')?.remove();

    if (data.answer) {
      const isItinerary = data.messageType === 'ITINERARY';
      addMessage(data.answer, 'ai', isItinerary ? data.structuredData : null);
    }
  } catch (e) {
    document.getElementById('ai-loading')?.remove();
    addMessage('Lỗi kết nối server.', 'ai');
  }
}

async function handleSaveItinerary(structuredData) {
  const user = getCurrentUser();
  if (!user) { alert('Vui lòng đăng nhập!'); return; }

  const token = localStorage.getItem('token');
  if (!token) { alert('Phiên đăng nhập không hợp lệ!'); return; }

  try {
    const dataJson = (typeof structuredData === 'string') ? JSON.parse(structuredData) : structuredData;
    const response = await fetch(`${API}/itineraries/save`, {
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

    if (response.ok) alert('Đã lưu lịch trình thành công!');
    else if (response.status === 401) alert('Yêu cầu đăng nhập để lưu lịch trình.');
    else alert('Lỗi khi lưu lịch trình.');
  } catch (e) {
    alert('Lỗi kết nối.');
  }
}