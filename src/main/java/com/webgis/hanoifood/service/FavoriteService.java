package com.webgis.hanoifood.service;

import com.webgis.hanoifood.entity.FavoritePlace;
import java.util.List;
import com.webgis.hanoifood.repository.FavoriteRepository;

import jakarta.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class FavoriteService {

    @Autowired
    private FavoriteRepository favoriteRepository;

    
    public List<FavoritePlace> getAllFavoritePlaces(Long userId){
    	return favoriteRepository.findByUserId(userId);
    }
   
    public boolean isFavorite(Long userId, Long placeId) {
        return favoriteRepository.existsByUserIdAndPlaceId(userId, placeId);
    }
 
    @Transactional
    public String toggleFavorite(Long userId, Long placeId) {
        Optional<FavoritePlace> existingFav = favoriteRepository.findByUserIdAndPlaceId(userId, placeId);

        if (existingFav.isPresent()) {
            favoriteRepository.delete(existingFav.get());
            return "removed";
        } else {
            FavoritePlace newFav = new FavoritePlace(userId, placeId);
            favoriteRepository.save(newFav);
            return "added";
        }
    }
}