package com.webgis.hanoifood.repository;

import com.webgis.hanoifood.entity.Place;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlaceRepository extends JpaRepository<Place, Long> {

	List<Place> findByNameContainingIgnoreCase(String name);
	
    @Query(value = "SELECT p.* FROM places p " +
                   "JOIN places target ON target.id = :targetPlaceId " +
                   "WHERE p.category_id = :categoryId " +
                   "AND p.id <> :targetPlaceId " +
                   "AND ST_DistanceSphere(p.geom, target.geom) <= :radiusInMeters", 
           nativeQuery = true)
	List<Place> findPlacesByCategoryNearPlace(@Param("targetPlaceId") Long targetPlaceId,
			@Param("categoryId") Long categoryId, @Param("radiusInMeters") double radiusInMeters);
    
    @Query(value = "SELECT * FROM places p " +
            "WHERE ST_DistanceSphere(p.geom, ST_MakePoint(:lng, :lat)) <= :radiusInMeters " +
            "AND p.category_id = :categoryId " + 
            "ORDER BY ST_DistanceSphere(p.geom, ST_MakePoint(:lng, :lat)) ASC", 
    nativeQuery = true)
    List<Place> findNearbyPlacesByCategory(
            @Param("lat") double lat, 
            @Param("lng") double lng, 
            @Param("radiusInMeters") double radiusInMeters,
            @Param("categoryId") Long categoryId);



}