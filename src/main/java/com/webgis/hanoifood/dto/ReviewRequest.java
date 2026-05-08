package com.webgis.hanoifood.dto;

import java.util.List;

public class ReviewRequest {
    private Long placeId;
    private Integer rating; 
    private String content;
    private List<String> imageUrls; 

   

    public ReviewRequest() {
    }

    public ReviewRequest(Long placeId, Integer rating, String content, List<String> imageUrls) {
        this.placeId = placeId;
        this.rating = rating;
        this.content = content;
        this.imageUrls = imageUrls;
    }

    public Long getPlaceId() {
        return placeId;
    }

    public void setPlaceId(Long placeId) {
        this.placeId = placeId;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public List<String> getImageUrls() {
        return imageUrls;
    }

    public void setImageUrls(List<String> imageUrls) {
        this.imageUrls = imageUrls;
    }
}