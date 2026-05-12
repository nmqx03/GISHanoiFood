package com.webgis.hanoifood.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "favorite_places")
public class FavoritePlace {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    // Cột place_id: dùng chính trong code hiện tại
    @Column(name = "place_id")
    private Long placeId;

    // Cột restaurant_id: còn trong DB (dữ liệu cũ), không dùng nữa
    // insertable=false, updatable=false để JPA không ghi vào cột này
    @Column(name = "restaurant_id", insertable = false, updatable = false)
    private Integer restaurantId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public FavoritePlace() {
    }

    public FavoritePlace(Long userId, Long placeId) {
        this.userId = userId;
        this.placeId = placeId;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getPlaceId() { return placeId; }
    public void setPlaceId(Long placeId) { this.placeId = placeId; }

    public Integer getRestaurantId() { return restaurantId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}