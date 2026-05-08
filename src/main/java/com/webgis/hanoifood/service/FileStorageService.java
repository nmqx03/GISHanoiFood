package com.webgis.hanoifood.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@Service
public class FileStorageService {

    
    private final String UPLOAD_DIR = "uploads/";

    public String saveFile(MultipartFile file, String subDir) {
        try {
            // Tạo thư mục upload + subDir nếu chưa tồn tại
            Path uploadPath = Paths.get(UPLOAD_DIR + subDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Tạo tên file duy nhất để tránh trùng
            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            Path filePath = uploadPath.resolve(fileName); 

            // Lưu file
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Trả về đường dẫn lưu trong DB 
            return subDir + "/" + fileName;

        } catch (IOException e) {
            throw new RuntimeException(" Lỗi khi lưu file: " + e.getMessage());
        }
    }
}
