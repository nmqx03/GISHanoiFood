package com.webgis.hanoifood.repository;

import com.webgis.hanoifood.entity.Event;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
	List<Event> findByPlaceId(Long placeId);
}