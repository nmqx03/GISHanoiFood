package com.webgis.hanoifood.api;

import com.webgis.hanoifood.entity.Event;
import com.webgis.hanoifood.security.JwtUtil;
import com.webgis.hanoifood.service.EventService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = "http://localhost:5173")
public class EventApi {

    @Autowired
    private EventService eventService;

    @Autowired
    private JwtUtil jwtUtil;

    @GetMapping
    public ResponseEntity<List<Event>> getAllEvents() {
        return ResponseEntity.ok(eventService.getAllEvents());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Event> getEventById(@PathVariable Long id) {
        return eventService.getEventById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/place/{placeId}")
    public ResponseEntity<List<Event>> getEventsByPlace(@PathVariable Long placeId) {
        return ResponseEntity.ok(eventService.getEventsByPlaceId(placeId));
    }

    @PostMapping
    public ResponseEntity<?> createEvent(
            @RequestBody Event event,            
            @RequestParam("placeId") Long placeId,
            @RequestHeader("Authorization") String authHeader
    ) {
        try {
            String token = authHeader.substring(7);
            String role = jwtUtil.getRole(token);
            Long userId = jwtUtil.getUserId(token);

            Event newEvent = eventService.createEvent(event, placeId, userId, role);
            
            return ResponseEntity.ok(newEvent);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updateEvent(
            @PathVariable Long id,
            @RequestBody Event event,
            @RequestParam(value = "placeId", required = false) Long placeId,
            @RequestHeader("Authorization") String authHeader
    ) {
        try {
            String token = authHeader.substring(7);
            Long userId = jwtUtil.getUserId(token);
            String role = jwtUtil.getRole(token);
            
            
            Event updatedEvent = eventService.updateEvent(id, event, placeId, userId, role);
            
            return ResponseEntity.ok(updatedEvent);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEvent(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader
    ) {
        try {
            String token = authHeader.substring(7);
            String role = jwtUtil.getRole(token);
            Long userId = jwtUtil.getUserId(token);

          
            eventService.deleteEvent(id, userId, role);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}