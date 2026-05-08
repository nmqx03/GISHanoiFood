package com.webgis.hanoifood.security;

import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtUtil {

    private static final String SECRET_KEY = "mysecretkeymysecretkeymysecretkey123"; // chìa 
    private static final long EXPIRATION = 1000L * 60 * 60 * 24 * 30; 


    private final SecretKey key = Keys.hmacShaKeyFor(SECRET_KEY.getBytes());  // key

    // Sinh token có userId + email + role
    public String generateToken(Long userId, String email, String role) {
        return Jwts.builder()
                .subject(email)
                .claim("userId", userId)
                .claim("role", role)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + EXPIRATION))
                .signWith(key)
                .compact();
    }
    
    // Lấy email từ token
    public String getEmail(String token) {
        return parseClaims(token).getSubject();
    }

    //  Lấy userId từ token
    public Long getUserId(String token) {
        return parseClaims(token).get("userId", Long.class);
    }

    // Lấy role từ token
    public String getRole(String token) {
        return parseClaims(token).get("role", String.class);
    }

    // Kiểm tra token hợp lệ
    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException e) {
            return false;
        }
    }



    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token) //xac thuc chu ky
                .getPayload(); // phan payload
    }
   

}
