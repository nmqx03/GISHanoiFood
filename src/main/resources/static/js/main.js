import { checkLoginStatus } from './auth.js';
import { initPlacesSystem } from './places.js';
import { initReviewSystem } from './reviews.js';
import { initMediaModal } from './media.js';
import { initGisInputs } from './gis.js';
import { initPostSystem } from './posts.js'; 
import { renderMarkers } from './map.js'; 
import { initChatSystem } from './ai.js'; 
import './profile.js'; 
import { initHotPlacesSystem } from './hotPlaces.js';

// 1. IMPORT Module Đặc sản mới
import { initSpecialtiesSystem } from './specialties.js'; 

// Khởi chạy ứng dụng
document.addEventListener("DOMContentLoaded", async () => {
    console.log("App starting...");

    // 1. Kiểm tra đăng nhập (Auth & Profile UI state)
    checkLoginStatus();

    // 2. Khởi tạo Chatbot
    initChatSystem(); 

    // 3. Khởi tạo Media
    initMediaModal();

    // 4. Khởi tạo Review
    initReviewSystem();
    
    // 5. Khởi tạo Hệ thống Tin tức (Posts)
    initPostSystem(); 
	
    // 6. Khởi tạo Địa điểm Hot
    initHotPlacesSystem(); 

    // 7. KHỞI TẠO Hệ thống Đặc sản & Quà tặng

    initSpecialtiesSystem(); 

    // 8. Khởi tạo Địa điểm & GIS
    const data = await initPlacesSystem();

    if (data && data.places) {
        console.log("Dữ liệu đã tải:", data.places.length, "địa điểm.");

        renderMarkers(data.places); 

        console.log("Initializing GIS with data...");
        initGisInputs(data.places, data.categories);
    } else {
        console.error("Không nhận được dữ liệu từ initPlacesSystem");
    }
});