import { BASE_URL, getImageUrl, PLACEHOLDER_IMG } from './config.js';
window.__ph = PLACEHOLDER_IMG;

export function initPostSystem() {
  loadPosts();
}

async function loadPosts() {
  const container = document.getElementById('posts-list');
  if (!container) return;

  container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--muted)"><i class="fas fa-spinner fa-spin"></i> Đang tải...</div>';

  try {
    const res = await fetch(`${BASE_URL}/api/posts`);
    if (!res.ok) throw new Error();
    const posts = (await res.json()).filter(p => p.status === 'APPROVED');

    if (!posts.length) {
      container.innerHTML = '<p style="text-align:center;color:var(--muted);padding:30px">Chưa có bài viết nào.</p>';
      return;
    }

    container.innerHTML = posts.map(p => `
      <div style="background:#fff;border:1px solid var(--line);border-radius:12px;margin-bottom:12px;overflow:hidden">
        ${p.imageUrl ? `<img src="${getImageUrl(p.imageUrl)}" onerror="this.src=window.__ph" style="width:100%;height:200px;object-fit:cover"/>` : ''}
        <div style="padding:14px">
          <h4 style="font-family:'Instrument Serif',serif;font-size:20px;color:var(--ink);margin-bottom:6px">${p.title}</h4>
          <div style="font-size:11.5px;color:var(--muted);margin-bottom:10px">
            <i class="fas fa-user"></i> ${p.user?.fullName || 'Ẩn danh'} ·
            <i class="far fa-clock"></i> ${new Date(p.createdAt).toLocaleDateString('vi-VN')}
            ${p.official ? '<span style="margin-left:8px;background:var(--accent-soft);color:var(--accent-ink);padding:2px 8px;border-radius:20px;font-weight:600">CHÍNH THỨC</span>' : ''}
          </div>
          <div style="font-size:13.5px;color:var(--ink-2);line-height:1.6">${(p.content || '').substring(0, 300)}${p.content?.length > 300 ? '...' : ''}</div>
        </div>
      </div>
    `).join('');
  } catch {
    container.innerHTML = '<p style="text-align:center;color:#e63946;padding:30px">Không tải được bài viết.</p>';
  }
}