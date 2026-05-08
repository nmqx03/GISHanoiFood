package com.webgis.hanoifood.dto;

import com.webgis.hanoifood.entity.Place;

public class PlaceHotDTO {
    private Place place;       
    private long totalScore;   
    private int rank;          
    
    private long viewCount;
    private long reviewCount;
    private long postCount;
 

    public PlaceHotDTO() {
    }


    public PlaceHotDTO(Place place, long totalScore, int rank, long viewCount, long reviewCount, long postCount) {
        this.place = place;
        this.totalScore = totalScore;
        this.rank = rank;
        this.viewCount = viewCount;
        this.reviewCount = reviewCount;
        this.postCount = postCount;
    }



    public Place getPlace() {
        return place;
    }

    public void setPlace(Place place) {
        this.place = place;
    }

    public long getTotalScore() {
        return totalScore;
    }

    public void setTotalScore(long totalScore) {
        this.totalScore = totalScore;
    }

    public int getRank() {
        return rank;
    }

    public void setRank(int rank) {
        this.rank = rank;
    }

    public long getViewCount() {
        return viewCount;
    }

    public void setViewCount(long viewCount) {
        this.viewCount = viewCount;
    }

    public long getReviewCount() {
        return reviewCount;
    }

    public void setReviewCount(long reviewCount) {
        this.reviewCount = reviewCount;
    }

  
    public long getPostCount() {
        return postCount;
    }

    public void setPostCount(long postCount) {
        this.postCount = postCount;
    }
}