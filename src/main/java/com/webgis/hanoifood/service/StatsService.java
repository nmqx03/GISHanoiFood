package com.webgis.hanoifood.service;

import com.webgis.hanoifood.dto.PlaceHotDTO;
import com.webgis.hanoifood.entity.Place;
import com.webgis.hanoifood.entity.PlaceStats;
import com.webgis.hanoifood.repository.PlaceRepository;
import com.webgis.hanoifood.repository.PlaceStatsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class StatsService {

    @Autowired
    private PlaceStatsRepository statsRepo;

    @Autowired
    private PlaceRepository placeRepo;

    
    private PlaceStats getOrCreateStats(Long placeId) {
        PlaceStats stats = statsRepo.findById(placeId).orElse(null);
        if (stats == null) {
            stats = new PlaceStats();
            stats.setPlaceId(placeId);
            stats.setViewCount(0);
            stats.setReviewCount(0);
            stats.setPostCount(0);
        }
        return stats;
    }


    public void increaseView(Long placeId) {
        PlaceStats stats = getOrCreateStats(placeId);
        stats.setViewCount(stats.getViewCount() + 1);
        statsRepo.save(stats);
    }


    public void increaseReview(Long placeId) {
        PlaceStats stats = getOrCreateStats(placeId);
        stats.setReviewCount(stats.getReviewCount() + 1);
        statsRepo.save(stats);
    }

    public void increasePost(Long placeId) {
        PlaceStats stats = getOrCreateStats(placeId);
        stats.setPostCount(stats.getPostCount() + 1);
        statsRepo.save(stats);
    }

    //  Tính điểm tổng hợp
    public List<PlaceHotDTO> getHotPlaces() {
        List<Place> places = placeRepo.findAll();
        List<PlaceStats> allStats = statsRepo.findAll();
        List<PlaceHotDTO> dtos = new ArrayList<>();

        for (Place p : places) {
       
            PlaceStats stat = allStats.stream()
                    .filter(s -> s.getPlaceId() != null && p.getId() != null &&
                                 s.getPlaceId().equals(p.getId())) 
                    .findFirst()
                    .orElse(new PlaceStats()); 
            int view = (stat.getViewCount() != null) ? stat.getViewCount() : 0;
            int review = (stat.getReviewCount() != null) ? stat.getReviewCount() : 0;
            int post = (stat.getPostCount() != null) ? stat.getPostCount() : 0;

            
            long totalScore = view + (review * 2L) + (post * 3L);

            if (totalScore > 0) {
                PlaceHotDTO dto = new PlaceHotDTO();
                dto.setPlace(p);
                dto.setTotalScore(totalScore);
                dto.setViewCount(view);     
                dto.setReviewCount(review);
                dto.setPostCount(post);
                dtos.add(dto);
            }
        }


        Collections.sort(dtos, (o1, o2) -> Long.compare(o2.getTotalScore(), o1.getTotalScore()));

        
        for (int i = 0; i < dtos.size(); i++) {
            dtos.get(i).setRank(i + 1);
        }

        return dtos;
    }
}