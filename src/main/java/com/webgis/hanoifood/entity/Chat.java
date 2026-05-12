package com.webgis.hanoifood.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "chats")
public class Chat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String question;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String answer;

    // Cột message trong DB = alias của question (để tương thích schema cũ)
    // Dùng insertable=false, updatable=false để JPA không ghi đè
    @Column(name = "message", columnDefinition = "TEXT",
            insertable = false, updatable = false)
    private String message;

    // Cột role trong DB, mặc định 'USER' (set ở DB level)
    // Dùng insertable=false, updatable=false để JPA không cần truyền
    @Column(name = "role", insertable = false, updatable = false)
    private String role;

    @Column(name = "message_type")
    private String messageType;

    @Column(name = "structured_data", columnDefinition = "TEXT")
    private String structuredData;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public Chat() {
        this.createdAt = LocalDateTime.now();
    }

    public Chat(Long userId, String question, String answer, String messageType, String structuredData) {
        this.userId = userId;
        this.question = question;
        this.answer = answer;
        this.messageType = messageType;
        this.structuredData = structuredData;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }

    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }

    public String getMessage() { return message; }

    public String getRole() { return role; }

    public String getMessageType() { return messageType; }
    public void setMessageType(String messageType) { this.messageType = messageType; }

    public String getStructuredData() { return structuredData; }
    public void setStructuredData(String structuredData) { this.structuredData = structuredData; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}