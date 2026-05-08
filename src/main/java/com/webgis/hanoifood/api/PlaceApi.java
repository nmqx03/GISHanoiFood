package com.webgis.hanoifood.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.webgis.hanoifood.entity.Place;
import com.webgis.hanoifood.service.PlaceService;
import com.webgis.hanoifood.security.JwtUtil; 
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import io.swagger.v3.oas.annotations.Parameter;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/places")
public class PlaceApi {

    @Autowired
    private PlaceService placeService;
    
    @Autowired
    private JwtUtil jwtUtil; 

    @GetMapping
    public List<Place> getAll() {
        return placeService.getAllPlaces();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Place> getById(@PathVariable Long id) {
        return placeService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/analysis")
    public ResponseEntity<List<Place>> analyzeRegion(
            @RequestParam Long targetId,
            @RequestParam Long categoryId,
            @RequestParam(defaultValue = "3.0") double radius
    ) {
        List<Place> results = placeService.getAnalysisNearPlace(targetId, categoryId, radius);
        return ResponseEntity.ok(results);
    }
    
    @GetMapping("/nearby")
    public ResponseEntity<List<Place>> searchNearby(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "5.0") double radius, 
            @RequestParam(required = false) Long categoryId 
    ) {
        List<Place> results = placeService.getNearbyPlaces(lat, lng, radius, categoryId);
        return ResponseEntity.ok(results);
    }


    @PostMapping
    public ResponseEntity<?> addPlace(
            @RequestPart("place") String placeJson,
            @RequestParam("categoryId") Long categoryId,
            @RequestPart(value = "imageFile", required = false) MultipartFile imageFile,
            @RequestPart(value = "audioFile", required = false) MultipartFile audioFile,
            @RequestPart(value = "videoFile", required = false) MultipartFile videoFile,
            @RequestHeader("Authorization") String authHeader
    ) {
        try {
            String token = authHeader.substring(7);
            String role = jwtUtil.getRole(token);
            Long userId = jwtUtil.getUserId(token);

            ObjectMapper mapper = new ObjectMapper();
            Place place = mapper.readValue(placeJson, Place.class);
            
          
            Place savedPlace = placeService.addPlace(place, categoryId, imageFile, audioFile, videoFile, userId, role);
            return ResponseEntity.ok(savedPlace);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }


    @PutMapping("/{id}")
    public ResponseEntity<?> updatePlace(
            @PathVariable Long id,
            @RequestPart("place") String placeJson,
            @RequestParam("categoryId") Long categoryId,
            @RequestPart(value = "imageFile", required = false) MultipartFile imageFile,
            @RequestPart(value = "audioFile", required = false) MultipartFile audioFile,
            @RequestPart(value = "videoFile", required = false) MultipartFile videoFile,
            @RequestHeader("Authorization") String authHeader
    ) {
        try {
            String token = authHeader.substring(7);
            String role = jwtUtil.getRole(token);
            Long userId = jwtUtil.getUserId(token);

            ObjectMapper mapper = new ObjectMapper();
            Place place = mapper.readValue(placeJson, Place.class);

           
            Optional<Place> updatedPlace = placeService.updatePlace(id, place, categoryId, imageFile, audioFile, videoFile, userId, role);
            return updatedPlace.<ResponseEntity<?>>map(ResponseEntity::ok)
                               .orElse(ResponseEntity.notFound().build());

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePlace(
            @PathVariable Long id, 
            @RequestHeader("Authorization") String authHeader) { 
        try {
            String token = authHeader.substring(7);
            String role = jwtUtil.getRole(token);
            Long userId = jwtUtil.getUserId(token);

           
            boolean isDeleted = placeService.deletePlace(id, userId, role);
            return isDeleted ? ResponseEntity.noContent().build() 
                             : ResponseEntity.notFound().build();

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}