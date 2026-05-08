package com.webgis.hanoifood.service;

import com.webgis.hanoifood.dto.AuthRequest;
import com.webgis.hanoifood.dto.AuthResponse;
import com.webgis.hanoifood.dto.RegisterRequest;
import com.webgis.hanoifood.entity.User;
import com.webgis.hanoifood.repository.UserRepository;
import com.webgis.hanoifood.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    // Đăng ký người dùng
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email đã tồn tại");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setRole("USER");
 
        
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole());
        
  
        return new AuthResponse(
            user.getId(), 
            token, 
            user.getRole(), 
            user.getFullName(), 
            user.getEmail(),
            user.getAvatarUrl() 
        );
    }

    // Đăng nhập thường
    public AuthResponse login(AuthRequest request) {
        User user = userRepository.findByEmail(request.getEmail()) 
                .orElseThrow(() -> new RuntimeException("Email không tồn tại"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Sai mật khẩu");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole());
        
        
        return new AuthResponse(
            user.getId(), 
            token, 
            user.getRole(), 
            user.getFullName(), 
            user.getEmail(),
            user.getAvatarUrl()
        );
    }

    // Đăng nhập admin
    public AuthResponse adminLogin(AuthRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Email không tồn tại"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Sai mật khẩu");
        }

     
        String role = user.getRole().toUpperCase();
        if (!"ADMIN".equals(role) && !"EDITOR".equals(role)) {
            throw new RuntimeException("Tài khoản này không có quyền truy cập trang quản trị");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole());
        
        return new AuthResponse(
            user.getId(), 
            token, 
            user.getRole(), 
            user.getFullName(), 
            user.getEmail(),
            user.getAvatarUrl()
        );
    }
}