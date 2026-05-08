package com.webgis.hanoifood.repository;

import com.webgis.hanoifood.entity.FavoritePlace;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<FavoritePlace, Long> {
    Optional<FavoritePlace> findByUserIdAndPlaceId(Long userId, Long placeId);
    boolean existsByUserIdAndPlaceId(Long userId, Long placeId);
    List<FavoritePlace> findByUserId(Long userId);
}