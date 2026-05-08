package com.webgis.hanoifood.entity;

import jakarta.persistence.*;
import java.sql.Timestamp;
import java.time.Instant;

@Entity
@Table(name = "place_stats")
public class PlaceStats {

	@Id
    @Column(name = "place_id")
    private Long placeId;

    @Column(name = "view_count")
    private Integer viewCount = 0;

    @Column(name = "review_count")
    private Integer reviewCount = 0;

    @Column(name = "post_count")
    private Integer postCount = 0;

    @Column(name = "updated_at")
    private Timestamp updatedAt;


    @PrePersist
    @PreUpdate
    public void updateTimestamp() {
        this.updatedAt = Timestamp.from(Instant.now());
    }

  

    public Long getPlaceId() {
        return placeId;
    }

    public void setPlaceId(Long placeId) {
        this.placeId = placeId;
    }

    public Integer getViewCount() {
        return viewCount;
    }

    public void setViewCount(Integer viewCount) {
        this.viewCount = viewCount;
    }

    public Integer getReviewCount() {
        return reviewCount;
    }

    public void setReviewCount(Integer reviewCount) {
        this.reviewCount = reviewCount;
    }

    public Integer getPostCount() {
        return postCount;
    }

    public void setPostCount(Integer postCount) {
        this.postCount = postCount;
    }

    public Timestamp getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Timestamp updatedAt) {
        this.updatedAt = updatedAt;
    }
}