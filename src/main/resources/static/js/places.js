import { BASE_URL , OPENWEATHER_API_KEY } from './config.js';
import { renderMarkers } from './map.js';
import { renderReviewsForPlace } from './reviews.js';
import { getCurrentUser } from './auth.js';
import { initFavoriteSystem, getFavoriteStatus } from './tym.js';

let allPlaces = [];
let allCategories = [];

async function fetchCategories() {
    try {
        const res = await fetch(`${BASE_URL}/api/categories`);
        return await res.json();
    } catch (e) { return []; }
}

async function fetchPlaces() {
    try {
        const res = await fetch(`${BASE_URL}/api/places`);
        return await res.json();
    } catch (e) { return []; }
}

async function fetchEventsByPlace(placeId) {
    try {
        const res = await fetch(`${BASE_URL}/api/events/place/${placeId}`);
        if (!res.ok) return [];
        return await res.json();
    } catch (e) { return []; }
}

// API lấy dữ liệu Hot 
export async function fetchHotStats() {
    try {
        const res = await fetch(`${BASE_URL}/api/stats/hot`);
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        console.warn("Lỗi tải dữ liệu Hot:", e);
        return [];
    }
}

// API tăng view 
export async function incrementViewCount(placeId) {
    try {
        await fetch(`${BASE_URL}/api/stats/view/${placeId}`, { method: 'POST' });
        console.log(`View +1 cho ID: ${placeId}`);
    } catch (e) { console.error(e); }
}


async function getWeather(lat, lon) {
    if (!OPENWEATHER_API_KEY || OPENWEATHER_API_KEY.includes('DÁN_KEY')) {
        console.warn("Chưa có API Key thời tiết");
        return null;
    }

    try {
      
		const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=vi`;
        
        const res = await fetch(url);
        if (!res.ok) throw new Error('Lỗi API Thời tiết');
        return await res.json();
    } catch (e) {
        console.error("Không lấy được thời tiết:", e);
        return null; 
    }
}

//khởi tạo
export async function initPlacesSystem() {
    // Chỉ tải Places và Categories (Không cần preload Hot Stats cho Map nữa)
    [allCategories, allPlaces] = await Promise.all([fetchCategories(), fetchPlaces()]);

    // Render Map bình thường
    renderMarkers(allPlaces);

    renderCategoryDropdown();
    setupSearch();
	initFavoriteSystem(allPlaces);
	
    const toggleBtn = document.getElementById('toggle-sidebar');
    const closeBtn = document.getElementById('close-sidebar');
    if(toggleBtn) toggleBtn.onclick = () => document.getElementById('sidebar').classList.toggle('open');
    if(closeBtn) closeBtn.onclick = () => document.getElementById('sidebar').classList.remove('open');

    window.showLocationDetails = showLocationDetails;

    return { places: allPlaces, categories: allCategories };
}


async function showLocationDetails(placeId) {
    const place = allPlaces.find(p => p.id === placeId);
    if (!place) return;

    incrementViewCount(placeId);

    const details = document.getElementById("location-details");
    document.getElementById("routing-details").style.display = "none";
    details.style.display = "block";
   
    // Gọi hàm Check từ file tym.js
	const isFav = await getFavoriteStatus(placeId);
	const heartClass = isFav ? 'fas' : 'far'; 
	const heartColor = isFav ? '#e63946' : '#555'; 
	
    details.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
            <h2 style="margin: 0; padding-right: 10px; font-size: 1.5rem; color: #2c3e50; line-height: 1.2;">
                ${place.name}
            </h2>
            
            <button onclick="window.handleToggleFavorite(${place.id}, this)" 
                    title="${isFav ? 'Bỏ thích' : 'Yêu thích'}"
                    style="background: none; border: none; cursor: pointer; padding: 5px; transition: transform 0.2s;">
                <i class="${heartClass} fa-heart" style="font-size: 24px; color: ${heartColor};"></i>
            </button>
        </div>
        
        <img src="${BASE_URL}/${place.imageUrl}" style="width:100%; height: 200px; object-fit:cover; border-radius:8px;" onerror="this.src='./img/placeholder.jpg'"/>
		
        <div id="weather-widget-${placeId}">Loading weather...</div>
        <p style="margin-top: 10px;">${place.description || "Chưa có mô tả."}</p>
		<p style="
		  margin-top: 10px;
		  font-size: 14px;
		  color: #555;
		  font-weight: 500;
		  display: flex;
		  align-items: center;
		  gap: 6px;
		">
		   ${place.location || "Hà Nội"}
		</p>

        
        <div class="events-section" style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px;">
            <h3>Sự kiện sắp tới</h3>
            <div id="events-list">Đang tải sự kiện...</div>
        </div>

        <div class="action-buttons">
            <button onclick="window.playVideo('${place.videoUrl || ""}')"><i class="fas fa-play-circle"></i> Video</button>
            <button onclick="window.playAudio('${place.audioUrl || ""}')"><i class="fas fa-volume-up"></i> Audio</button>
            <button onclick="window.showRouteTo(${place.latitude}, ${place.longitude})"><i class="fas fa-road"></i> Chỉ đường</button>
        </div>

        <div class="reviews" style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px;">
            <h3>Đánh giá</h3>
            <button onclick="window.openReviewModal()" class="review-button" style="margin-top:5px; padding:6px 12px; background:#2a9d8f; color:#fff; border:none; border-radius:6px;">
                <i class="fas fa-edit"></i> Viết đánh giá
            </button>
            <div id="reviews-list" style="margin-top:15px;"></div>
        </div>
    `;

    document.getElementById("sidebar").classList.add("open");

    renderReviewsForPlace(placeId);
    loadPlaceEvents(placeId);
    renderWeatherForPlace(place.latitude, place.longitude, placeId);
}

async function loadPlaceEvents(placeId) {
    const container = document.getElementById('events-list');
    const events = await fetchEventsByPlace(placeId);
    if (!events || events.length === 0) {
        container.innerHTML = `<p style="color: #666; font-size: 0.9em;">Hiện chưa có sự kiện nào tại địa điểm này.</p>`;
        return;
    }
    let html = '';
    events.forEach(event => {
        const startDate = new Date(event.startDate).toLocaleDateString('vi-VN');
        const endDate = new Date(event.endDate).toLocaleDateString('vi-VN');
        html += `
            <div class="event-card">
                <div class="event-date">
                    <span class="day">${new Date(event.startDate).getDate()}</span>
                    <span class="month">Th${new Date(event.startDate).getMonth() + 1}</span>
                </div>
                <div class="event-info">
                    <h4>${event.eventName}</h4>
                    <p class="event-time"><i class="far fa-clock"></i> ${startDate} - ${endDate}</p>
                    <p class="event-desc">${event.description || ''}</p>
                </div>
            </div>`;
    });
    container.innerHTML = html;
}

async function renderWeatherForPlace(lat, lon, placeId) {
    const container = document.getElementById(`weather-widget-${placeId}`);
    if (!container) return;

    const data = await getWeather(lat, lon);

    if (!document.getElementById(`weather-widget-${placeId}`)) return;
    
    if (!data) {
        container.innerHTML = `<span style="color:#666; font-size:0.9em;">Không cập nhật được thời tiết.</span>`;
        return;
    }

    const temp = Math.round(data.main.temp); 
    const desc = data.weather[0].description; 
    const descCapitalized = desc.charAt(0).toUpperCase() + desc.slice(1);
    const iconCode = data.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;  
    const humidity = data.main.humidity; 
    const windSpeed = data.wind.speed; 

    container.innerHTML = `
        <div style="
            background: #E0F7FA; 
            padding: 15px; 
            border-radius: 12px; 
            box-shadow: 0 4px 10px rgba(0,0,0,0.08); 
            border: 1px solid #b2ebf2;
            display: flex; 
            align-items: center; 
            justify-content: space-between;
            transition: transform 0.2s;
        ">
            <div style="display: flex; align-items: center;">
                <img src="${iconUrl}" alt="Icon" style="width: 60px; height: 60px; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.1));">
                <div style="margin-left: 5px;">
                    <div style="font-size: 2.2em; font-weight: 800; color: #006064; line-height: 1;">${temp}°</div>
                    <div style="font-size: 0.85em; color: #00838f; margin-top: 3px; font-weight: 500;">${descCapitalized}</div>
                </div>
            </div>

            <div style="
                text-align: right; 
                font-size: 0.85em; 
                color: #555; 
                border-left: 1px solid #ddd; 
                padding-left: 15px;
                min-width: 90px;
            ">
                <div style="margin-bottom: 5px;">
                    <i class="fas fa-tint" style="color: #0288d1;"></i> Ẩm: <b>${humidity}%</b>
                </div>
                <div>
                    <i class="fas fa-wind" style="color: #78909c;"></i> Gió: <b>${windSpeed}m/s</b>
                </div>
            </div>
        </div>
    `;
}

function renderCategoryDropdown() {
    const dropdown = document.getElementById("categoryDropdown");
    if (!dropdown) return;
    dropdown.innerHTML = `<option value="">Tất cả loại hình</option>`;
    
    allCategories.forEach(cat => {
        const opt = document.createElement("option");
        opt.value = cat.id;
        opt.textContent = cat.name;
        dropdown.appendChild(opt);
    });

    dropdown.onchange = () => {
        const catId = dropdown.value;
        const filtered = catId ? allPlaces.filter(p => p.category?.id == catId) : allPlaces;
        
        renderMarkers(filtered);
    };
}


function setupSearch() {
    const btn = document.querySelector(".search-bar button");
    const input = document.querySelector(".search-bar input");
    if (!btn || !input) return;

    const handleSearch = () => {
        const keyword = input.value.trim().toLowerCase(); 
        const filtered = allPlaces.filter(p => p.name.toLowerCase().includes(keyword));
        if (filtered.length === 0) alert(`Không tìm thấy: "${input.value}"`);
        
        // Chỉ truyền filtered
        renderMarkers(filtered);
    };

    btn.onclick = handleSearch;
    input.onkeydown = (e) => { if(e.key === "Enter") handleSearch(); };
}

