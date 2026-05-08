package com.webgis.hanoifood.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "posts")
public class Post {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne
	@JoinColumn(name = "user_id")
	private User user;

	@Column(nullable = false)
	private String title;

	@Column(nullable = false, columnDefinition = "TEXT")
	private String content;

	@Column(name = "image_url")
	private String imageUrl;

	@Column(name = "is_official")
	private Boolean isOfficial; 

	@Column(name = "status")
	private String status; 

	@Column(name = "created_at")
	private LocalDateTime createdAt;

	@ManyToMany
	@JoinTable(name = "post_places", joinColumns = @JoinColumn(name = "post_id"), inverseJoinColumns = @JoinColumn(name = "place_id"))
	private Set<Place> relatedPlaces = new HashSet<>();

	@PrePersist
	protected void onCreate() {
		this.createdAt = LocalDateTime.now();
		if (this.isOfficial == null)
			this.isOfficial = false;
		if (this.status == null)
			this.status = "PENDING";
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public User getUser() {
		return user;
	}

	public void setUser(User user) {
		this.user = user;
	}

	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public String getContent() {
		return content;
	}

	public void setContent(String content) {
		this.content = content;
	}

	public String getImageUrl() {
		return imageUrl;
	}

	public void setImageUrl(String imageUrl) {
		this.imageUrl = imageUrl;
	}

	public Boolean getOfficial() {
		return isOfficial;
	}

	public void setOfficial(Boolean official) {
		isOfficial = official;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(LocalDateTime createdAt) {
		this.createdAt = createdAt;
	}

	public Set<Place> getRelatedPlaces() {
		return relatedPlaces;
	}

	public void setRelatedPlaces(Set<Place> relatedPlaces) {
		this.relatedPlaces = relatedPlaces;
	}
}