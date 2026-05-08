package com.webgis.hanoifood.repository;

import com.webgis.hanoifood.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByPlaceId(Long placeId);
    List<Review> findByUserId(Long userId);
    boolean existsByUserIdAndPlaceId(Long userId, Long placeId);
}