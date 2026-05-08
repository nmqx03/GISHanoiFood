package com.webgis.hanoifood.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.webgis.hanoifood.entity.Specialty;
import com.webgis.hanoifood.repository.SpecialtyRepository;

@Service
public class SpecialtyService {

    @Autowired
    private SpecialtyRepository specialtyRepo;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private SystemLogService systemLogService;

    public List<Specialty> getAllSpecialties() {
        return specialtyRepo.findAll();
    }

    public Optional<Specialty> getByIdSpecialty(Long id) {
        return specialtyRepo.findById(id);
    }

    @Transactional
    public Specialty addSpecialty(Specialty specialty, MultipartFile imageFile, Long userId, String role) {

        if (!"ADMIN".equals(role) && !"EDITOR".equals(role)) {
            throw new RuntimeException("Không có quyền thêm đặc sản");
        }

        if (imageFile != null && !imageFile.isEmpty()) {
            String filePath = fileStorageService.saveFile(imageFile, "images/specialties");
            specialty.setImageUrl(filePath);
        }
        Specialty saved = specialtyRepo.save(specialty);

        systemLogService.saveLog(userId, "CREATE_SPECIALTY", "Thêm đặc sản: " + saved.getName());

        return saved;
    }

    @Transactional
    public Optional<Specialty> updateSpecialty(Long id, Specialty newSpecialty, MultipartFile imageFile, Long userId, String role) {
       
        if (!"ADMIN".equals(role) && !"EDITOR".equals(role)) {
            throw new RuntimeException("Không có quyền chỉnh sửa đặc sản");
        }

        return specialtyRepo.findById(id).map(specialty -> {
            String oldName = specialty.getName(); 

            specialty.setName(newSpecialty.getName());
            specialty.setDescription(newSpecialty.getDescription());
            specialty.setPriceRange(newSpecialty.getPriceRange());
            specialty.setOrigin(newSpecialty.getOrigin());

            if (imageFile != null && !imageFile.isEmpty()) {
                String filePath = fileStorageService.saveFile(imageFile, "images/specialties");
                specialty.setImageUrl(filePath);
            }

            Specialty updated = specialtyRepo.save(specialty);

            systemLogService.saveLog(userId, "UPDATE_SPECIALTY", 
                "Cập nhật đặc sản ID " + id + ": " + oldName + " -> " + updated.getName());

            return updated;
        });
    }
    
    @Transactional
    public Boolean deleteSpecialty(Long id, Long userId, String role) {
     
        if (!"ADMIN".equals(role) && !"EDITOR".equals(role)) {
            throw new RuntimeException("Chỉ Admin hoặc Editor mới có quyền xóa đặc sản");
        }

        return specialtyRepo.findById(id).map(specialty -> {
            String name = specialty.getName();
            specialtyRepo.delete(specialty);

            systemLogService.saveLog(userId, "DELETE_SPECIALTY", "Xóa đặc sản: " + name);

            return true;
        }).orElse(false);
    }
}