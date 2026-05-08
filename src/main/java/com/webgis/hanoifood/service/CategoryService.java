package com.webgis.hanoifood.service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.webgis.hanoifood.entity.Category;
import com.webgis.hanoifood.entity.Place;
import com.webgis.hanoifood.repository.CategoryRepository;
import com.webgis.hanoifood.repository.PlaceRepository;

@Service
public class CategoryService {
    
    @Autowired
    private CategoryRepository cateRepo;

    @Autowired
    private FileStorageService fileStorageService; 

    @Autowired
    private SystemLogService systemLogService; 
    
    @Autowired
    private PlaceRepository placeRepo;

    public List<Category> getAllCategory() {
        return cateRepo.findAll();
    }

    public Optional<Category> getByIdCategory(Long id) {
        return cateRepo.findById(id);
    }

    
    @Transactional
    public Category addCategory(Category category, MultipartFile iconFile, Long userId, String role) {
       
        if (!"ADMIN".equals(role) && !"EDITOR".equals(role)) {
            throw new RuntimeException("Không có quyền thêm danh mục");
        }

        if (iconFile != null && !iconFile.isEmpty()) {
            String filePath = fileStorageService.saveFile(iconFile, "images/categories");
            category.setIcon(filePath); 
        }
        Category saved = cateRepo.save(category);
        
        // Ghi log
        systemLogService.saveLog(userId, "CREATE_CATEGORY", "Thêm danh mục: " + saved.getName());
        
        return saved;
    }


    @Transactional
    public Optional<Category> updateCategory(Long id, Category newCategory, MultipartFile iconFile, Long userId, String role) {
      
        if (!"ADMIN".equals(role) && !"EDITOR".equals(role)) {
            throw new RuntimeException("Không có quyền sửa danh mục");
        }

        return cateRepo.findById(id).map(category -> {
            String oldName = category.getName(); 
            
            category.setName(newCategory.getName());
            category.setStatus(newCategory.getStatus());

            if (iconFile != null && !iconFile.isEmpty()) {
                String filePath = fileStorageService.saveFile(iconFile, "images/categories");
                category.setIcon(filePath);
            }

            Category updated = cateRepo.save(category);
            
            systemLogService.saveLog(userId, "UPDATE_CATEGORY", "Cập nhật danh mục ID " + id + ": " + oldName + " -> " + updated.getName());
            
            return updated;
        });
    }

   
    @Transactional
    public Boolean deleteCategory(Long id, Long userId, String role) {
      
        if (!"ADMIN".equals(role) && !"EDITOR".equals(role)) {
            throw new RuntimeException("Chỉ Admin hoặc Editor mới có quyền xóa");
        }

        return cateRepo.findById(id).map(category -> {
            String name = category.getName();
            cateRepo.delete(category);
            
       
            systemLogService.saveLog(userId, "DELETE_CATEGORY", "Xóa danh mục: " + name);
            
            return true;
        }).orElse(false);
    }
    
    public Map<String, Long> getCategoryStatistics() {
        List<Place> places = placeRepo.findAll();
        // Gom nhóm theo tên Category và đếm số lượng
        return places.stream()
                .filter(p -> p.getCategory() != null) 
                .collect(Collectors.groupingBy(
                        p -> p.getCategory().getName(),
                        Collectors.counting()
                ));
    }
}