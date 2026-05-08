package com.webgis.hanoifood.api;

import com.webgis.hanoifood.dto.PlaceHotDTO;
import com.webgis.hanoifood.service.StatsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stats")

public class StatsApi {

    @Autowired
    private StatsService statsService;

    @GetMapping("/hot")
    public ResponseEntity<List<PlaceHotDTO>> getHotPlaces() {
        List<PlaceHotDTO> list = statsService.getHotPlaces();
        return ResponseEntity.ok(list);
    }

 
    @PostMapping("/view/{id}")
    public ResponseEntity<String> viewPlace(@PathVariable Long id) {
        statsService.increaseView(id);
        return ResponseEntity.ok("View counted success");
    }
    
    @PostMapping("/review/{id}")
    public ResponseEntity<?> countReview(@PathVariable Long id) {
        statsService.increaseReview(id);
        return ResponseEntity.ok("Review counted");
    }

    @PostMapping("/post/{id}")
    public ResponseEntity<?> countPost(@PathVariable Long id) {
        statsService.increasePost(id);
        return ResponseEntity.ok("Post counted");
    }
}