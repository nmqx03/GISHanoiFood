package com.webgis.hanoifood.service;

import com.webgis.hanoifood.dto.ChangePasswordRequest;
import com.webgis.hanoifood.dto.UpdateProfileRequest;
import com.webgis.hanoifood.entity.User;
import com.webgis.hanoifood.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;
    
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private FileStorageService fileStorageService;
    
 
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
  
  
    @Transactional
    public User updateUserRole(Long userId, String newRole) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        if (!newRole.equals("USER") && !newRole.equals("EDITOR") && !newRole.equals("ADMIN")) {
            throw new RuntimeException("Vai trò không hợp lệ");
        }
        user.setRole(newRole);
        return userRepository.save(user);
    }
    @Transactional
    public User updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

       
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new RuntimeException("Email này đã được sử dụng bởi người khác");
            }
            user.setEmail(request.getEmail());
        }

  
        if (request.getFullName() != null && !request.getFullName().isEmpty()) {
            user.setFullName(request.getFullName());
        }

    
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }

        return userRepository.save(user);
    }


    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

     
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Mật khẩu hiện tại không chính xác");
        }

     
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
    @Transactional
    public String uploadUserAvatar(Long userId, MultipartFile file) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        String relativePath = fileStorageService.saveFile(file, "avatars");

        String avatarUrl = "/uploads/" + relativePath;

       
        user.setAvatarUrl(avatarUrl);
        userRepository.save(user);

        return avatarUrl;
    }
    @Transactional
    public void deleteUser(Long targetUserId, String requesterRole) {
        if (!"ADMIN".equals(requesterRole)) {
            throw new RuntimeException("Bạn không có quyền thực hiện hành động này!");
        }

        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));

        if ("ADMIN".equals(user.getRole())) {
            throw new RuntimeException("Không thể xóa tài khoản Quản trị viên cấp cao!");
        }

        userRepository.delete(user);
    }
}

