package com.webgis.hanoifood.dto;

public class AuthResponse {
    private Long id; 
    private String token;
    private String role;
    private String fullName;
    private String email;
    private String avatarUrl;

    
    public AuthResponse(Long id, String token, String role, String fullName, String email, String avatarUrl) {
        this.id = id;
        this.token = token;
        this.role = role;
        this.fullName = fullName;
        this.email = email;
        this.avatarUrl = avatarUrl;
        
    }

    

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }



	public String getAvatarUrl() {
		return avatarUrl;
	}



	public void setAvatarUrl(String avatarUrl) {
		this.avatarUrl = avatarUrl;
	}
    
}