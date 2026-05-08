package com.webgis.hanoifood.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalTime;

@Entity
@Table(name = "opening_hours")
public class OpeningHour {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "place_id", nullable = false)
    @JsonIgnore
    private Place place;

    @Column(name = "open_time", nullable = false)
    private LocalTime openTime;

    @Column(name = "close_time", nullable = false)
    private LocalTime closeTime;

    @Column(name = "day_of_week")
    private Short dayOfWeek; // null = mở cả tuần. 0=CN, 1=T2, ..., 6=T7

    private String note;

    public OpeningHour() {}

    public OpeningHour(Place place, LocalTime openTime, LocalTime closeTime, Short dayOfWeek, String note) {
        this.place = place;
        this.openTime = openTime;
        this.closeTime = closeTime;
        this.dayOfWeek = dayOfWeek;
        this.note = note;
    }

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Place getPlace() { return place; }
    public void setPlace(Place place) { this.place = place; }

    public LocalTime getOpenTime() { return openTime; }
    public void setOpenTime(LocalTime openTime) { this.openTime = openTime; }

    public LocalTime getCloseTime() { return closeTime; }
    public void setCloseTime(LocalTime closeTime) { this.closeTime = closeTime; }

    public Short getDayOfWeek() { return dayOfWeek; }
    public void setDayOfWeek(Short dayOfWeek) { this.dayOfWeek = dayOfWeek; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}
