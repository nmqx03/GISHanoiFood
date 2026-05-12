package com.webgis.hanoifood.repository;

import com.webgis.hanoifood.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    // Dùng place_id (đúng với DB schema hiện tại)
    List<Review> findByPlaceId(Long placeId);

    List<Review> findByUserId(Long userId);

    // existsByUserIdAndPlaceId → map đúng với UNIQUE(user_id, place_id) sau khi fix DB
    boolean existsByUserIdAndPlaceId(Long userId, Long placeId);
}