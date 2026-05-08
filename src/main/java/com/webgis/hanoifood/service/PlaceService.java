package com.webgis.hanoifood.service;

import com.webgis.hanoifood.entity.Place;
import com.webgis.hanoifood.repository.CategoryRepository;
import com.webgis.hanoifood.repository.PlaceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

@Service
public class PlaceService {

    @Autowired
    private PlaceRepository placeRepo;

    @Autowired
    private FileStorageService fileStorageService;
    
    @Autowired
    private CategoryRepository categoryRepo;
    
    @Autowired
    private SystemLogService systemLogService; 

    public List<Place> getAllPlaces() {
        return placeRepo.findAll();
    }
    
    public List<Place> getNearbyPlaces(double lat, double lng, double distanceInKm, Long categoryId) {
        double radiusInMeters = distanceInKm * 1000;
        return placeRepo.findNearbyPlacesByCategory(lat, lng, radiusInMeters, categoryId);
    }

    public List<Place> getAnalysisNearPlace(Long targetId, Long categoryId, double distanceInKm) {
         return placeRepo.findPlacesByCategoryNearPlace(targetId, categoryId, distanceInKm * 1000);
    }

    public Optional<Place> getById(Long id) {
        return placeRepo.findById(id);
    }

 
    @Transactional
    public Place addPlace(Place place, Long categoryId, MultipartFile imageFile,
                          MultipartFile audioFile, MultipartFile videoFile, Long userId, String role) {
        
     
        if (!"ADMIN".equals(role) && !"EDITOR".equals(role)) {
            throw new RuntimeException("Không có quyền tạo địa điểm");
        }
        
        categoryRepo.findById(categoryId).ifPresent(place::setCategory);
        
        if (imageFile != null && !imageFile.isEmpty()) {
            String filePath = fileStorageService.saveFile(imageFile, "images/places");
            place.setImageUrl(filePath);
        }
        if (audioFile != null && !audioFile.isEmpty()) {
            String filePath = fileStorageService.saveFile(audioFile, "audio/places");
            place.setAudioUrl(filePath);
        }
        if (videoFile != null && !videoFile.isEmpty()) {
            String filePath = fileStorageService.saveFile(videoFile, "videos/places");
            place.setVideoUrl(filePath);
        }

        Place savedPlace = placeRepo.save(place);
        
        systemLogService.saveLog(userId, "CREATE_PLACE", "Tạo địa điểm: " + savedPlace.getName());

        return savedPlace;
    }

    
    @Transactional
    public Optional<Place> updatePlace(Long id, Place newPlace,  Long categoryId,
                                       MultipartFile imageFile,
                                       MultipartFile audioFile,
                                       MultipartFile videoFile, Long userId, String role) {
                                       
      
        if (!"ADMIN".equals(role) && !"EDITOR".equals(role)) {
            throw new RuntimeException("Không có quyền chỉnh sửa địa điểm");
        }
        
        return placeRepo.findById(id).map(place -> {
            place.setName(newPlace.getName());
            place.setCategory(newPlace.getCategory());
            place.setDescription(newPlace.getDescription());
            
            place.setLatitude(newPlace.getLatitude());
            place.setLongitude(newPlace.getLongitude());
            place.setLocation(newPlace.getLocation());
            
            if (categoryId != null) {
                categoryRepo.findById(categoryId).ifPresent(place::setCategory);
            }

            if (imageFile != null && !imageFile.isEmpty()) {
                String filePath = fileStorageService.saveFile(imageFile, "images/places");
                place.setImageUrl(filePath);
            }
            if (audioFile != null && !audioFile.isEmpty()) {
                String filePath = fileStorageService.saveFile(audioFile, "audio/places");
                place.setAudioUrl(filePath);
            }
            if (videoFile != null && !videoFile.isEmpty()) {
                String filePath = fileStorageService.saveFile(videoFile, "videos/places");
                place.setVideoUrl(filePath);
            }

            Place updated = placeRepo.save(place);
            
            systemLogService.saveLog(userId, "UPDATE_PLACE", "Cập nhật địa điểm ID " + id);

            return updated;
        });
    }

   
    @Transactional
    public Boolean deletePlace(Long id, Long userId, String role) {
       
        if (!"ADMIN".equals(role) && !"EDITOR".equals(role)) {
            throw new RuntimeException("Chỉ Admin hoặc Editor mới có quyền xóa địa điểm");
        }
        
        return placeRepo.findById(id).map(place -> {
            String name = place.getName();
            placeRepo.delete(place);
            systemLogService.saveLog(userId, "DELETE_PLACE", "Xóa địa điểm: " + name);
            
            return true;
        }).orElse(false);
    }
}