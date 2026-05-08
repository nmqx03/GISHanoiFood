package com.webgis.hanoifood.service;

import com.webgis.hanoifood.entity.Event;
import com.webgis.hanoifood.entity.Place;
import com.webgis.hanoifood.repository.EventRepository;
import com.webgis.hanoifood.repository.PlaceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class EventService {

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private PlaceRepository placeRepository;

    @Autowired
    private SystemLogService systemLogService; 

    public List<Event> getAllEvents() {
        return eventRepository.findAll();
    }
    
    public List<Event> getEventsByPlaceId(Long placeId) {
        return eventRepository.findByPlaceId(placeId);
    }

    public Optional<Event> getEventById(Long id) {
        return eventRepository.findById(id);
    }

    @Transactional
    public Event createEvent(Event event, Long placeId, Long userId, String role) {
 
        if (!"ADMIN".equals(role) && !"EDITOR".equals(role)) {
            throw new RuntimeException("Không có quyền tạo sự kiện");
        }
        
        Place place = placeRepository.findById(placeId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy địa điểm ID: " + placeId));
        
        event.setPlace(place);

        Event savedEvent = eventRepository.save(event);

        systemLogService.saveLog(userId, "CREATE_EVENT", "Tạo sự kiện: " + savedEvent.getEventName());

        return savedEvent;
    }
    
    @Transactional
    public Event updateEvent(Long eventId, Event eventData, Long placeId, Long userId, String role) {

        if (!"ADMIN".equals(role) && !"EDITOR".equals(role)) {
            throw new RuntimeException("Không có quyền chỉnh sửa sự kiện");
        }
        
        Event existingEvent = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sự kiện"));

        String oldName = existingEvent.getEventName();

        existingEvent.setEventName(eventData.getEventName());
        existingEvent.setDescription(eventData.getDescription());
        existingEvent.setStartDate(eventData.getStartDate());
        existingEvent.setEndDate(eventData.getEndDate());

        if (placeId != null) {
            Place place = placeRepository.findById(placeId).orElse(null);
            existingEvent.setPlace(place);
        }

        Event savedEvent = eventRepository.save(existingEvent);

        systemLogService.saveLog(userId, "UPDATE_EVENT", 
            "Đã chỉnh sửa sự kiện: '" + oldName + "' thành '" + savedEvent.getEventName() + "'");

        return savedEvent;
    }

    
    @Transactional
    public void deleteEvent(Long eventId, Long userId, String role) {
        // KIỂM TRA QUYỀN
        if (!"ADMIN".equals(role) && !"EDITOR".equals(role)) {
            throw new RuntimeException("Chỉ Admin hoặc Editor mới có quyền xóa sự kiện");
        }

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sự kiện"));

        String eventName = event.getEventName();
        eventRepository.delete(event);

        systemLogService.saveLog(userId, "DELETE_EVENT", "Đã xóa sự kiện: " + eventName);
    }
}