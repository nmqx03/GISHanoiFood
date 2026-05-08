package com.webgis.hanoifood.api;

import com.webgis.hanoifood.entity.FavoritePlace;
import com.webgis.hanoifood.service.FavoriteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/favorites")

public class FavoriteApi {

    @Autowired
    private FavoriteService favoriteService;


    @GetMapping("/check")
    public ResponseEntity<?> checkStatus(@RequestParam Long userId, @RequestParam Long placeId) {
        boolean result = favoriteService.isFavorite(userId, placeId);
        return ResponseEntity.ok(Map.of("isFavorite", result));
    }


    @PostMapping("/toggle")
    public ResponseEntity<?> toggleFavorite(@RequestBody Map<String, Long> payload) {
      
        if (payload.get("userId") == null || payload.get("placeId") == null) {
            return ResponseEntity.badRequest().body("Thiếu userId hoặc placeId");
        }
        Long userId = Long.valueOf(payload.get("userId").toString());
        Long placeId = Long.valueOf(payload.get("placeId").toString());

        String status = favoriteService.toggleFavorite(userId, placeId);

        return ResponseEntity.ok(Map.of("status", status));
    }
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserFavorites(@PathVariable Long userId) {
        List<FavoritePlace> list = favoriteService.getAllFavoritePlaces(userId);
        return ResponseEntity.ok(list);
    }
}