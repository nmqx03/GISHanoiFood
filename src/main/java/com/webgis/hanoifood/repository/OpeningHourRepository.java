package com.webgis.hanoifood.repository;

import com.webgis.hanoifood.entity.OpeningHour;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OpeningHourRepository extends JpaRepository<OpeningHour, Long> {
    List<OpeningHour> findByPlaceId(Long placeId);
}
