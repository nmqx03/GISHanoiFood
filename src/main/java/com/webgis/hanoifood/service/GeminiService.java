package com.webgis.hanoifood.service;

import com.google.genai.Client;
import com.google.genai.types.GenerateContentResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    // Tên model
    private final String MODEL_NAME = "gemini-3-flash-preview";

    private final ObjectMapper objectMapper = new ObjectMapper();

    public GeminiResponseDTO callGemini(String userQuestion) {

        Client client = Client.builder()
                .apiKey(apiKey)
                .build();

        try {
            String systemInstruction = """
                BẠN LÀ MỘT CHUYÊN GIA ẨM THỰC VỀ THÀNH PHỐ HÀ NỘI, VIỆT NAM CHO HỆ THỐNG WEBGIS.
                
                NHIỆM VỤ:
                1. Trả lời các câu hỏi về địa điểm ăn uống, món ăn đặc trưng, văn hóa ẩm thực tại Hà Nội.
                2. Gợi ý lịch trình trải nghiệm ẩm thực (food tour) chi tiết nếu được yêu cầu.
                
                QUY TẮC PHẢN HỒI (RẤT QUAN TRỌNG):
                - Bạn CHỈ trả về dữ liệu dưới dạng JSON thuần (Raw JSON).
                - KHÔNG dùng markdown (không dùng ```json ... ```).
                - KHÔNG thêm bất kỳ lời dẫn nào ngoài JSON.
                
                CẤU TRÚC JSON BẮT BUỘC:
                
                TRƯỜNG HỢP 1: NGƯỜI DÙNG HỎI LỊCH TRÌNH / FOOD TOUR (VD: "Lịch trình ăn uống Hà Nội 1 ngày", "Gợi ý food tour...")
                {
                    "isItinerary": true,
                    "text": "Lời chào và tóm tắt ngắn gọn về lịch trình ẩm thực này (khoảng 2-3 câu).",
                    "data": {
                        "title": "Tên lịch trình (VD: Khám phá ẩm thực Hà Nội 1 ngày)",
                        "days": [
                            {
                                "day": "Ngày 1",
                                "activities": ["Sáng: Phở Hà Nội tại phố Bát Đàn...", "Trưa: Bún chả Hàng Mành...", "Chiều: Bánh mì Đà Nẵng phố cổ...", "Tối: Bún đậu mắm tôm Nguyễn Siêu..."]
                            }
                        ]
                    }
                }
                
                TRƯỜNG HỢP 2: CÂU HỎI THÔNG THƯỜNG (VD: "Hà Nội có đặc sản gì?", "Phở Hà Nội khác phở Sài Gòn thế nào?", "Quán bún chả ngon ở đâu?")
                {
                    "isItinerary": false,
                    "text": "Câu trả lời chi tiết của bạn dưới dạng văn bản thông thường. Hãy trả lời thân thiện, đầy đủ thông tin về ẩm thực Hà Nội.",
                    "data": null
                }
                
                LƯU Ý: Nếu người dùng hỏi về chủ đề KHÔNG liên quan đến ẩm thực hoặc địa điểm ăn uống tại Hà Nội, hãy lịch sự từ chối và nhắc họ rằng bạn chỉ chuyên tư vấn về ẩm thực Hà Nội.
                
                CÂU HỎI CỦA NGƯỜI DÙNG: 
                """;

            String finalPrompt = systemInstruction + userQuestion;

            // Gọi API
            GenerateContentResponse response = client.models.generateContent(MODEL_NAME, finalPrompt, null);
            String rawResponse = response.text();

            // xử lý dl đầu ra
            String cleanJson = rawResponse.replaceAll("```json", "").replaceAll("```", "").trim();

            JsonNode jsonNode = objectMapper.readTree(cleanJson);

            boolean isItinerary = jsonNode.has("isItinerary") && jsonNode.get("isItinerary").asBoolean();
            String text = jsonNode.has("text") ? jsonNode.get("text").asText() : "";

            String data = (jsonNode.has("data") && !jsonNode.get("data").isNull())
                          ? jsonNode.get("data").toString()
                          : null;

            return new GeminiResponseDTO(text, isItinerary, data);

        } catch (Exception e) {
            e.printStackTrace();
            return new GeminiResponseDTO(
                "Xin lỗi, hệ thống đang bận. Vui lòng kiểm tra lại hoặc kết nối mạng.",
                false,
                null
            );
        }
    }


    public static class GeminiResponseDTO {
        private String text;
        private boolean isItinerary;
        private String structuredData;

        public GeminiResponseDTO(String text, boolean isItinerary, String structuredData) {
            this.text = text;
            this.isItinerary = isItinerary;
            this.structuredData = structuredData;
        }

        public String getText() { return text; }
        public boolean isItinerary() { return isItinerary; }
        public String getStructuredData() { return structuredData; }
    }
}
