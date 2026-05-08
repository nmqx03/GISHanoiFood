package com.webgis.hanoifood.api;

import com.webgis.hanoifood.entity.SavedItinerary;
import com.webgis.hanoifood.repository.SavedItineraryRepository;
import com.webgis.hanoifood.security.JwtUtil;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/itineraries")

public class SavedItineraryApi {

    @Autowired
    private SavedItineraryRepository itineraryRepository;
    
    
    @Autowired
    private JwtUtil jwtUtil;
    
	@PostMapping("/save")
	public ResponseEntity<?> saveItinerary(@RequestBody Map<String, Object> payload,
			@RequestHeader(value = "Authorization", required = false) String authHeader) {
		try {

			if (authHeader == null) {
				 return ResponseEntity.status(401).body(Map.of("error", "Vui lòng đăng nhập để lưu lịch trình"));
			}

			String token = authHeader.substring(7);
			Long userId = jwtUtil.getUserId(token);

			String name = (String) payload.get("itinerary_name");
			Object contentObj = payload.get("content");
			String content = contentObj != null ? contentObj.toString() : "";

			if (content.isEmpty()) {
				return ResponseEntity.badRequest().body("Nội dung lịch trình trống");
			}

			SavedItinerary itinerary = new SavedItinerary();
			itinerary.setUserId(userId);
			itinerary.setItineraryName(name != null ? name : "Lịch trình Hà Nội");
			itinerary.setContent(content);

			SavedItinerary saved = itineraryRepository.save(itinerary);
			return ResponseEntity.ok(saved);

		} catch (Exception e) {
			return ResponseEntity.internalServerError().body("Lỗi khi lưu: " + e.getMessage());
		}
	}

   
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserItineraries(@PathVariable Long userId) {
        List<SavedItinerary> list = itineraryRepository.findByUserId(userId);
        return ResponseEntity.ok(list);
    }
    

    @GetMapping("/{id}")
    public ResponseEntity<?> getItineraryDetail(@PathVariable Long id) {
        return itineraryRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}