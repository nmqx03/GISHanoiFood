package com.webgis.hanoifood.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.webgis.hanoifood.entity.Post;
import com.webgis.hanoifood.security.JwtUtil;
import com.webgis.hanoifood.service.FileStorageService;
import com.webgis.hanoifood.service.PostService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/posts")
@CrossOrigin(origins = "http://localhost:5173")
public class PostApi {

    @Autowired
    private PostService postService;

    @Autowired
    private JwtUtil jwtUtil;
    
    @Autowired
    private FileStorageService fileStorageService;
    
    @GetMapping
    public ResponseEntity<List<Post>> getAllPosts() {
        return ResponseEntity.ok(postService.getAllPosts());
    }

  
    @PostMapping
    public ResponseEntity<?> createPost(
            @RequestPart("post") String postJson,
            @RequestPart(value = "imageFile", required = false) MultipartFile imageFile,
            @RequestParam(value = "placeIds", required = false) List<Long> placeIds, 
            @RequestHeader("Authorization") String authHeader
    ) {
        try {
            String token = authHeader.substring(7);
            String role = jwtUtil.getRole(token);
            Long userId = jwtUtil.getUserId(token);

            ObjectMapper mapper = new ObjectMapper();
            Post post = mapper.readValue(postJson, Post.class);

            Post newPost = postService.createPost(post, imageFile, placeIds, userId, role);
            return ResponseEntity.ok(newPost);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestParam String status, @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String role = jwtUtil.getRole(token);
            Long userId = jwtUtil.getUserId(token);
            return ResponseEntity.ok(postService.updatePostStatus(id, status, userId, role));
        } catch (Exception e) { 
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); 
        }
    }
    

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePost(
            @PathVariable Long id,
            @RequestPart("post") String postJson,
            @RequestPart(value = "imageFile", required = false) MultipartFile imageFile,
            @RequestParam(value = "placeIds", required = false) List<Long> placeIds,
            @RequestHeader("Authorization") String authHeader
    ) {
        try {
            String token = authHeader.substring(7);
            String role = jwtUtil.getRole(token);
            Long userId = jwtUtil.getUserId(token);

            ObjectMapper mapper = new ObjectMapper();
            Post post = mapper.readValue(postJson, Post.class);

            return ResponseEntity.ok(
                    postService.updatePost(id, post, imageFile, placeIds, userId, role)
            );

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePost(@PathVariable Long id, @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String role = jwtUtil.getRole(token);
            Long userId = jwtUtil.getUserId(token);
     
            postService.deletePost(id, userId, role);
            return ResponseEntity.ok(Map.of("message", "Xóa bài viết thành công"));
        } catch (Exception e) { 
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); 
        }
    }
    
    @GetMapping("/my")
    public ResponseEntity<?> getMyPosts(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            Long userId = jwtUtil.getUserId(token); 
            
            List<Post> myPosts = postService.getPostsByUserId(userId); 
            
            return ResponseEntity.ok(myPosts);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", "Vui lòng đăng nhập để xem bài viết"));
        }
    }

    @PostMapping("/upload-editor-image")
    public ResponseEntity<?> uploadEditorImage(@RequestParam("file") MultipartFile file) {
        try {
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "File không hợp lệ"));
            }
            String fileUrl = fileStorageService.saveFile(file, "images/content");
            return ResponseEntity.ok(Map.of("url", fileUrl));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Upload thất bại: " + e.getMessage()));
        }
    }
}