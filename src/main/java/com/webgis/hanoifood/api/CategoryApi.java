package com.webgis.hanoifood.api;

import com.webgis.hanoifood.entity.Category;
import com.webgis.hanoifood.service.CategoryService;
import com.webgis.hanoifood.security.JwtUtil; 
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/categories")
public class CategoryApi {

    @Autowired
    private CategoryService categoryService;
    
    @Autowired
    private JwtUtil jwtUtil; 

    @GetMapping
    public ResponseEntity<List<Category>> getAllCategories() {
        return ResponseEntity.ok(categoryService.getAllCategory());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Category> getCategoryById(@PathVariable Long id) {
        Optional<Category> category = categoryService.getByIdCategory(id);
        return category.map(ResponseEntity::ok)
                       .orElse(ResponseEntity.notFound().build()); 
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getStats() {
        return ResponseEntity.ok(categoryService.getCategoryStatistics());
    }

    @PostMapping
    public ResponseEntity<?> createCategory(
            @RequestPart("category") Category category,
            @RequestPart(value = "iconFile", required = false) MultipartFile iconFile,
            @RequestHeader("Authorization") String authHeader) { 
        try {
            String token = authHeader.substring(7);
            String role = jwtUtil.getRole(token);
            Long userId = jwtUtil.getUserId(token);
            
      
            Category savedCategory = categoryService.addCategory(category, iconFile, userId, role);
            return ResponseEntity.ok(savedCategory);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updateCategory(
            @PathVariable Long id,
            @RequestPart("category") Category category,
            @RequestPart(value = "iconFile", required = false) MultipartFile iconFile,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String role = jwtUtil.getRole(token);
            Long userId = jwtUtil.getUserId(token);

   
            Optional<Category> updated = categoryService.updateCategory(id, category, iconFile, userId, role);
            return updated.<ResponseEntity<?>>map(ResponseEntity::ok)
                          .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCategory(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) { 
        try {
            String token = authHeader.substring(7);
            String role = jwtUtil.getRole(token);
            Long userId = jwtUtil.getUserId(token);

        
            Boolean deleted = categoryService.deleteCategory(id, userId, role);
            return deleted ? ResponseEntity.noContent().build() 
                           : ResponseEntity.notFound().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}