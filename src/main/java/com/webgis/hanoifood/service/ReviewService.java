package com.webgis.hanoifood.service;

import com.webgis.hanoifood.entity.Place;
import com.webgis.hanoifood.entity.Review;
import com.webgis.hanoifood.entity.ReviewImage;
import com.webgis.hanoifood.entity.User;
import com.webgis.hanoifood.repository.PlaceRepository;
import com.webgis.hanoifood.repository.ReviewImageRepository;
import com.webgis.hanoifood.repository.ReviewRepository;
import com.webgis.hanoifood.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ReviewService {

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private ReviewImageRepository reviewImageRepository;

    @Autowired
    private PlaceRepository placeRepository;

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private SystemLogService systemLogService;
    
    public List<Review> getAllReviews() {
        return reviewRepository.findAll();
    }
    
    public List<Review> getReviewsByPlaceId(Long placeId) {
        return reviewRepository.findByPlaceId(placeId);
    }

    
    @Transactional
    public Review createReview(Long placeId, Integer rating, String content, List<String> imageUrls, Long userId) {
        
 
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        Place place = placeRepository.findById(placeId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy địa điểm"));

     
        if (rating < 1 || rating > 5) {
            throw new RuntimeException("Điểm đánh giá phải từ 1 đến 5");
        }
        
        boolean alreadyReviewed = reviewRepository.existsByUserIdAndPlaceId(userId, placeId);
        if (alreadyReviewed) {
            throw new RuntimeException("Bạn đã đánh giá địa điểm này rồi. Để đảm bảo tính minh bạch, mỗi tài khoản chỉ được đánh giá 1 lần!");
        }
  
        Review review = new Review();
        review.setPlace(place);
        review.setUser(user);
        review.setRating(rating);
        review.setContent(content);
        review = reviewRepository.save(review);

        if (imageUrls != null && !imageUrls.isEmpty()) {
            for (String url : imageUrls) { 
                ReviewImage image = new ReviewImage(); 
                image.setReview(review); 
                image.setUrl(url); 
                reviewImageRepository.save(image);
            }
        }


        return review;
    }

    @Transactional
    public void deleteReview(Long reviewId, Long userId, String role) { // Đổi tham số nhận userId và role
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đánh giá"));

    
        if (!"ADMIN".equals(role) && !"EDITOR".equals(role)) {
   
            if (!review.getUser().getId().equals(userId)) {
                throw new RuntimeException("Bạn không có quyền xóa đánh giá của người khác");
            }
        }

        reviewRepository.delete(review);
        
        systemLogService.saveLog(userId, "DELETE_REVIEW", "Xóa đánh giá ID " + reviewId);
    }
}