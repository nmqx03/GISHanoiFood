package com.webgis.hanoifood.repository;

import com.webgis.hanoifood.entity.PlaceStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;


@Repository
public interface PlaceStatsRepository extends JpaRepository<PlaceStats, Long> {

    @Modifying
    @Transactional
    @Query("UPDATE PlaceStats p SET p.viewCount = p.viewCount + 1 WHERE p.placeId = :placeId")
    void incrementViewCount(Long placeId);
}