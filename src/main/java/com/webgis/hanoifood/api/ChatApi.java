package com.webgis.hanoifood.api;

import com.webgis.hanoifood.entity.Chat;
import com.webgis.hanoifood.repository.ChatRepository;
import com.webgis.hanoifood.service.GeminiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatApi {

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private ChatRepository chatRepository;


    @PostMapping("/send")
    public ResponseEntity<?> sendMessage(@RequestBody Map<String, Object> payload) {
        try {
       
            String question = (String) payload.get("question");
        
            Long userId = null;
            if (payload.get("user_id") != null) {
                userId = Long.valueOf(payload.get("user_id").toString());
            }

            if (question == null || question.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Câu hỏi không được để trống");
            }

       
            GeminiService.GeminiResponseDTO aiResponse = geminiService.callGemini(question);

         
            Chat chat = new Chat();
            chat.setUserId(userId);
            chat.setQuestion(question);
            chat.setAnswer(aiResponse.getText());

            //  Phân loại tin nhắn dựa trên flag của AI
            if (aiResponse.isItinerary()) {
                chat.setMessageType("ITINERARY");
                chat.setStructuredData(aiResponse.getStructuredData()); 
            } else {
                chat.setMessageType("TEXT");
                chat.setStructuredData(null);
            }

         
            Chat savedChat = chatRepository.save(chat);

   
            return ResponseEntity.ok(savedChat);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Lỗi hệ thống: " + e.getMessage());
        }
    }

   
    @GetMapping("/history/{userId}")
    public ResponseEntity<?> getChatHistory(@PathVariable Long userId) {
        List<Chat> history = chatRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return ResponseEntity.ok(history);
    }
}