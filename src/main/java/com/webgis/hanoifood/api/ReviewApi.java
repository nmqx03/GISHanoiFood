package com.webgis.hanoifood.api;

import com.webgis.hanoifood.entity.Review;
import com.webgis.hanoifood.security.JwtUtil;
import com.webgis.hanoifood.service.FileStorageService;
import com.webgis.hanoifood.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
public class ReviewApi {

    @Autowired
    private ReviewService reviewService;
    
    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private JwtUtil jwtUtil; 
    
    @GetMapping("/all")
    public ResponseEntity<List<Review>> getAllReviews() {
        return ResponseEntity.ok(reviewService.getAllReviews());
    }

    @GetMapping("/place/{placeId}")
    public ResponseEntity<List<Review>> getReviewsByPlaceId(@PathVariable Long placeId) {
        List<Review> reviews = reviewService.getReviewsByPlaceId(placeId);
        return ResponseEntity.ok(reviews);
    }

    @PostMapping
    public ResponseEntity<?> createReview(
            @RequestBody Map<String, Object> body,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7); 
            Long userId = jwtUtil.getUserId(token); 

            Long placeId = Long.parseLong(body.get("placeId").toString());
            Integer rating = Integer.parseInt(body.get("rating").toString());
            String content = body.get("content") != null ? body.get("content").toString() : null;
            
            @SuppressWarnings("unchecked")
            List<String> imageUrls = body.get("imageUrls") != null ? (List<String>) body.get("imageUrls") : null;

      
            Review review = reviewService.createReview(placeId, rating, content, imageUrls, userId);
            return ResponseEntity.ok(review);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/upload-image")
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "File không hợp lệ hoặc rỗng"));
            }

   
            long maxSize = 3 * 1024 * 1024;
            if (file.getSize() > maxSize) {
                return ResponseEntity.badRequest().body(Map.of("error", "Kích thước ảnh tối đa 3MB"));
            }

            String imagePath = fileStorageService.saveFile(file, "reviews");

           
            return ResponseEntity.ok(Map.of("url", "/uploads/" + imagePath));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Lỗi upload ảnh: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{reviewId}")
    public ResponseEntity<?> deleteReview(
            @PathVariable Long reviewId,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String role = jwtUtil.getRole(token);
            Long userId = jwtUtil.getUserId(token);

 
            reviewService.deleteReview(reviewId, userId, role);
            return ResponseEntity.ok(Map.of("message", "Xóa đánh giá thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}