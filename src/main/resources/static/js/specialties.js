// Xử lý đặc sản Hà Nội
async function loadSpecialties() {
    try {
        const res  = await fetch(`${API_BASE}/specialties`);
        const data = await res.json();
        renderSpecialties(data);
    } catch (err) {
        console.error('Lỗi load specialties:', err);
    }
}

function renderSpecialties(specialties) {
    const container = document.getElementById('specialtyList');
    if (!container) return;
    container.innerHTML = specialties.map(s => `
        <div class="col-md-3 mb-3">
            <div class="card place-card text-center p-3">
                ${s.imageUrl ? `<img src="${s.imageUrl}" class="card-img-top mb-2" style="height:100px;object-fit:cover;border-radius:8px">` : ''}
                <h6 class="card-title mb-1">${s.name}</h6>
                <p class="card-text small text-muted">${s.description || ''}</p>
            </div>
        </div>`).join('');
}

document.addEventListener('DOMContentLoaded', loadSpecialties);
